// src/types/index.ts - Sistema de Gestion Pedagogica (2 roles: ESTUDIANTE, PROFESOR)

export type UserRole = "ESTUDIANTE" | "PROFESOR";

export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: UserRole;
  token?: string;
}

// Planificacion (alineada con pauta real de practica profesional)
export type PlanificacionEstado =
  | "BORRADOR"
  | "EN_REVISION"
  | "APROBADA"
  | "RECHAZADA";

export interface Planificacion {
  id: number;
  titulo: string;

  // Equipo y caracterizacion del curso
  equipoCoEnsenanza?: string;
  numEstNEET?: number;
  diagnosticosNEET?: string;
  numEstNEEP?: number;
  diagnosticosNEEP?: string;
  estiloVisual?: number;
  estiloKinestetivo?: number;
  estiloAuditivo?: number;
  otrosDatos?: string;

  // Datos generales
  anioClase?: number;
  periodoClase?: string;
  asignaturaClase?: string;
  cursoClase?: string;
  unidadTematica?: string;

  // Objetivos
  objetivoOA?: string;
  indicadoresEvaluacion?: string;
  objetivoTransversal?: string;
  objetivoClase?: string;

  // 3 Momentos
  momentoInicio?: string;
  momentoDesarrollo?: string;
  momentoCierre?: string;
  principiosDUA?: string;
  evaluacionClase?: string;

  // PDF
  pdfUrl?: string;

  // Estado y revision
  estado: PlanificacionEstado;
  comentarioProfesor?: string;
  retroalimentacionIA?: string;
  historialChatbot?: string;

  // Relaciones
  estudianteAutorId?: number;
  estudianteAutorNombre?: string;
  profesorRevisorId?: number;

  // Fechas
  createdAt: string;
  updatedAt?: string;
}

// Chatbot
export interface ChatMessage {
  role: "bot" | "user";
  content: string;
  timestamp?: Date;
}

export interface PreguntaReflexion {
  numero: number;
  aspecto: string;
  pregunta: string;
  respuesta?: string;
  respuesta_valida?: boolean;
}

export interface ChatSession {
  sesion_id: string;
  pasa_verificacion?: boolean;
  primera_pregunta?: PreguntaReflexion;
  mensaje?: string;
  estado?: string;
  siguiente_pregunta?: PreguntaReflexion;
  preguntas_completadas?: number;
  total_preguntas?: number;
  retroalimentacion?: any;
}

// Retroalimentacion
export interface RetroalimentacionSeccion {
  seccion: string;
  evaluacion: string;
  fortalezas: string[];
  areas_mejora: string[];
  sugerencias: string[];
}

export interface RetroalimentacionFinal {
  sesion_id: string;
  diagnostico_general: string;
  nivel_planificacion: string;
  secciones: RetroalimentacionSeccion[];
  recomendaciones_prioritarias: string[];
  puede_ir_al_colegio: boolean;
  observaciones_para_profesor?: string;
}

// Evaluacion de Observacion
export interface CriterioRubrica {
  nombre: string;
  descripcion: string;
  puntaje: number;
  maxPuntaje: number;
}

export interface EvaluacionObservacion {
  id: number;
  titulo: string;
  fecha: string;
  estudianteNombre?: string;
  notaVozUrl?: string;
  transcripcion?: string;
  criterios?: CriterioRubrica[];
  puntajeTotal?: number;
  maxPuntaje?: number;
  estado: "BORRADOR" | "COMPLETADA";
  createdAt: string;
}

export interface PortafolioStats {
  totalPlanificaciones: number;
  aprobadas: number;
  enRevision: number;
  rechazadas: number;
  cicloPractica: string;
}
