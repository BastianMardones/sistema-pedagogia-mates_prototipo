"""
ChatbotService — Servicio principal del chatbot pedagógico.

Implementa el flujo exacto que el cliente describió en la reunión:
1. Verificación de elementos mínimos en la planificación
2. Generación de hasta 5 preguntas de reflexión contextuales
3. Validación de respuestas (detecta evasiones o respuestas vacías)
4. Retroalimentación detallada por sección
"""

import os
import uuid
import json
from typing import Optional, Dict
from pypdf import PdfReader
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate

from app.models import (
    NivelEstudiante, EstadoSesion,
    ElementoFaltante, PreguntaReflexion,
    PlanificacionAnalysisResult, ChatRequest, ChatResponse,
    RetroalimentacionFinal, RetroalimentacionSeccion,
    ConversationSession
)

# In-memory store de sesiones (en producción usar Redis)
SESIONES: Dict[str, ConversationSession] = {}

# ============================================================
# Prompts del sistema
# ============================================================

PROMPT_VERIFICACION = """
Eres un evaluador experto en planificaciones de clase para Pedagogía en Matemáticas.
Tu tarea es analizar una planificación y determinar si contiene los elementos mínimos requeridos.

PLANIFICACIÓN A EVALUAR:
{planificacion}

NIVEL DEL ESTUDIANTE: {nivel}
(inicial=primeras prácticas sin DUA/PIE, intermedio=DUA básico, avanzado=DUA+PIE completo)

Verifica si la planificación contiene los siguientes elementos:
1. Objetivo de la clase (claro y observable)
2. Recursos didácticos especificados
3. Instrumento de evaluación mencionado
4. Los 3 momentos de clase: INICIO, DESARROLLO, CIERRE (descritos)
5. DUA/Diversificación (solo para nivel intermedio y avanzado)
6. Adaptaciones PIE/Inclusión (solo para nivel avanzado)

Responde SOLO con un JSON con esta estructura exacta:
{{
  "pasa": true/false,
  "elementos_faltantes": [
    {{"elemento": "nombre", "descripcion": "qué falta específicamente", "critico": true/false}}
  ],
  "resumen": "texto breve de 1-2 oraciones sobre el estado de la planificación"
}}
"""

PROMPT_GENERAR_PREGUNTAS = """
Eres un tutor pedagógico experto en Pedagogía en Matemáticas.
Analizaste esta planificación de clase y debes generar preguntas de reflexión.

PLANIFICACIÓN:
{planificacion}

NIVEL DEL ESTUDIANTE: {nivel}

Genera EXACTAMENTE {num_preguntas} preguntas de reflexión (máximo 5) que:
1. Sean sobre aspectos poco claros o que necesitan profundización
2. Ayuden al estudiante a pensar críticamente sobre su planificación
3. Estén basadas SOLO en lo que está escrito en la planificación (no inventes)
4. Sean específicas y concretas
5. NO hagan el trabajo por el estudiante

Responde SOLO con un JSON:
{{
  "preguntas": [
    {{
      "numero": 1,
      "pregunta": "texto de la pregunta",
      "aspecto": "objetivo|recursos|evaluacion|inclusion|dificultades|metodologia"
    }}
  ]
}}
"""

PROMPT_VALIDAR_RESPUESTA = """
El estudiante respondió a la siguiente pregunta de reflexión pedagógica.
Determina si la respuesta es válida (reflexiva y relacionada con la pregunta) o evasiva.

PREGUNTA: {pregunta}
RESPUESTA DEL ESTUDIANTE: {respuesta}

Una respuesta es INVÁLIDA si:
- Es muy corta (menos de 10 palabras)
- Es irrelevante o no relacionada
- Es evasiva ("no sé", "no aplica", "está bien así")
- Es una copia de la pregunta

Responde SOLO con JSON: {{"valida": true/false, "razon": "breve explicación"}}
"""

PROMPT_RETROALIMENTACION = """
Eres un tutor experto en Pedagogía en Matemáticas con años de experiencia.
Proporciona retroalimentación constructiva y detallada sobre esta planificación de clase.

PLANIFICACIÓN ORIGINAL:
{planificacion}

PREGUNTAS DE REFLEXIÓN Y RESPUESTAS DEL ESTUDIANTE:
{preguntas_respuestas}

NIVEL DEL ESTUDIANTE: {nivel}

Genera una retroalimentación completa en formato JSON:
{{
  "diagnostico_general": "párrafo general sobre la planificación",
  "nivel_planificacion": "muy_buena|buena|regular|insuficiente",
  "secciones": [
    {{
      "seccion": "Objetivo de la clase",
      "evaluacion": "excelente|buena|mejorar|insuficiente",
      "fortalezas": ["..."],
      "areas_mejora": ["..."],
      "sugerencias": ["sugerencia concreta y accionable"]
    }},
    {{
      "seccion": "Inicio de la clase",
      "evaluacion": "...",
      "fortalezas": ["..."],
      "areas_mejora": ["..."],
      "sugerencias": ["..."]
    }},
    {{
      "seccion": "Desarrollo de la clase",
      "evaluacion": "...",
      "fortalezas": ["..."],
      "areas_mejora": ["..."],
      "sugerencias": ["..."]
    }},
    {{
      "seccion": "Cierre de la clase",
      "evaluacion": "...",
      "fortalezas": ["..."],
      "areas_mejora": ["..."],
      "sugerencias": ["..."]
    }},
    {{
      "seccion": "Evaluación e instrumento",
      "evaluacion": "...",
      "fortalezas": ["..."],
      "areas_mejora": ["..."],
      "sugerencias": ["..."]
    }},
    {{
      "seccion": "DUA e Inclusión",
      "evaluacion": "...",
      "fortalezas": ["..."],
      "areas_mejora": ["..."],
      "sugerencias": ["..."]
    }}
  ],
  "recomendaciones_prioritarias": ["máximo 3 acciones concretas a tomar ANTES de ir al colegio"],
  "puede_ir_al_colegio": true/false,
  "observaciones_para_profesor": "mensaje para el profesor de asignatura sobre el estado de la planificación"
}}

Recuerda: el objetivo es mejorar la planificación, no hacerla por el estudiante.
Sé específico, constructivo y referencia elementos de la planificación original.
"""


class ChatbotService:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.3
        )

    def _extract_pdf_text(self, pdf_path: str) -> str:
        """Extrae texto de un PDF."""
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()

    def _call_llm(self, prompt: str) -> str:
        """Llama al LLM y retorna el texto de respuesta."""
        from langchain.schema import HumanMessage
        response = self.llm.invoke([HumanMessage(content=prompt)])
        return response.content

    def _parse_json_response(self, text: str) -> dict:
        """Extrae JSON de la respuesta del LLM (puede tener markdown)."""
        import re
        # Remover bloques de código markdown si los hay
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)
        return json.loads(text.strip())

    async def analizar_planificacion(
        self,
        pdf_path: str,
        nivel_estudiante: str,
        sesion_id: Optional[str] = None
    ) -> PlanificacionAnalysisResult:
        """Analiza la planificación y genera preguntas de reflexión."""

        # Extraer texto del PDF
        texto = self._extract_pdf_text(pdf_path)
        if len(texto.strip()) < 50:
            raise ValueError("El PDF no contiene texto extraíble. Verifica que no sea una imagen escaneada.")

        # Paso 1: Verificar elementos mínimos
        prompt_ver = PROMPT_VERIFICACION.format(
            planificacion=texto[:8000],  # Límite de contexto
            nivel=nivel_estudiante
        )
        resp_ver = self._call_llm(prompt_ver)
        verificacion = self._parse_json_response(resp_ver)

        # Crear sesión
        if not sesion_id:
            sesion_id = str(uuid.uuid4())

        elementos_faltantes = [
            ElementoFaltante(**e) for e in verificacion.get("elementos_faltantes", [])
        ]

        if not verificacion["pasa"]:
            # No pasa verificación → devolver elementos faltantes
            sesion = ConversationSession(
                sesion_id=sesion_id,
                estado=EstadoSesion.VERIFICACION,
                nivel_estudiante=NivelEstudiante(nivel_estudiante),
                planificacion_texto=texto,
                metadata={"verificacion_resumen": verificacion["resumen"]}
            )
            SESIONES[sesion_id] = sesion

            return PlanificacionAnalysisResult(
                sesion_id=sesion_id,
                pasa_verificacion=False,
                elementos_faltantes=elementos_faltantes,
                mensaje=f"La planificación no está completa. {verificacion['resumen']}",
                primera_pregunta=None
            )

        # Paso 2: Generar preguntas de reflexión
        # Calcular cuántas preguntas (1-5 según calidad)
        elementos_criticos = len([e for e in elementos_faltantes if e.critico])
        num_preguntas = max(3, min(5, 5 - elementos_criticos))

        prompt_preg = PROMPT_GENERAR_PREGUNTAS.format(
            planificacion=texto[:8000],
            nivel=nivel_estudiante,
            num_preguntas=num_preguntas
        )
        resp_preg = self._call_llm(prompt_preg)
        preguntas_data = self._parse_json_response(resp_preg)

        preguntas = [
            PreguntaReflexion(**p) for p in preguntas_data["preguntas"]
        ]

        # Guardar sesión
        sesion = ConversationSession(
            sesion_id=sesion_id,
            estado=EstadoSesion.PREGUNTAS,
            nivel_estudiante=NivelEstudiante(nivel_estudiante),
            planificacion_texto=texto,
            preguntas=preguntas
        )
        SESIONES[sesion_id] = sesion

        return PlanificacionAnalysisResult(
            sesion_id=sesion_id,
            pasa_verificacion=True,
            elementos_faltantes=[],
            mensaje=f"Planificación recibida. Responde {len(preguntas)} preguntas de reflexión antes de recibir retroalimentación.",
            primera_pregunta=preguntas[0] if preguntas else None,
            texto_extraido=texto[:500] + "..."  # Para debugging
        )

    async def procesar_respuesta(self, request: ChatRequest) -> ChatResponse:
        """Procesa la respuesta del estudiante a una pregunta de reflexión."""

        sesion = SESIONES.get(request.sesion_id)
        if not sesion:
            raise ValueError(f"Sesión no encontrada: {request.sesion_id}")

        # Encontrar la pregunta actual (la primera sin respuesta válida)
        pregunta_actual = None
        for p in sesion.preguntas:
            if p.respuesta is None or p.respuesta_valida is False:
                pregunta_actual = p
                break

        if not pregunta_actual:
            # Todas respondidas → generar retroalimentación
            return await self._generar_retroalimentacion(sesion)

        # Validar la respuesta
        prompt_val = PROMPT_VALIDAR_RESPUESTA.format(
            pregunta=pregunta_actual.pregunta,
            respuesta=request.respuesta
        )
        resp_val = self._call_llm(prompt_val)
        validacion = self._parse_json_response(resp_val)

        pregunta_actual.respuesta = request.respuesta
        pregunta_actual.respuesta_valida = validacion["valida"]

        preguntas_completadas = sum(1 for p in sesion.preguntas if p.respuesta_valida is True)

        if not validacion["valida"]:
            return ChatResponse(
                sesion_id=request.sesion_id,
                estado=EstadoSesion.PREGUNTAS,
                siguiente_pregunta=pregunta_actual,
                mensaje=f"Tu respuesta no es suficiente: {validacion['razon']}. Por favor, reflexiona más profundamente.",
                preguntas_completadas=preguntas_completadas,
                total_preguntas=len(sesion.preguntas)
            )

        # Buscar siguiente pregunta
        siguiente = None
        for p in sesion.preguntas:
            if p.respuesta_valida is None:
                siguiente = p
                break

        if siguiente:
            return ChatResponse(
                sesion_id=request.sesion_id,
                estado=EstadoSesion.PREGUNTAS,
                siguiente_pregunta=siguiente,
                mensaje="Buena reflexión. Ahora la siguiente pregunta:",
                preguntas_completadas=preguntas_completadas + 1,
                total_preguntas=len(sesion.preguntas)
            )
        else:
            # Todas las preguntas respondidas → generar retroalimentación
            return await self._generar_retroalimentacion(sesion)

    async def _generar_retroalimentacion(self, sesion: ConversationSession) -> ChatResponse:
        """Genera la retroalimentación final completa."""

        preguntas_respuestas = "\n\n".join([
            f"Pregunta {p.numero} ({p.aspecto}):\n{p.pregunta}\nRespuesta del estudiante: {p.respuesta}"
            for p in sesion.preguntas if p.respuesta_valida
        ])

        prompt_retro = PROMPT_RETROALIMENTACION.format(
            planificacion=sesion.planificacion_texto[:8000],
            preguntas_respuestas=preguntas_respuestas,
            nivel=sesion.nivel_estudiante.value
        )

        resp_retro = self._call_llm(prompt_retro)
        retro_data = self._parse_json_response(resp_retro)

        secciones = [RetroalimentacionSeccion(**s) for s in retro_data.get("secciones", [])]

        retroalimentacion_final = RetroalimentacionFinal(
            sesion_id=sesion.sesion_id,
            diagnostico_general=retro_data["diagnostico_general"],
            nivel_planificacion=retro_data["nivel_planificacion"],
            secciones=secciones,
            recomendaciones_prioritarias=retro_data.get("recomendaciones_prioritarias", []),
            puede_ir_al_colegio=retro_data.get("puede_ir_al_colegio", False),
            observaciones_para_profesor=retro_data.get("observaciones_para_profesor", "")
        )

        sesion.retroalimentacion_final = retroalimentacion_final
        sesion.estado = EstadoSesion.COMPLETADA

        return ChatResponse(
            sesion_id=sesion.sesion_id,
            estado=EstadoSesion.RETROALIMENTACION,
            retroalimentacion=retroalimentacion_final.model_dump(),
            mensaje="¡Retroalimentación lista! Revisa cada sección y mejora tu planificación antes de presentarla a tu profesor.",
            preguntas_completadas=len(sesion.preguntas),
            total_preguntas=len(sesion.preguntas)
        )

    async def get_sesion(self, sesion_id: str) -> Optional[ConversationSession]:
        return SESIONES.get(sesion_id)

    async def get_retroalimentacion_final(self, sesion_id: str):
        sesion = SESIONES.get(sesion_id)
        if not sesion or not sesion.retroalimentacion_final:
            return None
        return sesion.retroalimentacion_final
