"""
chatbot_service.py v2.0 — Mejoras sobre el prototipo ChatGPT:

1. PERSISTENCIA: Las sesiones se guardan en disco (JSON) — no se pierden al reiniciar
2. RAG MEJORADO: FAISS con base de conocimiento pedagógico oficial
3. VISTA DEL PROFESOR: El profesor puede ver toda la interacción del chatbot
4. DETECCIÓN DE EVASIÓN: Más sofisticada — el estudiante no puede "hacerse el tonto"
5. RETROALIMENTACIÓN ADAPTADA POR NIVEL: Diferente para inicial/intermedio/avanzado
6. RETROALIMENTACIÓN PROGRESIVA: El chatbot referencia respuestas previas del estudiante
"""

import os
import json
import uuid
import re
from typing import Optional, Dict, List, Any
from pathlib import Path
from pypdf import PdfReader
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, SystemMessage

from app.models import (
    NivelEstudiante, EstadoSesion,
    ElementoFaltante, PreguntaReflexion,
    PlanificacionAnalysisResult, ChatRequest, ChatResponse,
    RetroalimentacionFinal, RetroalimentacionSeccion,
    ConversationSession
)

SESIONES_DIR = Path("data/sesiones")
SESIONES_DIR.mkdir(parents=True, exist_ok=True)

# ============================================================
# Sistema de prompts mejorados v2.0
# ============================================================

SYSTEM_PROMPT = """Eres un tutor pedagógico experto en Pedagogía en Matemáticas con 15 años de experiencia
formando profesores. Tu rol es retroalimentar las planificaciones de clase de estudiantes en práctica.

PRINCIPIOS FUNDAMENTALES:
1. NO haces la planificación por el estudiante — eres un espejo que les hace reflexionar
2. Tus preguntas deben provocar pensamiento crítico, no buscar respuestas correctas específicas
3. La retroalimentación debe ser constructiva, específica y accionable
4. Adaptas el nivel de exigencia al ciclo de práctica del estudiante
5. Siempre referencias elementos concretos de la planificación presentada

IMPORTANTE: Responde SIEMPRE en español chileno formal, claro y pedagógico."""

PROMPT_VERIFICACION = """Analiza esta planificación de clase y determina si tiene los elementos mínimos obligatorios.

PLANIFICACIÓN:
{planificacion}

NIVEL DEL ESTUDIANTE: {nivel}
- inicial: evalúa solo objetivo, recursos básicos y descripción de actividad
- intermedio: evalúa los 3 momentos + DUA principio 1
- avanzado: evalúa TODO (3 momentos, DUA completo, PIE, dificultades anticipadas, instrumento evaluación)

CONOCIMIENTO DE REFERENCIA:
{contexto_kb}

Responde ÚNICAMENTE con JSON válido:
{{
  "pasa": true/false,
  "elementos_faltantes": [
    {{"elemento": "nombre_elemento", "descripcion": "qué falta específicamente", "critico": true}}
  ],
  "resumen": "1-2 oraciones sobre el estado general de la planificación",
  "num_preguntas_sugeridas": 3
}}"""

PROMPT_GENERAR_PREGUNTAS = """Eres un tutor experto en Pedagogía en Matemáticas.
Analiza esta planificación y genera preguntas de reflexión para el estudiante.

PLANIFICACIÓN:
{planificacion}

NIVEL: {nivel}
CONTEXTO PEDAGÓGICO DE REFERENCIA:
{contexto_kb}

Genera {num_preguntas} preguntas de reflexión que:
1. Sean sobre elementos presentes pero que necesiten profundización (no sobre lo que falta)
2. Estén numeradas y tengan un aspecto pedagógico específico
3. Promuevan el pensamiento crítico sobre las decisiones pedagógicas tomadas
4. Para nivel avanzado: incluye preguntas sobre DUA, PIE y coherencia objetivo-evaluación

Responde ÚNICAMENTE con JSON válido:
{{
  "preguntas": [
    {{
      "numero": 1,
      "pregunta": "texto completo de la pregunta, específica y contextualizada",
      "aspecto": "objetivo|inicio|desarrollo|cierre|evaluacion|inclusion|dificultades"
    }}
  ]
}}"""

PROMPT_VALIDAR_RESPUESTA = """Evalúa si la respuesta del estudiante es válida para esta pregunta de reflexión pedagógica.

PREGUNTA: {pregunta}
RESPUESTA DEL ESTUDIANTE: "{respuesta}"

Una respuesta es INVÁLIDA si:
- Tiene menos de 15 palabras
- Es evasiva: "no sé", "está bien así", "lo haré diferente", "lo cambiaré"
- Es una copia de la pregunta
- No tiene relación con la pregunta
- Es genérica y podría aplicarse a cualquier clase

Una respuesta es VÁLIDA si:
- Muestra reflexión sobre la decisión pedagógica tomada
- Menciona elementos concretos de su planificación
- Demuestra que el estudiante comprendió la pregunta

Responde ÚNICAMENTE con JSON válido:
{{"valida": true/false, "razon": "explicación breve de 1 oración"}}"""

PROMPT_RETROALIMENTACION = """Eres un tutor experto en Pedagogía en Matemáticas. Genera retroalimentación final completa.

PLANIFICACIÓN ORIGINAL:
{planificacion}

DIÁLOGO DE REFLEXIÓN (preguntas y respuestas del estudiante):
{dialogo}

NIVEL DEL ESTUDIANTE: {nivel}
CONTEXTO PEDAGÓGICO DE REFERENCIA:
{contexto_kb}

INSTRUCCIONES:
- Para cada sección, cita elementos específicos de la planificación (no genérico)
- En "sugerencias", da acciones concretas y realizables
- En "observaciones_para_profesor": escribe un resumen objetivo para el profesor de asignatura
- "puede_ir_al_colegio": solo true si el nivel es "muy_buena" o "buena"
- Las respuestas del estudiante en el diálogo deben influir positivamente en la evaluación si son buenas

Responde ÚNICAMENTE con JSON válido:
{{
  "diagnostico_general": "párrafo de 3-4 oraciones sobre la planificación",
  "nivel_planificacion": "muy_buena|buena|regular|insuficiente",
  "secciones": [
    {{
      "seccion": "Objetivo de la clase",
      "evaluacion": "excelente|buena|mejorar|insuficiente",
      "fortalezas": ["fortaleza específica referenciando la planificación"],
      "areas_mejora": ["área de mejora concreta"],
      "sugerencias": ["acción específica y realizable antes de ir al colegio"]
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
      "seccion": "Instrumento de evaluación",
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
  "recomendaciones_prioritarias": ["máximo 3 acciones prioritarias antes de ir al colegio"],
  "puede_ir_al_colegio": true/false,
  "observaciones_para_profesor": "resumen objetivo para el profesor de asignatura: estado de la planificación, uso del chatbot y disposición del estudiante a la retroalimentación"
}}"""


class ChatbotService:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.3
        )
        self._kb_retriever = None

    def _get_kb_retriever(self):
        """Lazy loading del knowledge base."""
        if self._kb_retriever is None:
            try:
                from app.knowledge_base import load_or_create_knowledge_base
                self._kb_retriever = load_or_create_knowledge_base()
            except Exception:
                pass
        return self._kb_retriever

    def _get_context_from_kb(self, query: str) -> str:
        """Recupera contexto relevante del knowledge base FAISS."""
        retriever = self._get_kb_retriever()
        if not retriever:
            return "Base de conocimiento no disponible."
        try:
            docs = retriever.invoke(query)
            return "\n\n".join([d.page_content for d in docs])
        except Exception:
            return ""

    def _call_llm(self, prompt: str) -> str:
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=prompt)
        ]
        response = self.llm.invoke(messages)
        return response.content

    def _parse_json(self, text: str) -> dict:
        """Extrae JSON limpio de la respuesta del LLM."""
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)
        text = text.strip()
        # Encontrar el primer { y el último }
        start = text.find('{')
        end = text.rfind('}') + 1
        if start >= 0 and end > start:
            text = text[start:end]
        return json.loads(text)

    def _save_sesion(self, sesion: ConversationSession):
        """Persiste la sesión en disco como JSON."""
        path = SESIONES_DIR / f"{sesion.sesion_id}.json"
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(sesion.model_dump(), f, ensure_ascii=False, indent=2, default=str)

    def _load_sesion(self, sesion_id: str) -> Optional[ConversationSession]:
        """Carga una sesión desde disco."""
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
    # Flujo principal
    # ============================================================

    async def analizar_planificacion(
        self,
        pdf_path: str,
        nivel_estudiante: str,
        sesion_id: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> PlanificacionAnalysisResult:

        texto = self._extract_pdf_text(pdf_path)
        if len(texto.strip()) < 50:
            raise ValueError("El PDF no contiene texto. ¿Está escaneado?")

        # Contexto del knowledge base
        kb_contexto = self._get_context_from_kb(
            f"elementos obligatorios planificacion nivel {nivel_estudiante}"
        )

        # Verificar elementos mínimos
        resp_ver = self._call_llm(PROMPT_VERIFICACION.format(
            planificacion=texto[:8000],
            nivel=nivel_estudiante,
            contexto_kb=kb_contexto[:2000]
        ))
        verificacion = self._parse_json(resp_ver)

        if not sesion_id:
            sesion_id = str(uuid.uuid4())

        elementos_faltantes = [
            ElementoFaltante(**e) for e in verificacion.get("elementos_faltantes", [])
        ]

        if not verificacion["pasa"]:
            sesion = ConversationSession(
                sesion_id=sesion_id,
                estado=EstadoSesion.VERIFICACION,
                nivel_estudiante=NivelEstudiante(nivel_estudiante),
                planificacion_texto=texto,
                metadata=metadata or {}
            )
            self._save_sesion(sesion)

            return PlanificacionAnalysisResult(
                sesion_id=sesion_id,
                pasa_verificacion=False,
                elementos_faltantes=elementos_faltantes,
                mensaje=f"Planificación incompleta. {verificacion['resumen']} Completa los elementos faltantes antes de continuar.",
            )

        # Generar preguntas de reflexión
        num_preguntas = verificacion.get("num_preguntas_sugeridas", 4)
        kb_preguntas = self._get_context_from_kb("preguntas reflexion planificacion criterios evaluacion")

        resp_preg = self._call_llm(PROMPT_GENERAR_PREGUNTAS.format(
            planificacion=texto[:8000],
            nivel=nivel_estudiante,
            num_preguntas=num_preguntas,
            contexto_kb=kb_preguntas[:2000]
        ))
        preguntas_data = self._parse_json(resp_preg)
        preguntas = [PreguntaReflexion(**p) for p in preguntas_data["preguntas"]]

        sesion = ConversationSession(
            sesion_id=sesion_id,
            estado=EstadoSesion.PREGUNTAS,
            nivel_estudiante=NivelEstudiante(nivel_estudiante),
            planificacion_texto=texto,
            preguntas=preguntas,
            metadata=metadata or {}
        )
        self._save_sesion(sesion)

        return PlanificacionAnalysisResult(
            sesion_id=sesion_id,
            pasa_verificacion=True,
            elementos_faltantes=[],
            mensaje=f"¡Planificación recibida! Para obtener tu retroalimentación, responde {len(preguntas)} preguntas de reflexión.",
            primera_pregunta=preguntas[0],
        )

    async def procesar_respuesta(self, request: ChatRequest) -> ChatResponse:
        sesion = self._load_sesion(request.sesion_id)
        if not sesion:
            raise ValueError(f"Sesión no encontrada: {request.sesion_id}")

        # Encontrar pregunta pendiente
        pregunta_actual = next(
            (p for p in sesion.preguntas if p.respuesta_valida is None),
            None
        )

        if not pregunta_actual:
            return await self._generar_retroalimentacion(sesion)

        # Validar respuesta
        resp_val = self._call_llm(PROMPT_VALIDAR_RESPUESTA.format(
            pregunta=pregunta_actual.pregunta,
            respuesta=request.respuesta
        ))
        validacion = self._parse_json(resp_val)

        pregunta_actual.respuesta = request.respuesta
        pregunta_actual.respuesta_valida = validacion["valida"]
        self._save_sesion(sesion)

        completadas = sum(1 for p in sesion.preguntas if p.respuesta_valida is True)
        total = len(sesion.preguntas)

        if not validacion["valida"]:
            return ChatResponse(
                sesion_id=request.sesion_id,
                estado=EstadoSesion.PREGUNTAS,
                siguiente_pregunta=pregunta_actual,
                mensaje=f"Tu respuesta necesita mayor profundidad: {validacion['razon']}. Reflexiona sobre las decisiones pedagógicas concretas que tomaste.",
                preguntas_completadas=completadas,
                total_preguntas=total
            )

        # Siguiente pregunta pendiente
        siguiente = next(
            (p for p in sesion.preguntas if p.respuesta_valida is None),
            None
        )

        if siguiente:
            return ChatResponse(
                sesion_id=request.sesion_id,
                estado=EstadoSesion.PREGUNTAS,
                siguiente_pregunta=siguiente,
                mensaje=f"Buena reflexión ({completadas + 1}/{total}). Siguiente pregunta:",
                preguntas_completadas=completadas + 1,
                total_preguntas=total
            )

        return await self._generar_retroalimentacion(sesion)

    async def _generar_retroalimentacion(self, sesion: ConversationSession) -> ChatResponse:
        dialogo = "\n\n".join([
            f"**Pregunta {p.numero} ({p.aspecto}):** {p.pregunta}\n**Estudiante:** {p.respuesta}"
            for p in sesion.preguntas if p.respuesta
        ])

        kb_retro = self._get_context_from_kb(
            "retroalimentacion criterios evaluacion planificacion DUA PIE"
        )

        resp_retro = self._call_llm(PROMPT_RETROALIMENTACION.format(
            planificacion=sesion.planificacion_texto[:8000],
            dialogo=dialogo,
            nivel=sesion.nivel_estudiante.value,
            contexto_kb=kb_retro[:2000]
        ))
        retro_data = self._parse_json(resp_retro)

        secciones = [RetroalimentacionSeccion(**s) for s in retro_data.get("secciones", [])]
        retroalimentacion = RetroalimentacionFinal(
            sesion_id=sesion.sesion_id,
            diagnostico_general=retro_data["diagnostico_general"],
            nivel_planificacion=retro_data["nivel_planificacion"],
            secciones=secciones,
            recomendaciones_prioritarias=retro_data.get("recomendaciones_prioritarias", []),
            puede_ir_al_colegio=retro_data.get("puede_ir_al_colegio", False),
            observaciones_para_profesor=retro_data.get("observaciones_para_profesor", "")
        )

        sesion.retroalimentacion_final = retroalimentacion
        sesion.estado = EstadoSesion.COMPLETADA
        self._save_sesion(sesion)

        return ChatResponse(
            sesion_id=sesion.sesion_id,
            estado=EstadoSesion.RETROALIMENTACION,
            retroalimentacion=retroalimentacion.model_dump(),
            mensaje="¡Retroalimentación completa! Revisa cada sección y mejora tu planificación antes de presentarla al profesor.",
            preguntas_completadas=len(sesion.preguntas),
            total_preguntas=len(sesion.preguntas)
        )

    # ============================================================
    # Vista del profesor
    # ============================================================

    async def get_sesiones_filtradas(
        self,
        asignatura_id: Optional[int] = None,
        estudiante_id: Optional[int] = None
    ) -> List[Dict]:
        """Lista todas las sesiones (filtrando por asignatura/estudiante)."""
        sesiones = []
        for path in SESIONES_DIR.glob("*.json"):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                meta = data.get("metadata", {})
                if asignatura_id and meta.get("asignatura_id") != asignatura_id:
                    continue
                if estudiante_id and meta.get("estudiante_id") != estudiante_id:
                    continue

                preguntas = data.get("preguntas", [])
                respondidas = sum(1 for p in preguntas if p.get("respuesta_valida") is True)

                sesiones.append({
                    "sesion_id": data["sesion_id"],
                    "estado": data["estado"],
                    "nivel_estudiante": data["nivel_estudiante"],
                    "estudiante_id": meta.get("estudiante_id"),
                    "asignatura_id": meta.get("asignatura_id"),
                    "filename": meta.get("filename"),
                    "total_preguntas": len(preguntas),
                    "preguntas_respondidas": respondidas,
                    "puede_ir_al_colegio": (
                        data.get("retroalimentacion_final", {}).get("puede_ir_al_colegio")
                        if data.get("retroalimentacion_final") else None
                    ),
                    "nivel_planificacion": (
                        data.get("retroalimentacion_final", {}).get("nivel_planificacion")
                        if data.get("retroalimentacion_final") else None
                    ),
                })
            except Exception:
                continue

        return sorted(sesiones, key=lambda s: s.get("sesion_id", ""), reverse=True)

    async def get_detalle_para_profesor(self, sesion_id: str) -> Optional[Dict]:
        """Detalle completo de una sesión para el profesor."""
        sesion = self._load_sesion(sesion_id)
        if not sesion:
            return None

        return {
            "sesion_id": sesion.sesion_id,
            "estado": sesion.estado,
            "nivel_estudiante": sesion.nivel_estudiante,
            "metadata": sesion.metadata,
            "planificacion_extracto": (sesion.planificacion_texto or "")[:500] + "...",
            "dialogo": [
                {
                    "pregunta_numero": p.numero,
                    "aspecto": p.aspecto,
                    "pregunta": p.pregunta,
                    "respuesta": p.respuesta,
                    "respuesta_valida": p.respuesta_valida,
                }
                for p in sesion.preguntas
            ],
            "retroalimentacion": sesion.retroalimentacion_final.model_dump()
            if sesion.retroalimentacion_final else None,
        }

    async def get_sesion(self, sesion_id: str) -> Optional[ConversationSession]:
        return self._load_sesion(sesion_id)

    async def get_retroalimentacion_final(self, sesion_id: str):
        sesion = self._load_sesion(sesion_id)
        if sesion and sesion.retroalimentacion_final:
            return sesion.retroalimentacion_final
        return None
