/**
 * =============================================================================
 * MÓDULO: api.ts — Capa de Comunicación HTTP (Cliente Axios)
 * PROYECTO: Sistema de Gestión de Prácticas Pedagógicas (SGP Matemáticas - UBB)
 * =============================================================================
 * PROPÓSITO:
 * Centraliza todas las peticiones HTTP del Frontend Next.js hacia los dos
 * servicios de backend de la arquitectura:
 *   1. `api` (Puerto 8081): Backend transaccional en Java Spring Boot 3 + MySQL.
 *      Incluye un interceptor que adjunta automáticamente el token JWT (`Bearer`)
 *      almacenado en `localStorage` en cada petición protegida.
 *   2. `chatbotApi` (Puerto 8000): Microservicio de Inteligencia Artificial en
 *      Python FastAPI para el análisis de planificaciones PDF (Chatbot Socrático)
 *      y la transcripción de notas de voz de evaluaciones docentes (`/voz/transcribir`).
 * =============================================================================
 */

import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api";
const CHATBOT_URL = process.env.NEXT_PUBLIC_CHATBOT_URL || "http://localhost:8000";

/** Cliente Axios para el Backend principal en Spring Boot (Puerto 8081) */
export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

/** Cliente Axios para el Microservicio de Chatbot y Voz en Python FastAPI (Puerto 8000) */
export const chatbotApi = axios.create({
  baseURL: CHATBOT_URL,
});

/**
 * Interceptor de seguridad JWT:
 * Antes de enviar cualquier petición al backend Spring Boot, verifica si existe
 * un token JWT en `localStorage` y lo inyecta en la cabecera `Authorization`.
 */
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/** Servicio de Autenticación (Login y Registro de Usuarios con JWT) */
export const authService = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (data: { nombre: string; apellido: string; email: string; password: string; rol: string }) =>
    api.post("/auth/register", data),
};

/**
 * Servicio de Gestión de Planificaciones de Clase:
 * Cubre el ciclo completo: creación en borrador, subida de PDF, envío a revisión,
 * almacenamiento del historial del Chatbot y visto bueno (aprobación/rechazo) del Profesor.
 */
export const planificacionService = {
  getAll: () => api.get("/planificaciones"),
  getById: (id: number) => api.get(`/planificaciones/${id}`),
  create: (data: any) => api.post("/planificaciones", data),
  update: (id: number, data: any) => api.put(`/planificaciones/${id}`, data),
  submitForReview: (id: number) => api.patch(`/planificaciones/${id}/enviar`),
  uploadPdf: (id: number, archivo: File) => {
    const formData = new FormData();
    formData.append("archivo", archivo);
    return api.post(`/planificaciones/${id}/pdf`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  aprobar: (id: number, comentario?: string) =>
    api.patch(`/planificaciones/${id}/aprobar`, { comentario }),
  rechazar: (id: number, comentario: string) =>
    api.patch(`/planificaciones/${id}/rechazar`, { comentario }),
  getPendientes: () => api.get("/planificaciones/pendientes"),
  guardarHistorialChatbot: (id: number, data: { retroalimentacionIA: string; historialChatbot: string }) =>
    api.patch(`/planificaciones/${id}/chatbot`, data),
};

/** Servicio de Consulta de Estudiantes en Práctica (Exclusivo para rol PROFESOR) */
export const usuarioService = {
  getMisEstudiantes: () => api.get("/usuarios/estudiantes"),
  getEstudianteById: (id: number) => api.get(`/usuarios/estudiantes/${id}`),
  getPlanificacionesDeEstudiante: (estudianteId: number) =>
    api.get(`/planificaciones?estudianteId=${estudianteId}`),
};

/**
 * Servicio del Chatbot Pedagógico (FastAPI - Puerto 8000):
 * 1. `analizarPlanificacion`: Envía el PDF y el ciclo de práctica para verificar elementos mínimos.
 * 2. `responderPregunta`: Procesa cada una de las 5 respuestas reflexivas del estudiante.
 * 3. `getSesion` / `getRetroalimentacion`: Recupera el historial y diagnóstico por sección.
 */
export const chatbotService = {
  analizarPlanificacion: (archivo: File, nivelEstudiante: string) => {
    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("nivel_estudiante", nivelEstudiante);
    return chatbotApi.post("/analizar-planificacion", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  responderPregunta: (sesionId: string, respuesta: string) =>
    chatbotApi.post("/responder-pregunta", { sesion_id: sesionId, respuesta }),
  getSesion: (sesionId: string) =>
    chatbotApi.get(`/sesion/${sesionId}`),
  getRetroalimentacion: (sesionId: string) =>
    chatbotApi.get(`/sesion/${sesionId}/retroalimentacion`),
};

/**
 * Servicio de Evaluaciones de Observación en Aula (Exclusivo para rol PROFESOR):
 * Conecta con Spring Boot (`/api/evaluaciones`) para guardar la rúbrica y con
 * FastAPI (`/voz/transcribir`) para convertir notas de voz en texto.
 */
export const evaluacionService = {
  getAll: () => api.get("/evaluaciones"),
  getById: (id: number) => api.get(`/evaluaciones/${id}`),
  create: (data: any) => api.post("/evaluaciones", data),
  update: (id: number, data: any) => api.put(`/evaluaciones/${id}`, data),
  transcribirVoz: (audioBlob: Blob, formato: string = "webm") => {
    const formData = new FormData();
    formData.append("audio", audioBlob, `nota_voz.${formato}`);
    formData.append("formato", formato);
    return chatbotApi.post("/voz/transcribir", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
