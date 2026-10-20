# Sistema de Gestión de Prácticas Pedagógicas (SGP Matemáticas — Prototipo Funcional)

Prototipo integral de ingeniería de software desarrollado para la **Carrera de Pedagogía en Educación Matemática (Universidad del Bío-Bío)**, diseñado para centralizar el portafolio de prácticas, automatizar la reflexión pedagógica previa al aula mediante un **Chatbot Socrático con IA** y digitalizar las observaciones en terreno con **Transcripción de Notas de Voz en Español (`es-CL`)**.

---

## 🏛️ 1. Arquitectura General del Sistema (4 Capas)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                 FRONTEND WEB — Next.js 14 + TypeScript + Tailwind            │
│                         (http://localhost:3000)                              │
│  • Login por Roles (Estudiante / Profesor) con Acceso Rápido                 │
│  • Formulario Pauta UBB (OA MINEDUC, 3 Momentos, DUA, PIE NEET/NEEP)         │
│  • Interfaz de Chatbot Reflexivo (Drag & Drop PDF + 5 Preguntas + Rúbrica)   │
│  • Módulo de Evaluaciones con Grabación y Transcripción de Voz en Vivo       │
└───────────────────┬──────────────────────────────────────┬───────────────────┘
                    │ REST API + JWT (Bearer)              │ Multipart PDF / Audio
                    ▼                                      ▼
┌───────────────────────────────────────┐  ┌───────────────────────────────────┐
│   BACKEND CORE — Spring Boot 3.4      │  │ MICROSERVICIO IA & VOZ — FastAPI  │
│        (Java 21 • Puerto 8081)        │  │     (Python 3.13 • Puerto 8000)   │
│  • Spring Security 6 + Filtro JWT     │  │  • Filtro de Elementos Mínimos    │
│  • Gestión de Planificaciones y V°B°  │  │  • Diálogo Socrático (5 preguntas)│
│  • Historial Auditable de Chatbot     │  │  • Gemini 2.0 Flash + FAISS RAG   │
│  • API de Evaluaciones y Rúbricas     │  │  • Motor Heurístico Offline       │
│  • Migraciones Flyway (V1, V2, V3)    │  │  • STT Voz: SpeechRecognition /   │
└───────────────────┬───────────────────┘  │    Whisper Local + FFmpeg         │
                    │ JPA / Hibernate      └───────────────────────────────────┘
                    ▼
┌───────────────────────────────────────┐
│   BASE DE DATOS — MySQL / MariaDB     │
│      (Puerto 3306 • pedagogia_db)     │
└───────────────────────────────────────┘
```

---

## 📂 2. Mapa del Código Fuente (Estructura del Repositorio)

### A. Microservicio de Chatbot y Transcripción de Voz (`/chatbot`)
* [`chatbot/main.py`](./chatbot/main.py): Servidor FastAPI que expone los endpoints `/analizar-planificacion`, `/responder-pregunta`, `/sesion/{id}/retroalimentacion` y `/voz/transcribir`.
* [`chatbot/app/chatbot_service.py`](./chatbot/app/chatbot_service.py): Núcleo del tutor inteligente. Opera en modo dual: **LLM Cloud (Google Gemini 2.0 Flash)** o **Motor Pedagógico Autónomo Local** (sin dependencia de API externa). Verifica los 5 elementos obligatorios de la pauta UBB (OA MINEDUC, 3 Momentos, DUA, Caracterización NEET/NEEP e Instrumento de Evaluación), genera las 5 preguntas de reflexión, valida que las respuestas del alumno no sean evasivas y emite retroalimentación en 7 secciones.
* [`chatbot/app/voice_service.py`](./chatbot/app/voice_service.py): Servicio de transcripción de notas de voz bajo el **Patrón Strategy** (`SpeechRecognitionRealProvider` en `es-CL`, `WhisperLocalProvider` y `GoogleSpeechProvider`), con normalización de audio a WAV PCM 16kHz vía FFmpeg.
* [`chatbot/app/knowledge_base.py`](./chatbot/app/knowledge_base.py): Base de conocimiento normativa de la UBB vectorizada con **FAISS (RAG)** sobre los 3 momentos de la clase, Taxonomía de Bloom, los 3 Principios DUA y adaptaciones PIE.
* [`chatbot/app/models.py`](./chatbot/app/models.py): Esquemas de validación Pydantic para sesiones, preguntas reflexivas y retroalimentación estructurada.

### B. Backend Transaccional (`/backend`)
* [`SecurityConfig.java`](./backend/src/main/java/cl/pedagogia/backend/config/SecurityConfig.java): Configuración de Spring Security 6 sin estado (`STATELESS`), CORS y control de acceso por rol (`ESTUDIANTE`, `PROFESOR`).
* [`PlanificacionController.java`](./backend/src/main/java/cl/pedagogia/backend/controller/PlanificacionController.java): CRUD completo de planificaciones, subida de archivos PDF, asociación del historial de conversación con el Chatbot y flujo de Visto Bueno docente (`EN_REVISION` $\rightarrow$ `APROBADA` / `RECHAZADA`).
* [`EvaluacionController.java`](./backend/src/main/java/cl/pedagogia/backend/controller/EvaluacionController.java): Endpoints REST (`/api/evaluaciones`) para listar y guardar pautas de observación de clases con rúbrica de 7 criterios y transcripción de notas de voz.
* [`DataInitializer.java`](./backend/src/main/java/cl/pedagogia/backend/config/DataInitializer.java): Semilla automática que crea las cuentas de prueba y las 6 asignaturas de la línea de práctica (Ciclo Inicial, Intermedio y Final).
* [`db/migration/`](./backend/src/main/resources/db/migration): Scripts SQL versionados con **Flyway** (`V1__init_schema.sql`, `V2__evaluaciones_practica.sql`, `V3__restructura_2_roles.sql`).

### C. Frontend Web (`/frontend`)
* [`src/lib/api.ts`](./frontend/src/lib/api.ts): Clientes Axios (`api` hacia puerto 8081 con interceptor JWT automático y `chatbotApi` hacia puerto 8000).
* [`src/app/page.tsx`](./frontend/src/app/page.tsx): Pantalla de inicio de sesión institucional con botones de acceso rápido para demostración.
* [`src/app/dashboard/page.tsx`](./frontend/src/app/dashboard/page.tsx): Tablero adaptativo según rol (Portafolio de entregas para el Estudiante / Panel de supervisión de pendientes para el Profesor).
* [`src/app/chatbot/page.tsx`](./frontend/src/app/chatbot/page.tsx): Interfaz interactiva del Chatbot Pedagógico con carga de PDF por *Drag & Drop*, alerta de rechazo por elementos faltantes, barra de progreso de las 5 preguntas y despliegue del informe de retroalimentación.
* [`src/app/evaluaciones/page.tsx`](./frontend/src/app/evaluaciones/page.tsx): Módulo docente de observación en aula con rúbrica interactiva (1 a 5 puntos) y **grabador de voz dual** (dictado en tiempo real con `Web Speech API es-CL` + grabación de clip de audio con `MediaRecorder` y respaldo en servidor Python).
* [`src/app/planificaciones/[id]/revisar/page.tsx`](./frontend/src/app/planificaciones/[id]/revisar/page.tsx): Vista exclusiva del Profesor que permite **auditar toda la conversación que tuvo el estudiante con el Chatbot** antes de aprobar o rechazar su planificación.

---

## 🚀 3. Ejecución Rápida del Prototipo

En Windows PowerShell, ejecuta el script automatizado incluido en la raíz:

```powershell
.\start-all.ps1
```

Esto iniciará automáticamente los 4 servicios:
1. **Base de Datos (MariaDB/MySQL):** `localhost:3306` (`pedagogia_db`)
2. **Backend (Spring Boot 3):** `http://localhost:8081`
3. **Chatbot & Voz (FastAPI):** `http://127.0.0.1:8000` (Swagger UI en `/docs`)
4. **Frontend (Next.js 14):** `http://localhost:3000`

### Credenciales de Prueba Pre-cargadas:
* **Rol Estudiante:** `estudiante@pedagogia.cl` / Contraseña: `password`
* **Rol Profesor:** `profesor@pedagogia.cl` / Contraseña: `password`
