"""
Sistema de Gestión Pedagógica - Chatbot API
Versión 2.0 — Supera el prototipo ChatGPT con:
- Autonomía total (sin depender de cuentas de terceros)
- FAISS RAG sobre base de conocimiento pedagógico
- Notas de voz para observaciones de clase (escalable)
- Vista del profesor: registro completo de interacciones del chatbot
- Sesiones persistentes en disco (no se pierden al reiniciar)
- Detección de nivel del estudiante para retroalimentación adaptada
"""

import os
import json
import tempfile
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.chatbot_service import ChatbotService
from app.voice_service import voice_service
from app.models import (
    ChatRequest, ChatResponse,
    PlanificacionAnalysisResult,
    ConversationSession
)

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicializa recursos al arrancar el servidor."""
    print("🚀 Iniciando chatbot pedagógico...")

    # Pre-cargar el knowledge base FAISS
    try:
        from app.knowledge_base import load_or_create_knowledge_base
        kb = load_or_create_knowledge_base()
        app.state.knowledge_base = kb
        print("✅ Knowledge base FAISS inicializado")
    except Exception as e:
        print(f"⚠️ Knowledge base no disponible: {e}")
        app.state.knowledge_base = None

    # Crear directorios necesarios
    os.makedirs("data/planificaciones", exist_ok=True)
    os.makedirs("data/sesiones", exist_ok=True)
    os.makedirs("data/voice_notes", exist_ok=True)

    print(f"🎙️ Voice provider: {voice_service.get_provider_name()}")
    yield
    print("👋 Cerrando chatbot...")


app = FastAPI(
    title="Chatbot Pedagógico v2.0",
    description="Sistema autónomo de retroalimentación de planificaciones de clase para Pedagogía en Matemáticas",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chatbot_service = ChatbotService()


# ============================================================
# Health & Status
# ============================================================

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "2.0.0",
        "voice_provider": voice_service.get_provider_name(),
        "knowledge_base": "faiss" if getattr(app.state, "knowledge_base", None) else "disabled"
    }


# ============================================================
# Chatbot — Flujo principal
# ============================================================

@app.post("/analizar-planificacion", response_model=PlanificacionAnalysisResult)
async def analizar_planificacion(
    archivo: UploadFile = File(...),
    nivel_estudiante: str = Form(default="avanzado"),
    sesion_id: Optional[str] = Form(default=None),
    estudiante_id: Optional[int] = Form(default=None),
    asignatura_id: Optional[int] = Form(default=None),
):
    """
    Paso 1: Recibe la planificación en PDF.
    Verifica elementos mínimos → genera preguntas de reflexión.
    """
    if not archivo.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Solo se aceptan archivos PDF")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        content = await archivo.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = await chatbot_service.analizar_planificacion(
            pdf_path=tmp_path,
            nivel_estudiante=nivel_estudiante,
            sesion_id=sesion_id,
            metadata={
                "estudiante_id": estudiante_id,
                "asignatura_id": asignatura_id,
                "filename": archivo.filename,
            }
        )
        return result
    finally:
        import os as _os
        _os.unlink(tmp_path)


@app.post("/responder-pregunta", response_model=ChatResponse)
async def responder_pregunta(request: ChatRequest):
    """
    Paso 2+: El estudiante responde las preguntas de reflexión.
    """
    return await chatbot_service.procesar_respuesta(request)


@app.get("/sesion/{sesion_id}", response_model=ConversationSession)
async def get_sesion(sesion_id: str):
    sesion = await chatbot_service.get_sesion(sesion_id)
    if not sesion:
        raise HTTPException(404, "Sesión no encontrada")
    return sesion


@app.get("/sesion/{sesion_id}/retroalimentacion")
async def get_retroalimentacion(sesion_id: str):
    """Retroalimentación final — accesible tanto por el estudiante como por el profesor."""
    retro = await chatbot_service.get_retroalimentacion_final(sesion_id)
    if not retro:
        raise HTTPException(404, "Retroalimentación no disponible para esta sesión")
    return retro


# ============================================================
# Vista del Profesor — Dashboard de uso del chatbot
# ============================================================

@app.get("/profesor/sesiones")
async def get_sesiones_por_asignatura(
    asignatura_id: Optional[int] = None,
    estudiante_id: Optional[int] = None,
):
    """
    Permite al profesor ver todas las interacciones del chatbot
    para sus estudiantes. Muestra si usaron el chatbot, cuántas
    preguntas respondieron, y el nivel de retroalimentación.
    """
    return await chatbot_service.get_sesiones_filtradas(
        asignatura_id=asignatura_id,
        estudiante_id=estudiante_id
    )


@app.get("/profesor/sesion/{sesion_id}/detalle")
async def get_detalle_sesion_profesor(sesion_id: str):
    """
    Vista completa para el profesor: planificación original,
    preguntas, respuestas del estudiante y retroalimentación.
    Permite al profesor ver si el estudiante realmente reflexionó.
    """
    return await chatbot_service.get_detalle_para_profesor(sesion_id)


# ============================================================
# Notas de Voz — Observaciones de clase
# ============================================================

@app.post("/voz/transcribir")
async def transcribir_nota_voz(
    audio: UploadFile = File(...),
    evaluacion_id: Optional[int] = Form(default=None),
    formato: str = Form(default="webm"),
):
    """
    Transcribe una nota de voz grabada por el tutor/colaborador
    durante la observación de una clase.

    Formatos soportados: webm (Chrome/Firefox), mp4, ogg, wav
    El audio es grabado desde el navegador con MediaRecorder API.

    Retorna el texto transcrito para ser guardado junto a la evaluación.
    """
    contenido = await audio.read()

    if len(contenido) < 100:
        raise HTTPException(400, "El archivo de audio está vacío o es demasiado pequeño")

    try:
        result = await voice_service.transcribir_nota_voz(
            audio_bytes=contenido,
            formato=formato,
            evaluacion_id=evaluacion_id
        )

        return {
            "texto": result.texto,
            "duracion_transcripcion_segundos": result.duracion_segundos,
            "proveedor": result.proveedor,
            "evaluacion_id": evaluacion_id,
            "palabras": len(result.texto.split()),
        }
    except Exception as e:
        raise HTTPException(500, f"Error en la transcripción: {str(e)}")


@app.get("/voz/provider")
async def get_voice_provider():
    """Informa qué proveedor de transcripción está activo."""
    return {
        "provider": voice_service.get_provider_name(),
        "providers_disponibles": [
            "whisper-local (desarrollo/demo)",
            "google-speech (producción)",
            "openai-whisper (alternativa)"
        ],
        "para_cambiar": "Configurar variables de entorno GOOGLE_APPLICATION_CREDENTIALS o OPENAI_API_KEY"
    }
