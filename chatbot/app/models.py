from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from enum import Enum


class NivelEstudiante(str, Enum):
    INICIAL = "inicial"        # Práctica 1-2: sin DUA/PIE
    INTERMEDIO = "intermedio"  # Práctica 3-4: DUA básico
    AVANZADO = "avanzado"      # Práctica 5-6 (pedagógica/profesional): DUA+PIE completo


class EstadoSesion(str, Enum):
    VERIFICACION = "verificacion"     # Verificando elementos mínimos
    PREGUNTAS = "preguntas"           # Haciendo preguntas de reflexión
    RETROALIMENTACION = "retroalimentacion"  # Entregando retroalimentación
    COMPLETADA = "completada"         # Sesión finalizada


class ElementoFaltante(BaseModel):
    elemento: str
    descripcion: str
    critico: bool = True


class PreguntaReflexion(BaseModel):
    numero: int
    pregunta: str
    aspecto: str  # objetivo, recursos, evaluacion, inclusión, dificultades, etc.
    respuesta: Optional[str] = None
    respuesta_valida: Optional[bool] = None


class PlanificacionAnalysisResult(BaseModel):
    sesion_id: str
    pasa_verificacion: bool
    elementos_faltantes: List[ElementoFaltante] = []
    mensaje: str
    primera_pregunta: Optional[PreguntaReflexion] = None
    total_preguntas: int = 5
    texto_extraido: Optional[str] = None  # Para debugging/registro


class ChatRequest(BaseModel):
    sesion_id: str
    respuesta: str


class ChatResponse(BaseModel):
    sesion_id: str
    estado: EstadoSesion
    siguiente_pregunta: Optional[PreguntaReflexion] = None
    retroalimentacion: Optional[Dict[str, Any]] = None
    mensaje: str
    preguntas_completadas: int
    total_preguntas: int


class RetroalimentacionSeccion(BaseModel):
    seccion: str
    evaluacion: str          # "excelente", "buena", "mejorar", "insuficiente"
    fortalezas: List[str]
    areas_mejora: List[str]
    sugerencias: List[str]


class RetroalimentacionFinal(BaseModel):
    sesion_id: str
    diagnostico_general: str
    nivel_planificacion: str  # "muy_buena", "buena", "regular", "insuficiente"
    secciones: List[RetroalimentacionSeccion]
    recomendaciones_prioritarias: List[str]
    puede_ir_al_colegio: bool
    observaciones_para_profesor: str  # Para que el profesor de asignatura vea


class ConversationSession(BaseModel):
    sesion_id: str
    estado: EstadoSesion
    nivel_estudiante: NivelEstudiante
    planificacion_texto: Optional[str] = None
    preguntas: List[PreguntaReflexion] = []
    retroalimentacion_final: Optional[RetroalimentacionFinal] = None
    metadata: Dict[str, Any] = {}
