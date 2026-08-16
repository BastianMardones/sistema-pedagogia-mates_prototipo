"""
Sistema de Gestión Pedagógica - Chatbot de Retroalimentación
Pedagogía en Matemáticas | ISW 2026-2

Funcionalidad principal:
1. Recibe planificación de clase (PDF)
2. Verifica elementos mínimos (sin ellos, no da retroalimentación)
3. Hace hasta 5 preguntas de reflexión al estudiante
4. Entrega retroalimentación detallada por sección
5. Adapta el nivel de exigencia según nivel del estudiante (años iniciales vs finales)
"""

import os
import json
import tempfile
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from app.chatbot_service import ChatbotService
from app.models import (
    ChatRequest, ChatResponse,
    PlanificacionAnalysisResult,
    ConversationSession
)

load_dotenv()

app = FastAPI(
    title="Chatbot Pedagógico - Sistema de Retroalimentación de Planificaciones",
    description="API para el chatbot de retroalimentación inteligente de planificaciones de clase",
    version="1.0.0"
)

# CORS para el frontend Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chatbot_service = ChatbotService()

# ============================================================
# Endpoints
# ============================================================

@app.get("/health")
async def health():
    return {"status": "ok", "service": "chatbot-pedagogia"}


@app.post("/analizar-planificacion", response_model=PlanificacionAnalysisResult)
async def analizar_planificacion(
    archivo: UploadFile = File(...),
    nivel_estudiante: str = "avanzado",  # "inicial", "intermedio", "avanzado"
    sesion_id: Optional[str] = None
):
    """
    Paso 1: Recibe una planificación en PDF y verifica elementos mínimos.
    Si pasa la verificación, genera las preguntas de reflexión.
    Si no pasa, devuelve lista de elementos faltantes.
    """
    if not archivo.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")

    # Guardar temporalmente
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        content = await archivo.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = await chatbot_service.analizar_planificacion(
            pdf_path=tmp_path,
            nivel_estudiante=nivel_estudiante,
            sesion_id=sesion_id
        )
        return result
    finally:
        os.unlink(tmp_path)


@app.post("/responder-pregunta", response_model=ChatResponse)
async def responder_pregunta(request: ChatRequest):
    """
    Paso 2+: El estudiante responde las preguntas de reflexión.
    Devuelve la siguiente pregunta o, si ya se respondieron todas, la retroalimentación final.
    """
    return await chatbot_service.procesar_respuesta(request)


@app.get("/sesion/{sesion_id}", response_model=ConversationSession)
async def get_sesion(sesion_id: str):
    """Obtiene el estado actual de una sesión de conversación."""
    sesion = await chatbot_service.get_sesion(sesion_id)
    if not sesion:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    return sesion


@app.get("/sesion/{sesion_id}/retroalimentacion")
async def get_retroalimentacion_final(sesion_id: str):
    """Obtiene la retroalimentación final completa de una sesión completada."""
    return await chatbot_service.get_retroalimentacion_final(sesion_id)
