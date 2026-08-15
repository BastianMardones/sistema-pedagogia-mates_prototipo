# 🎓 Sistema de Gestión Pedagógica — Pedagogía en Matemáticas

Sistema web para la gestión integral del programa de Pedagogía en Matemáticas, diseñado para centralizar información, digitalizar pautas de evaluación, registrar planificaciones de clase y proveer síntesis inteligente de información a través de un chatbot conversacional.

---

## 📋 Descripción del Problema

La carrera de Pedagogía en Matemáticas enfrenta los siguientes desafíos:
- **Dispersión de la información** entre múltiples profesores y asignaturas
- **Pautas de evaluación manuales** sin registro digital
- **Coordinación difícil** entre múltiples profesores
- **Necesidad de informes** por asignatura y por estudiante
- **Sin síntesis de información** del estado académico global
- **Planificaciones de clase** sin registro formal
- **Evaluaciones de profesores** (observación de clases) sin digitalizar

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Backend** | Spring Boot | 3.3.x |
| **Lenguaje** | Java | 21 |
| **Base de datos** | MySQL | 8.0 |
| **Frontend** | Next.js (React) | 14 |
| **Chatbot IA** | Python + FastAPI + LangChain + Gemini | 3.11 |
| **Auth** | Spring Security + JWT | - |
| **Contenedores** | Docker + Docker Compose | - |
| **Testing** | JUnit 5 + Mockito + Postman | - |
| **Versionamiento** | Git + GitHub | - |

---

## 🚀 Cómo ejecutar el proyecto

### Requisitos previos
- Docker Desktop instalado y corriendo
- Git

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU-USUARIO/sistema-pedagogia-mates.git
cd sistema-pedagogia-mates
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### 3. Ejecutar con Docker Compose
```bash
docker-compose up --build
```

### 4. Acceder a la aplicación
| Servicio | URL |
|----------|-----|
| Frontend (Next.js) | http://localhost:3000 |
| Backend API (Spring Boot) | http://localhost:8080 |
| Chatbot API (Python) | http://localhost:8000 |
| Base de datos (MySQL) | localhost:3306 |

### Usuario administrador por defecto
```
Email: admin@pedagogia.cl
Contraseña: password
```

---

## 📁 Estructura del Proyecto

```
sistema-pedagogia-mates/
├── backend/                    # Spring Boot API REST
│   ├── src/main/java/cl/pedagogia/backend/
│   │   ├── controller/         # Endpoints REST
│   │   ├── service/            # Lógica de negocio
│   │   ├── repository/         # Acceso a datos (JPA)
│   │   ├── model/              # Entidades JPA
│   │   ├── dto/                # Data Transfer Objects
│   │   ├── security/           # JWT + Spring Security
│   │   └── config/             # Configuraciones
│   ├── src/main/resources/
│   │   └── db/migration/       # Scripts Flyway (esquema BD)
│   └── Dockerfile
├── frontend/                   # Next.js UI
│   └── Dockerfile
├── chatbot/                    # Python FastAPI + LangChain
│   └── Dockerfile
├── docker-compose.yml          # Orquestación de contenedores
├── .env.example                # Variables de entorno (plantilla)
└── .gitignore
```

---

## 🗂️ API Endpoints

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/register` | Registrar usuario (Admin) |

### Estudiantes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/estudiantes` | Listar todos |
| GET | `/api/estudiantes/{id}` | Ver uno |
| GET | `/api/estudiantes/buscar?q=` | Buscar por nombre/RUT |
| POST | `/api/estudiantes` | Crear |
| PUT | `/api/estudiantes/{id}` | Actualizar |
| DELETE | `/api/estudiantes/{id}` | Desactivar |

### Asignaturas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/asignaturas` | Listar todas |
| POST | `/api/asignaturas` | Crear |
| PUT | `/api/asignaturas/{id}` | Actualizar |

### Planificaciones
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/planificaciones` | Listar |
| POST | `/api/planificaciones` | Crear |
| PATCH | `/api/planificaciones/{id}/ejecutar` | Marcar como ejecutada |

---

## 👥 Equipo

| Nombre | Rol Scrum | Responsabilidad |
|--------|-----------|-----------------|
| | Product Owner | Backlog, cliente |
| | Scrum Master | Trello, coordinación |
| | Dev Backend | Spring Boot, JUnit |
| | Dev Frontend | Next.js, chatbot |

---

## 📅 Sprints

| Sprint | Entrega | Estado |
|--------|---------|--------|
| Sprint 1 | 9-10 Sep 2026 | 🔄 En progreso |
| Sprint 2 | 28 Oct 2026 | ⏳ Pendiente |
| Sprint 3 | 25 Nov 2026 | ⏳ Pendiente |

---

## 📄 Licencia

Proyecto académico — Universidad del Bío-Bío | Ingeniería de Software 2026-2
