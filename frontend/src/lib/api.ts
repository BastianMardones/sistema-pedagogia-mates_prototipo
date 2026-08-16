import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const CHATBOT_URL = process.env.NEXT_PUBLIC_CHATBOT_URL || "http://localhost:8000";

// Cliente para el backend Spring Boot
export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Cliente para el chatbot Python
export const chatbotApi = axios.create({
  baseURL: CHATBOT_URL,
});

// Interceptor para agregar JWT
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth
export const authService = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (data: { nombre: string; apellido: string; email: string; password: string; rol: string }) =>
    api.post("/auth/register", data),
};

// Estudiantes
export const estudianteService = {
  getAll: () => api.get("/estudiantes"),
  getById: (id: number) => api.get(`/estudiantes/${id}`),
  search: (q: string) => api.get(`/estudiantes/buscar?q=${q}`),
  create: (data: any) => api.post("/estudiantes", data),
  update: (id: number, data: any) => api.put(`/estudiantes/${id}`, data),
  deactivate: (id: number) => api.delete(`/estudiantes/${id}`),
};

// Planificaciones
export const planificacionService = {
  getAll: () => api.get("/planificaciones"),
  getById: (id: number) => api.get(`/planificaciones/${id}`),
  create: (data: any) => api.post("/planificaciones", data),
  update: (id: number, data: any) => api.put(`/planificaciones/${id}`, data),
  ejecutar: (id: number) => api.patch(`/planificaciones/${id}/ejecutar`),
};

// Chatbot
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
