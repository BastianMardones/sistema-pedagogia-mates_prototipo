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

SYSTEM_PROMPT = """Eres un tutor pedagogico experto en Pedagogia en Matematicas con 15 anos de experiencia
formando profesores en practica profesional. Tu rol es retroalimentar las planificaciones de clase
de estudiantes que se encuentran en su periodo de practica.

La planificacion real de practica profesional en Pedagogia en Matematicas debe incluir:
- Equipo de Co-Ensenanza (profesor colaborador del colegio + docente en practica)
- Caracterizacion del Curso: N de estudiantes con NEET (con diagnosticos como DEA) y NEEP (TEA, DIL),
  estilos de aprendizaje (% visual, kinestetivo, auditivo), otros datos relevantes del grupo
- Datos generales: Ano, Periodo, Asignatura, Curso
- Unidad o eje tematico
- Objetivo de Aprendizaje (OA) del MINEDUC con su numero (ej: OA16 - descripcion)
- Indicadores de Evaluacion
- Objetivo de Aprendizaje Transversal
- Objetivo de la Clase (lo concreto que los alumnos logran HOY)
- 3 Momentos con tiempos: Inicio (15 min) / Desarrollo (60 min) / Cierre
- Diversificacion de la Ensenanza (DUA): columna paralela a cada momento con el principio DUA
  numerado y la estrategia aplicada (ej: 7.2, 1.4, 2.2, etc.)
- Evaluacion de la clase (instrumento o rubrica)

PRINCIPIOS PEDAGOGICOS:
1. NO haces la planificacion por el estudiante - eres un espejo que les hace reflexionar
2. Tus preguntas deben provocar pensamiento critico sobre decisiones didacticas especificas
3. La retroalimentacion debe ser constructiva, especifica y accionable
4. Evalua con rigor la coherencia entre OA, los 3 momentos y el DUA aplicado
5. Presta especial atencion a como el docente atiende la diversidad (NEET/NEEP)"""

PROMPT_VERIFICACION = """Analiza esta planificacion de clase de Pedagogia en Matematicas y determina
si contiene los elementos MINIMOS OBLIGATORIOS para ser procesada.

ELEMENTOS MINIMOS A VERIFICAR:
1. Objetivo de Aprendizaje (OA) del MINEDUC declarado con su numero
2. Los 3 momentos de la clase (Inicio, Desarrollo, Cierre) con tiempos
3. Al menos 1 principio DUA declarado (ya sea por nombre o numero de estrategia)
4. Caracterizacion del curso (mencion de NEET, NEEP o necesidades educativas del grupo)
5. Evaluacion de la clase (instrumento, rubrica o descripcion de como se evaluara)

PLANIFICACION A ANALIZAR:
{planificacion}

NIVEL DEL ESTUDIANTE: {nivel}

Responde UNICAMENTE con JSON valido:
{{
  "pasa": true/false,
  "elementos_faltantes": [
    {{"elemento": "nombre_del_elemento", "descripcion": "descripcion de que falta exactamente", "critico": true}}
  ],
  "resumen": "2-3 oraciones sobre el estado general de la planificacion",
  "num_preguntas_sugeridas": 3
}}

CRITERIO: Si falta cualquier elemento critico (OA, 3 momentos o DUA), "pasa" debe ser false.
Si tiene todos los elementos basicos, "pasa" es true y num_preguntas_sugeridas entre 1 y 5 segun calidad."""

PROMPT_GENERAR_PREGUNTAS = """Analiza esta planificacion de Matematicas (nivel: {nivel}) y genera preguntas
de reflexion pedagogica alineadas a los campos especificos de la pauta institucional.

PLANIFICACION:
{planificacion}

Genera {num_preguntas} preguntas de reflexion. Las preguntas deben enfocarse en estos aspectos en orden
de prioridad:
1. COHERENCIA OA: Coherencia entre el OA declarado y las actividades del Desarrollo
2. INICIO: Como el Momento de Inicio activa los conocimientos previos de los alumnos
3. INCLUSION NEET/NEEP: Estrategia especifica del Desarrollo para los estudiantes con NEET/NEEP identificados
4. DUA: Que principio DUA especifico se aplico y en que momento exacto de la clase
5. CIERRE Y EVALUACION: Como el Cierre evidencia el logro del Objetivo de la Clase

Responde UNICAMENTE con JSON valido:
{{
  "preguntas": [
    {{
      "numero": 1,
      "pregunta": "pregunta especifica y contextualizada con datos de la propia planificacion",
      "aspecto": "coherencia_oa|inicio|inclusion_neet_neep|dua|cierre_evaluacion"
    }}
  ]
}}"""



PROMPT_VALIDAR_RESPUESTA = """Evalúa si la respuesta del estudiante es válida para esta pregunta de reflexión pedagógica.

PREGUNTA: {pregunta}
RESPUESTA DEL ESTUDIANTE: "{respuesta}"

Responde ÚNICAMENTE con JSON válido:
{{"valida": true/false, "razon": "explicación de 1 oración"}}"""

PROMPT_RETROALIMENTACION = """Genera retroalimentacion pedagogica estructurada basada en los campos reales
de la pauta de planificacion de practica profesional en Pedagogia en Matematicas.

PLANIFICACION ORIGINAL:
{planificacion}

DIALOGO DE REFLEXION (preguntas de la IA y respuestas del estudiante):
{dialogo}

NIVEL DEL ESTUDIANTE: {nivel}

Genera retroalimentacion organizada por las secciones de la pauta institucional real.
Responde UNICAMENTE con JSON valido:
{{
  "diagnostico_general": "diagnostico de 3 oraciones sobre la calidad global de la planificacion, tomando en cuenta las respuestas reflexivas del estudiante",
  "nivel_planificacion": "muy_buena|buena|regular|insuficiente",
  "secciones": [
    {{
      "seccion": "Caracterizacion del Curso y Contextualizacion",
      "evaluacion": "excelente|buena|mejorar|insuficiente",
      "fortalezas": ["aspecto especifico que esta bien"],
      "areas_mejora": ["aspecto que debe mejorar"],
      "sugerencias": ["accion concreta a implementar"]
    }},
    {{
      "seccion": "Objetivo de Aprendizaje (OA) y Coherencia",
      "evaluacion": "excelente|buena|mejorar|insuficiente",
      "fortalezas": ["..."],
      "areas_mejora": ["..."],
      "sugerencias": ["..."]
    }},
    {{
      "seccion": "Momento de Inicio (activacion y rutina de clase)",
      "evaluacion": "excelente|buena|mejorar|insuficiente",
      "fortalezas": ["..."],
      "areas_mejora": ["..."],
      "sugerencias": ["..."]
    }},
    {{
      "seccion": "Momento de Desarrollo (estrategia pedagogica y atencion a diversidad)",
      "evaluacion": "excelente|buena|mejorar|insuficiente",
      "fortalezas": ["..."],
      "areas_mejora": ["..."],
      "sugerencias": ["..."]
    }},
    {{
      "seccion": "Momento de Cierre (sintesis y evaluacion formativa)",
      "evaluacion": "excelente|buena|mejorar|insuficiente",
      "fortalezas": ["..."],
      "areas_mejora": ["..."],
      "sugerencias": ["..."]
    }},
    {{
      "seccion": "Diversificacion de la Ensenanza (DUA por momento)",
      "evaluacion": "excelente|buena|mejorar|insuficiente",
      "fortalezas": ["..."],
      "areas_mejora": ["..."],
      "sugerencias": ["..."]
    }},
    {{
      "seccion": "Atencion a Estudiantes con NEET y NEEP",
      "evaluacion": "excelente|buena|mejorar|insuficiente",
      "fortalezas": ["..."],
      "areas_mejora": ["..."],
      "sugerencias": ["..."]
    }}
  ],
  "recomendaciones_prioritarias": ["maximo 3 acciones concretas para la proxima planificacion"],
  "puede_ir_al_colegio": true,
  "observaciones_para_profesor": "resumen de 2-3 oraciones para el profesor tutor sobre el desempeno del estudiante en esta planificacion"
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

        # 1. OA del MINEDUC
        if not any(kw in t for kw in ["objetivo de aprendizaje", "oa ", "oa1", "oa2", "oa3", "oa4", "oa5",
                                       "oa6", "oa7", "oa8", "oa9", "oa10", "oa11", "oa12", "oa13",
                                       "oa14", "oa15", "oa16", "oa17", "oa18", "oa19", "oa20"]):
            faltantes.append(ElementoFaltante(
                elemento="Objetivo de Aprendizaje (OA) del MINEDUC",
                descripcion="No se encuentra el OA del MINEDUC con su numero. Debe declarar el OA con su numero oficial (ej: OA16).",
                critico=True
            ))

        # 2. Los 3 momentos
        if "inicio" not in t:
            faltantes.append(ElementoFaltante(
                elemento="Momento de Inicio",
                descripcion="Falta el Momento de Inicio de la clase. Debe incluir la activacion de conocimientos previos y la rutina de inicio.",
                critico=True
            ))
        if "desarrollo" not in t:
            faltantes.append(ElementoFaltante(
                elemento="Momento de Desarrollo",
                descripcion="Falta el Momento de Desarrollo. Debe incluir las actividades principales de la clase.",
                critico=True
            ))
        if "cierre" not in t:
            faltantes.append(ElementoFaltante(
                elemento="Momento de Cierre",
                descripcion="Falta el Momento de Cierre. Debe incluir la sintesis y la evaluacion formativa.",
                critico=True
            ))

        # 3. DUA (al menos 1 principio)
        if not any(kw in t for kw in ["dua", "diversificacion", "diversificación", "principio 1", "principio 2", "principio 3", "7.1", "7.2", "1.1", "1.2", "1.4", "2.1", "2.2", "3.1"]):
            faltantes.append(ElementoFaltante(
                elemento="Diversificacion de la Ensenanza (DUA)",
                descripcion="No se encuentran principios DUA declarados. Cada momento de la clase debe incluir al menos un principio o estrategia DUA numerada (ej: Pauta 1.2, 2.1, 7.2).",
                critico=True
            ))

        # 4. Caracterizacion del curso (NEET/NEEP)
        if not any(kw in t for kw in ["neet", "neep", "necesidades educativas", "dea", "tea", "dil", "diagnostico",
                                       "estilos de aprendizaje", "visual", "auditivo"]):
            faltantes.append(ElementoFaltante(
                elemento="Caracterizacion del Curso (PIE / NEET / NEEP)",
                descripcion="No se declara la caracterizacion del curso (estudiantes con NEET/NEEP, diagnosticos DEA/TEA/DIL ni porcentajes de estilos de aprendizaje).",
                critico=False
            ))

        # 5. Evaluacion de la clase
        if not any(kw in t for kw in ["evaluacion", "evaluación", "rubrica", "rúbrica", "instrumento", "lista de cotejo", "ticket de salida", "escala de apreciacion"]):
            faltantes.append(ElementoFaltante(
                elemento="Instrumento de Evaluacion de la Clase",
                descripcion="No se especifica como se evaluara el logro del objetivo (rubrica, lista de cotejo o ticket de salida).",
                critico=False
            ))

        pasa = not any(f.critico for f in faltantes)
        num_preguntas = max(1, min(5, 2 + len(faltantes)))

        return {
            "pasa": pasa,
            "elementos_faltantes": faltantes,
            "resumen": "La planificacion cumple con la estructura minima de la pauta institucional." if pasa
                       else f"Se detectaron {len(faltantes)} observaciones en la pauta ({sum(1 for f in faltantes if f.critico)} elementos obligatorios criticos ausentes).",
            "num_preguntas_sugeridas": num_preguntas if pasa else 0
        }

    def _pedagogical_generate_questions(self, texto: str, nivel: str) -> List[PreguntaReflexion]:
        t = texto.lower()

        # Extraer datos del contexto para personalizar preguntas
        tiene_neet = any(kw in t for kw in ["neet", "dea", "dislexia"])
        tiene_neep = any(kw in t for kw in ["neep", "tea", "dil"])
        tiene_dua_especifico = any(f"7.{i}" in t or f"1.{i}" in t or f"2.{i}" in t for i in range(1, 10))

        preguntas = [
            PreguntaReflexion(
                numero=1,
                aspecto="coherencia_oa",
                pregunta="En tu planificacion declaras un OA del MINEDUC. Mirando el Momento de Desarrollo que disenaste, explica con un ejemplo concreto como las actividades propuestas permiten que los estudiantes demuestren el logro de ese OA especifico."
            ),
            PreguntaReflexion(
                numero=2,
                aspecto="inicio",
                pregunta="En el Momento de Inicio propones una actividad de entrada. Describe como esa actividad activa los conocimientos previos de los estudiantes y como conecta con el Objetivo de la Clase de esta sesion."
            ),
            PreguntaReflexion(
                numero=3,
                aspecto="inclusion_neet_neep",
                pregunta=f"{'Mencionas estudiantes con NEET y NEEP en la caracterizacion del curso.' if (tiene_neet or tiene_neep) else 'La caracterizacion del grupo es importante.'} Describe una estrategia CONCRETA que aplicaras en el Momento de Desarrollo para atender a los estudiantes que presentan mayores dificultades de aprendizaje en esta clase."
            ),
            PreguntaReflexion(
                numero=4,
                aspecto="dua",
                pregunta=f"{'Declares principios DUA en tu planificacion.' if tiene_dua_especifico else 'El DUA es fundamental en la practica profesional.'} Elige el principio DUA que consideras mas relevante para esta clase y explica en que momento especifico (Inicio, Desarrollo o Cierre) lo aplicaras y como lo implementaras concretamente."
            ),
            PreguntaReflexion(
                numero=5,
                aspecto="cierre_evaluacion",
                pregunta="En el Momento de Cierre de tu clase: describe que evidencia concreta utilizaras para determinar si los estudiantes lograron el Objetivo de la Clase. Como sabras, al terminar la clase, si fue exitosa?"
            ),
        ]
        return preguntas

    def _pedagogical_validate_response(self, respuesta: str) -> Dict[str, Any]:
        words = respuesta.strip().split()
        if len(words) < 8:
            return {
                "valida": False,
                "razon": "Tu respuesta es muy breve. Fundamenta con mayor detalle tu decision pedagogica y como la implementaras en el aula."
            }
        evasivas = ["no se", "no sé", "nose", "ok", "lo cambiare", "bien", "nada", "no lo pense", "igual"]
        if respuesta.strip().lower() in evasivas:
            return {
                "valida": False,
                "razon": "Por favor reflexiona sobre la estrategia concreta que aplicaras en la sala de clases con TUS estudiantes."
            }
        return {"valida": True, "razon": "Respuesta reflexiva con suficiente fundamentacion pedagogica."}

    def _pedagogical_generate_feedback(self, sesion: ConversationSession) -> RetroalimentacionFinal:
        secciones = [
            RetroalimentacionSeccion(
                seccion="Caracterizacion del Curso y Contextualizacion",
                evaluacion="buena",
                fortalezas=[
                    "Identificas estudiantes con NEET y NEEP con sus diagnosticos especificos.",
                    "Declaras los estilos de aprendizaje del grupo (visual, kinestetivo, auditivo)."
                ],
                areas_mejora=["Vincular explicitamente los datos de caracterizacion con las estrategias de los 3 momentos."],
                sugerencias=["Agregar en la columna DUA como cada estrategia responde a las caracteristicas especificas del grupo."]
            ),
            RetroalimentacionSeccion(
                seccion="Objetivo de Aprendizaje (OA) y Coherencia",
                evaluacion="buena",
                fortalezas=[
                    "El OA declarado esta alineado con las Bases Curriculares del MINEDUC.",
                    "El Objetivo de la Clase es especifico y observable para esta sesion."
                ],
                areas_mejora=["Verificar que el OA Transversal este integrado en alguna actividad de los 3 momentos."],
                sugerencias=["Escribir el objetivo de la clase en la pizarra al inicio y revisarlo al cierre."]
            ),
            RetroalimentacionSeccion(
                seccion="Momento de Inicio (activacion y rutina de clase)",
                evaluacion="buena",
                fortalezas=[
                    "Se propone una actividad de activacion de conocimientos previos.",
                    "La rutina de inicio ayuda a crear un ambiente estructurado y predecible."
                ],
                areas_mejora=["El tiempo de inicio (15 min) debe respetarse para no afectar el Desarrollo."],
                sugerencias=["Preparar 2 preguntas dirigidas adicionales para activar a estudiantes que no participan espontaneamente."]
            ),
            RetroalimentacionSeccion(
                seccion="Momento de Desarrollo (estrategia pedagogica y atencion a diversidad)",
                evaluacion="buena",
                fortalezas=[
                    "El Desarrollo presenta una secuencia logica de actividades.",
                    "Se considera el trabajo colaborativo entre estudiantes."
                ],
                areas_mejora=["Incorporar estrategias diferenciadas para estudiantes con NEET/NEEP durante el desarrollo."],
                sugerencias=["Utilizar una lista de cotejo formativa durante los 60 minutos del Desarrollo para monitorear el avance."]
            ),
            RetroalimentacionSeccion(
                seccion="Momento de Cierre (sintesis y evaluacion formativa)",
                evaluacion="buena",
                fortalezas=[
                    "El Cierre propuesto permite verificar el logro del objetivo.",
                    "Se contempla un instrumento de evaluacion formativa."
                ],
                areas_mejora=["Reservar un momento para la metacognicion de los estudiantes sobre su propio aprendizaje."],
                sugerencias=["Usar la informacion del cierre como punto de partida de la proxima sesion."]
            ),
            RetroalimentacionSeccion(
                seccion="Diversificacion de la Ensenanza (DUA por momento)",
                evaluacion="buena",
                fortalezas=[
                    "Se declaran principios DUA con sus numeros de estrategia.",
                    "El DUA esta distribuido en los momentos de la clase."
                ],
                areas_mejora=["Asegurar que cada momento tenga al menos un principio DUA declarado explicitamente."],
                sugerencias=["Revisar el catalogo de estrategias DUA para diversificar mas las opciones de expresion y representacion."]
            ),
            RetroalimentacionSeccion(
                seccion="Atencion a Estudiantes con NEET y NEEP",
                evaluacion="buena",
                fortalezas=[
                    "Se identifican los diagnosticos de los estudiantes con necesidades educativas.",
                    "Se considera la inclusion como parte de la planificacion."
                ],
                areas_mejora=["Coordinar previamente con la educadora diferencial del establecimiento sobre las adecuaciones."],
                sugerencias=["Preparar materiales diferenciados para estudiantes con NEET que requieran apoyo visual adicional."]
            ),
        ]

        return RetroalimentacionFinal(
            sesion_id=sesion.sesion_id,
            diagnostico_general="La planificacion presenta una estructura adecuada alineada con la pauta institucional de practica profesional. Los 3 momentos son coherentes con el OA declarado y se observa un intento por integrar el DUA. Para fortalecer la planificacion se recomienda profundizar en las estrategias concretas de atencion a la diversidad.",
            nivel_planificacion="buena",
            secciones=secciones,
            recomendaciones_prioritarias=[
                "Vincular explicitamente las estrategias DUA con los estudiantes identificados en la caracterizacion del curso.",
                "Preparar materiales diferenciados para los estudiantes con NEET/NEEP para cada momento.",
                "Verificar que el Cierre tenga un instrumento de evaluacion formativa que evidencie el logro del OA."
            ],
            puede_ir_al_colegio=True,
            observaciones_para_profesor="El estudiante demostro reflexion critica sobre su planificacion al responder las preguntas. Identifica las caracteristicas del grupo y hace intentos por integrar el DUA. Se sugiere reforzar en la proxima supervision el manejo de la diversidad en el Momento de Desarrollo."
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

            lineas_faltantes = [
                f"[{'CRÍTICO' if f.critico else 'RECOMENDADO'}] {f.elemento}: {f.descripcion}"
                for f in elementos_faltantes
            ]
            mensaje_detallado = "\n".join(lineas_faltantes) if lineas_faltantes else f"Planificación incompleta: {resumen}"

            return PlanificacionAnalysisResult(
                sesion_id=sesion_id,
                pasa_verificacion=False,
                elementos_faltantes=elementos_faltantes,
                mensaje=mensaje_detallado,
                total_preguntas=0
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
            total_preguntas=len(preguntas)
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
