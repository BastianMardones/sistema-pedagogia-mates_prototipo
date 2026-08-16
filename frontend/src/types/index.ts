// src/types/index.ts

export type UserRole = "ESTUDIANTE" | "PROFESOR" | "COORDINADOR" | "DIRECTIVO" | "ADMIN";

export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: UserRole;
  token?: string;
}

export interface Estudiante {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rut?: string;
  activo: boolean;
  createdAt?: string;
}

export type PlanificacionEstado =
  | "BORRADOR"
  | "ENVIADA"
  | "EN_REVISION"
  | "APROBADA"
  | "RECHAZADA";

export interface Planificacion {
  id: number;
  titulo: string;
  descripcion?: string;
  nivel?: string;
  estado: PlanificacionEstado;
  estudiante?: Estudiante;
  archivoUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatMessage {
  role: "bot" | "user";
  content: string;
  timestamp?: Date;
}

export interface ChatSession {
  sesion_id: string;
  estado: "analizando" | "preguntando" | "completado" | "error";
  pregunta_actual: number;
  total_preguntas: number;
  pregunta?: string;
  mensaje?: string;
}

export interface RetroalimentacionSeccion {
  nombre: string;
  puntaje: number;
  maximo: number;
  comentario: string;
  fortalezas: string[];
  mejoras: string[];
}

export interface Retroalimentacion {
  sesion_id: string;
  puntaje_total: number;
  puntaje_maximo: number;
  porcentaje: number;
  nivel_logro: string;
  resumen: string;
  secciones: RetroalimentacionSeccion[];
  recomendaciones: string[];
}

export interface EvaluacionObservacion {
  id: number;
  titulo: string;
  fecha: string;
  profesor?: User;
  estudiante?: Estudiante;
  notaVozUrl?: string;
  transcripcion?: string;
  puntaje?: number;
  createdAt: string;
}
