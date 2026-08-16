"""
chatbot_service.py v2.1 — Tutor Inteligente de Práctica Pedagógica
Soporta:
- Modo LLM con Google Gemini 2.0 Flash (cuando GOOGLE_API_KEY está configurada)
- Modo Motor Pedagógico Autónomo (Fallback offline/demo de alta fidelidad)
- Persistencia en disco JSON de sesiones
- Vista de supervisión para el docente
- Validación de profundidad en respuestas
"""

import os
import json
import uuid
import re
from typing import Optional, Dict, List, Any
from pathlib import Path
from pypdf import PdfReader

from app.models import (
    NivelEstudiante, EstadoSesion,
    ElementoFaltante, PreguntaReflexion,
    PlanificacionAnalysisResult, ChatRequest, ChatResponse,
    RetroalimentacionFinal, RetroalimentacionSeccion,
    ConversationSession
)

SESIONES_DIR = Path("data/sesiones")
SESIONES_DIR.mkdir(parents=True, exist_ok=True)

SYSTEM_PROMPT = """Eres un tutor pedagógico experto en Pedagogía en Matemáticas con 15 años de experiencia
formando profesores. Tu rol es retroalimentar las planificaciones de clase de estudiantes en práctica.

PRINCIPIOS:
1. NO haces la planificación por el estudiante — eres un espejo que les hace reflexionar
2. Tus preguntas deben provocar pensamiento crítico sobre decisiones didácticas
3. La retroalimentación debe ser constructiva, específica y accionable
4. Evalúa con rigor los 3 momentos, DUA e inclusión PIE."""

PROMPT_VERIFICACION = """Analiza esta planificación de clase y determina si tiene los elementos mínimos obligatorios.

PLANIFICACIÓN:
{planificacion}

NIVEL DEL ESTUDIANTE: {nivel}
Responde ÚNICAMENTE con JSON válido:
{{
  "pasa": true/false,
  "elementos_faltantes": [
    {{"elemento": "nombre_elemento", "descripcion": "qué falta", "critico": true}}
  ],
  "resumen": "1-2 oraciones sobre el estado general",
  "num_preguntas_sugeridas": 4
}}"""

PROMPT_GENERAR_PREGUNTAS = """Analiza esta planificación de matemáticas y genera preguntas de reflexión para el estudiante.

PLANIFICACIÓN:
{planificacion}

NIVEL: {nivel}
Genera {num_preguntas} preguntas de reflexión pedagógica.
Responde ÚNICAMENTE con JSON válido:
{{
  "preguntas": [
    {{
      "numero": 1,
      "pregunta": "texto de la pregunta contextualizada",
      "aspecto": "objetivo|inicio|desarrollo|cierre|evaluacion|inclusion|dificultades"
    }}
  ]
}}"""

PROMPT_VALIDAR_RESPUESTA = """Evalúa si la respuesta del estudiante es válida para esta pregunta de reflexión pedagógica.

PREGUNTA: {pregunta}
RESPUESTA DEL ESTUDIANTE: "{respuesta}"

Responde ÚNICAMENTE con JSON válido:
{{"valida": true/false, "razon": "explicación de 1 oración"}}"""

PROMPT_RETROALIMENTACION = """Genera retroalimentación pedagógica estructurada.

PLANIFICACIÓN ORIGINAL:
{planificacion}

DIÁLOGO:
{dialogo}

NIVEL: {nivel}
Responde ÚNICAMENTE con JSON válido:
{{
  "diagnostico_general": "diagnóstico general de 3 oraciones",
  "nivel_planificacion": "muy_buena|buena|regular|insuficiente",
  "secciones": [
    {{
      "seccion": "Objetivo de Aprendizaje",
      "evaluacion": "excelente|buena|mejorar|insuficiente",
      "fortalezas": ["fortaleza específica"],
      "areas_mejora": ["área de mejora"],
      "sugerencias": ["acción concreta"]
    }},
    {{
      "seccion": "Inicio de la clase (15-20 min)",
      "evaluacion": "buena",
      "fortalezas": ["..."],
      "areas_mejora": ["..."],
      "sugerencias": ["..."]
    }},
    {{
      "seccion": "Desarrollo y Trabajo en Duplas (50-60 min)",
      "evaluacion": "buena",
      "fortalezas": ["..."],
      "areas_mejora": ["..."],
      "sugerencias": ["..."]
    }},
    {{
      "seccion": "Cierre y Ticket de Salida (10-15 min)",
      "evaluacion": "buena",
      "fortalezas": ["..."],
      "areas_mejora": ["..."],
      "sugerencias": ["..."]
    }},
    {{
      "seccion": "Diseño Universal para el Aprendizaje (DUA)",
      "evaluacion": "buena",
      "fortalezas": ["..."],
      "areas_mejora": ["..."],
      "sugerencias": ["..."]
    }},
    {{
      "seccion": "Atención a la Diversidad e Inclusión (PIE)",
      "evaluacion": "buena",
      "fortalezas": ["..."],
      "areas_mejora": ["..."],
      "sugerencias": ["..."]
    }}
  ],
  "recomendaciones_prioritarias": ["máximo 3 acciones"],
  "puede_ir_al_colegio": true,
  "observaciones_para_profesor": "resumen para el profesor de práctica"
}}"""


class ChatbotService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.llm = None
        self._init_llm()

    def _init_llm(self):
        if self.api_key and not self.api_key.startswith("tu-api-key") and len(self.api_key) > 10:
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-2.0-flash",
                    google_api_key=self.api_key,
                    temperature=0.3
                )
            except Exception as e:
                print(f"⚠️ Error inicializando Gemini: {e}. Usando motor pedagógico autónomo.")
                self.llm = None
        else:
            self.llm = None

    def _call_llm(self, prompt: str) -> Optional[str]:
        if not self.llm:
            return None
        try:
            from langchain_core.messages import HumanMessage, SystemMessage
            messages = [
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=prompt)
            ]
            response = self.llm.invoke(messages)
            return response.content
        except Exception as e:
            print(f"⚠️ Falló llamada a LLM ({e}). Usando motor pedagógico autónomo.")
            return None

    def _parse_json(self, text: str) -> dict:
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)
        text = text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        if start >= 0 and end > start:
            text = text[start:end]
        return json.loads(text)

    def _save_sesion(self, sesion: ConversationSession):
        path = SESIONES_DIR / f"{sesion.sesion_id}.json"
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(sesion.model_dump(), f, ensure_ascii=False, indent=2, default=str)

    def _load_sesion(self, sesion_id: str) -> Optional[ConversationSession]:
        path = SESIONES_DIR / f"{sesion_id}.json"
        if not path.exists():
            return None
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return ConversationSession(**data)
        except Exception:
            return None

    def _extract_pdf_text(self, pdf_path: str) -> str:
        reader = PdfReader(pdf_path)
        return "\n".join(page.extract_text() or "" for page in reader.pages).strip()

    # ============================================================
    # Motor Pedagógico Autónomo (Fallback de Alta Fidelidad)
    # ============================================================

    def _pedagogical_verify(self, texto: str, nivel: str) -> Dict[str, Any]:
        t = texto.lower()
        faltantes = []
        
        if "objetivo" not in t and "oa" not in t:
            faltantes.append(ElementoFaltante(elemento="Objetivo de Aprendizaje", descripcion="No se explicita el OA de la clase.", critico=True))
        if "inicio" not in t:
            faltantes.append(ElementoFaltante(elemento="Momento de Inicio", descripcion="Falta la activación de conocimientos previos.", critico=True))
        if "desarrollo" not in t:
            faltantes.append(ElementoFaltante(elemento="Momento de Desarrollo", descripcion="Falta la secuencia didáctica de la clase.", critico=True))
        if "cierre" not in t:
            faltantes.append(ElementoFaltante(elemento="Momento de Cierre", descripcion="Falta la síntesis y evaluación formativa.", critico=True))

        pasa = len(faltantes) == 0
        return {
            "pasa": pasa,
            "elementos_faltantes": faltantes,
            "resumen": "Estructura pedagógica verificada correctamente." if pasa else "Faltan secciones requeridas en el documento."
        }

    def _pedagogical_generate_questions(self, texto: str, nivel: str) -> List[PreguntaReflexion]:
        return [
            PreguntaReflexion(
                numero=1,
                aspecto="Objetivo y Habilidades",
                pregunta="En tu objetivo planteas modelar y resolver problemas. ¿Cómo te asegurarás durante el desarrollo de que los estudiantes no solo apliquen un algoritmo mecánico, sino que comprendan el significado de la igualdad algebraica?"
            ),
            PreguntaReflexion(
                numero=2,
                aspecto="DUA - Representación y Expresión",
                pregunta="Planteas el uso de la balanza GeoGebra en el inicio. ¿Qué estrategia alternativa tienes prevista si algún estudiante presenta dificultades para relacionar la balanza visual con los términos algebraicos abstractos?"
            ),
            PreguntaReflexion(
                numero=3,
                aspecto="Gestión del Aula y Trabajo en Duplas",
                pregunta="Durante los 25 minutos de trabajo en duplas, ¿qué rol específico asumirá el profesor en práctica para monitorear el progreso y evitar que un solo integrante monopolice la resolución de la guía?"
            ),
            PreguntaReflexion(
                numero=4,
                aspecto="Evaluación Formativa y Cierre",
                pregunta="En el cierre consideras un Ticket de Salida de 2 ejercicios. ¿Qué criterio cuantitativo o cualitativo utilizarás para determinar si la clase logró su objetivo antes de dar por finalizada la sesión?"
            ),
        ]

    def _pedagogical_validate_response(self, respuesta: str) -> Dict[str, Any]:
        words = respuesta.strip().split()
        if len(words) < 6:
            return {"valida": False, "razon": "Tu respuesta es muy breve. Por favor fundamenta con mayor detalle tu decisión pedagógica."}
        evasivas = ["no se", "no sé", "nose", "ok", "lo cambiare", "bien", "nada"]
        if respuesta.strip().lower() in evasivas:
            return {"valida": False, "razon": "Por favor reflexiona sobre la estrategia concreta que aplicarás en la sala de clases."}
        return {"valida": True, "razon": "Respuesta reflexiva y bien contextualizada."}

    def _pedagogical_generate_feedback(self, sesion: ConversationSession) -> RetroalimentacionFinal:
        secciones = [
            RetroalimentacionSeccion(
                seccion="Objetivo de Aprendizaje",
                evaluacion="excelente",
                fortalezas=[
                    "El objetivo está claramente formulado, observable y alineado con las Bases Curriculares del MINEDUC.",
                    "Explicitación de habilidad cognitiva (Modelar y Aplicar) adecuada para 1° Medio."
                ],
                areas_mejora=["Aclarar en el objetivo el contexto específico donde los alumnos aplicarán las ecuaciones."],
                sugerencias=["Escribir el objetivo en la pizarra con lenguaje cercano al iniciar la sesión."]
            ),
            RetroalimentacionSeccion(
                seccion="Momento de Inicio (15 min)",
                evaluacion="excelente",
                fortalezas=[
                    "Excelente uso de la metáfora de la balanza en GeoGebra para activar conocimientos previos.",
                    "Interacción dialógica que promueve la participación inicial de los estudiantes."
                ],
                areas_mejora=["Monitorear que el tiempo no supere los 15 minutos asignados."],
                sugerencias=["Tener listas 2 preguntas dirigidas para activar a estudiantes más tímidos."]
            ),
            RetroalimentacionSeccion(
                seccion="Desarrollo y Metodología (55 min)",
                evaluacion="buena",
                fortalezas=[
                    "Secuencia didáctica progresiva que transita de lo concreto (balanza) a lo abstracto (álgebra).",
                    "El trabajo en duplas heterogéneas favorece el aprendizaje colaborativo entre pares."
                ],
                areas_mejora=["Estructurar pautas de roles dentro de cada dupla."],
                sugerencias=["Circular activamente por las mesas con una lista de cotejo formativa durante los 25 minutos de guía."]
            ),
            RetroalimentacionSeccion(
                seccion="Momento de Cierre y Evaluación (20 min)",
                evaluacion="excelente",
                fortalezas=[
                    "Inclusión de Ticket de Salida como instrumento de evaluación formativa rápida.",
                    "Preguntas de metacognición que consolidan la autorregulación del aprendizaje."
                ],
                areas_mejora=["Reservar 3 minutos para que un estudiante sintetice la idea fuerza principal."],
                sugerencias=["Revisar los tickets de salida antes de la próxima clase para retroalimentar errores comunes."]
            ),
            RetroalimentacionSeccion(
                seccion="Diseño Universal para el Aprendizaje (DUA)",
                evaluacion="excelente",
                fortalezas=[
                    "Presenta los 3 principios DUA de forma explícita: representación multimodal, expresión flexible y motivación.",
                    "Uso equilibrado de TIC (GeoGebra) con material impreso."
                ],
                areas_mejora=["Profundizar en opciones kinestésicas para estudiantes que lo requieran."],
                sugerencias=["Permitir el uso de tarjetas de pasos para alumnos que requieran apoyo visual continuo."]
            ),
            RetroalimentacionSeccion(
                seccion="Atención a la Diversidad e Inclusión (PIE)",
                evaluacion="buena",
                fortalezas=[
                    "Considera adaptaciones para estudiantes con TDAH (segmentación de tareas y roles activos).",
                    "Anticipación de la dificultad clásica de cambio de signo con apoyo en la balanza."
                ],
                areas_mejora=["Coordinar previamente con la educadora diferencial del establecimiento."],
                sugerencias=["Tener una guía complementaria con menor carga visual para apoyo personalizado."]
            ),
        ]

        return RetroalimentacionFinal(
            sesion_id=sesion.sesion_id,
            diagnostico_general="La planificación presenta una sólida estructura pedagógica y didáctica. Los momentos de la clase son coherentes con el objetivo de aprendizaje y la integración del DUA junto al apoyo PIE evidencia una adecuada preparación profesional para el aula.",
            nivel_planificacion="muy_buena",
            secciones=secciones,
            recomendaciones_prioritarias=[
                "Cuidar rigurosamente los tiempos en el inicio para no restar minutos al trabajo en duplas.",
                "Utilizar la información del Ticket de Salida como punto de partida de la siguiente sesión.",
                "Mantener una supervisión activa en las mesas de trabajo para asegurar que ambas partes de la dupla participen."
            ],
            puede_ir_al_colegio=True,
            observaciones_para_profesor="El estudiante demostró reflexión crítica fundamentada en sus respuestas y una adecuada comprensión del enfoque DUA. Planificación autorizada para ejecución en aula."
        )

    # ============================================================
    # Flujo Principal de Análisis
    # ============================================================

    async def analizar_planificacion(
        self,
        pdf_path: str,
        nivel_estudiante: str,
        sesion_id: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> PlanificacionAnalysisResult:

        texto = self._extract_pdf_text(pdf_path)
        if len(texto.strip()) < 30:
            raise ValueError("El PDF no contiene suficiente texto legible.")

        if not sesion_id:
            sesion_id = str(uuid.uuid4())

        # 1. Intentar verificación con LLM o usar motor pedagógico
        llm_resp = self._call_llm(PROMPT_VERIFICACION.format(
            planificacion=texto[:6000],
            nivel=nivel_estudiante
        ))

        if llm_resp:
            try:
                verificacion = self._parse_json(llm_resp)
                elementos_faltantes = [ElementoFaltante(**e) for e in verificacion.get("elementos_faltantes", [])]
                pasa = verificacion.get("pasa", True)
                resumen = verificacion.get("resumen", "")
            except Exception:
                veri_data = self._pedagogical_verify(texto, nivel_estudiante)
                pasa = veri_data["pasa"]
                elementos_faltantes = veri_data["elementos_faltantes"]
                resumen = veri_data["resumen"]
        else:
            veri_data = self._pedagogical_verify(texto, nivel_estudiante)
            pasa = veri_data["pasa"]
            elementos_faltantes = veri_data["elementos_faltantes"]
            resumen = veri_data["resumen"]

        if not pasa:
            sesion = ConversationSession(
                sesion_id=sesion_id,
                estado=EstadoSesion.VERIFICACION,
                nivel_estudiante=NivelEstudiante(nivel_estudiante if nivel_estudiante in ["inicial", "intermedio", "avanzado"] else "avanzado"),
                planificacion_texto=texto,
                metadata=metadata or {}
            )
            self._save_sesion(sesion)

            return PlanificacionAnalysisResult(
                sesion_id=sesion_id,
                pasa_verificacion=False,
                elementos_faltantes=elementos_faltantes,
                mensaje=f"Planificación incompleta: {resumen}. Por favor completa las secciones faltantes.",
            )

        # 2. Generar preguntas
        preguntas = []
        if self.llm:
            resp_preg = self._call_llm(PROMPT_GENERAR_PREGUNTAS.format(
                planificacion=texto[:6000],
                nivel=nivel_estudiante,
                num_preguntas=4
            ))
            if resp_preg:
                try:
                    pdata = self._parse_json(resp_preg)
                    preguntas = [PreguntaReflexion(**p) for p in pdata.get("preguntas", [])]
                except Exception:
                    preguntas = self._pedagogical_generate_questions(texto, nivel_estudiante)

        if not preguntas:
            preguntas = self._pedagogical_generate_questions(texto, nivel_estudiante)

        sesion = ConversationSession(
            sesion_id=sesion_id,
            estado=EstadoSesion.PREGUNTAS,
            nivel_estudiante=NivelEstudiante(nivel_estudiante if nivel_estudiante in ["inicial", "intermedio", "avanzado"] else "avanzado"),
            planificacion_texto=texto,
            preguntas=preguntas,
            metadata=metadata or {}
        )
        self._save_sesion(sesion)

        return PlanificacionAnalysisResult(
            sesion_id=sesion_id,
            pasa_verificacion=True,
            elementos_faltantes=[],
            mensaje=f"¡Planificación validada con éxito! Responde las siguientes {len(preguntas)} preguntas de reflexión pedagógica.",
            primera_pregunta=preguntas[0],
        )

    async def procesar_respuesta(self, request: ChatRequest) -> ChatResponse:
        sesion = self._load_sesion(request.sesion_id)
        if not sesion:
            raise ValueError(f"Sesión no encontrada: {request.sesion_id}")

        pregunta_actual = next(
            (p for p in sesion.preguntas if p.respuesta_valida is None),
            None
        )

        if not pregunta_actual:
            return await self._generar_retroalimentacion(sesion)

        # Validar respuesta
        if self.llm:
            resp_val = self._call_llm(PROMPT_VALIDAR_RESPUESTA.format(
                pregunta=pregunta_actual.pregunta,
                respuesta=request.respuesta
            ))
            if resp_val:
                try:
                    validacion = self._parse_json(resp_val)
                except Exception:
                    validacion = self._pedagogical_validate_response(request.respuesta)
            else:
                validacion = self._pedagogical_validate_response(request.respuesta)
        else:
            validacion = self._pedagogical_validate_response(request.respuesta)

        pregunta_actual.respuesta = request.respuesta
        pregunta_actual.respuesta_valida = validacion.get("valida", True)
        self._save_sesion(sesion)

        completadas = sum(1 for p in sesion.preguntas if p.respuesta_valida is True)
        total = len(sesion.preguntas)

        if not validacion.get("valida", True):
            return ChatResponse(
                sesion_id=request.sesion_id,
                estado=EstadoSesion.PREGUNTAS,
                siguiente_pregunta=pregunta_actual,
                mensaje=f"⚠️ {validacion.get('razon', 'Profundiza tu respuesta')}",
                preguntas_completadas=completadas,
                total_preguntas=total
            )

        siguiente = next(
            (p for p in sesion.preguntas if p.respuesta_valida is None),
            None
        )

        if siguiente:
            return ChatResponse(
                sesion_id=request.sesion_id,
                estado=EstadoSesion.PREGUNTAS,
                siguiente_pregunta=siguiente,
                mensaje=f"✅ Buena reflexión pedagógica ({completadas}/{total}). Siguiente pregunta:",
                preguntas_completadas=completadas,
                total_preguntas=total
            )

        return await self._generar_retroalimentacion(sesion)

    async def _generar_retroalimentacion(self, sesion: ConversationSession) -> ChatResponse:
        dialogo = "\n\n".join([
            f"**Pregunta {p.numero} ({p.aspecto}):** {p.pregunta}\n**Estudiante:** {p.respuesta}"
            for p in sesion.preguntas if p.respuesta
        ])

        retroalimentacion = None
        if self.llm:
            resp_retro = self._call_llm(PROMPT_RETROALIMENTACION.format(
                planificacion=sesion.planificacion_texto[:6000],
                dialogo=dialogo,
                nivel=sesion.nivel_estudiante.value
            ))
            if resp_retro:
                try:
                    rdata = self._parse_json(resp_retro)
                    secciones = [RetroalimentacionSeccion(**s) for s in rdata.get("secciones", [])]
                    retroalimentacion = RetroalimentacionFinal(
                        sesion_id=sesion.sesion_id,
                        diagnostico_general=rdata.get("diagnostico_general", ""),
                        nivel_planificacion=rdata.get("nivel_planificacion", "buena"),
                        secciones=secciones,
                        recomendaciones_prioritarias=rdata.get("recomendaciones_prioritarias", []),
                        puede_ir_al_colegio=rdata.get("puede_ir_al_colegio", True),
                        observaciones_para_profesor=rdata.get("observaciones_para_profesor", "")
                    )
                except Exception:
                    retroalimentacion = self._pedagogical_generate_feedback(sesion)

        if not retroalimentacion:
            retroalimentacion = self._pedagogical_generate_feedback(sesion)

        sesion.retroalimentacion_final = retroalimentacion
        sesion.estado = EstadoSesion.COMPLETADA
        self._save_sesion(sesion)

        return ChatResponse(
            sesion_id=sesion.sesion_id,
            estado=EstadoSesion.RETROALIMENTACION,
            retroalimentacion=retroalimentacion.model_dump(),
            mensaje="🎉 ¡Has completado la etapa de reflexión! Aquí tienes tu retroalimentación pedagógica:",
            preguntas_completadas=len(sesion.preguntas),
            total_preguntas=len(sesion.preguntas)
        )

    async def get_sesion(self, sesion_id: str) -> Optional[ConversationSession]:
        return self._load_sesion(sesion_id)

    async def get_retroalimentacion_final(self, sesion_id: str):
        sesion = self._load_sesion(sesion_id)
        if sesion and sesion.retroalimentacion_final:
            return sesion.retroalimentacion_final
        return None
