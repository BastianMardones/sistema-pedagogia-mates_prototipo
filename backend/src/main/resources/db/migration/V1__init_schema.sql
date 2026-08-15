-- ============================================================
-- V1__init_schema.sql
-- Esquema inicial del Sistema de Gestión Pedagógica
-- Pedagogía en Matemáticas — ISW 2026-2
-- ============================================================

-- -------------------------------------------------------------
-- USUARIOS (Profesores, Directivos, Admin)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    apellido    VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    rol         ENUM('ADMIN', 'PROFESOR', 'DIRECTIVO') NOT NULL DEFAULT 'PROFESOR',
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- ESTUDIANTES
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS estudiantes (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    rut             VARCHAR(12) NOT NULL UNIQUE,
    nombre          VARCHAR(100) NOT NULL,
    apellido        VARCHAR(100) NOT NULL,
    email           VARCHAR(150),
    fecha_ingreso   DATE,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- ASIGNATURAS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asignaturas (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo          VARCHAR(20) NOT NULL UNIQUE,
    nombre          VARCHAR(200) NOT NULL,
    semestre        TINYINT NOT NULL COMMENT '1 o 2',
    anio            YEAR NOT NULL,
    id_profesor     BIGINT,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_asig_profesor FOREIGN KEY (id_profesor)
        REFERENCES usuarios(id) ON DELETE SET NULL
);

-- -------------------------------------------------------------
-- MATRÍCULAS (relación Estudiante ↔ Asignatura)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matriculas (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante   BIGINT NOT NULL,
    id_asignatura   BIGINT NOT NULL,
    fecha_matricula DATE DEFAULT (CURRENT_DATE),
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_mat_estudiante FOREIGN KEY (id_estudiante)
        REFERENCES estudiantes(id) ON DELETE CASCADE,
    CONSTRAINT fk_mat_asignatura FOREIGN KEY (id_asignatura)
        REFERENCES asignaturas(id) ON DELETE CASCADE,
    UNIQUE KEY uk_matricula (id_estudiante, id_asignatura)
);

-- -------------------------------------------------------------
-- PLANIFICACIONES DE CLASE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS planificaciones (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_asignatura   BIGINT NOT NULL,
    id_profesor     BIGINT NOT NULL,
    titulo          VARCHAR(200) NOT NULL,
    fecha_clase     DATE NOT NULL,
    objetivo        TEXT NOT NULL,
    contenidos      TEXT,
    metodologia     TEXT,
    recursos        TEXT,
    estado          ENUM('PENDIENTE', 'EJECUTADA', 'CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
    observaciones   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_plan_asig FOREIGN KEY (id_asignatura)
        REFERENCES asignaturas(id) ON DELETE CASCADE,
    CONSTRAINT fk_plan_prof FOREIGN KEY (id_profesor)
        REFERENCES usuarios(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- PAUTAS DE EVALUACIÓN
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pautas_evaluacion (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(200) NOT NULL,
    descripcion     TEXT,
    id_asignatura   BIGINT NOT NULL,
    id_profesor     BIGINT NOT NULL,
    fecha_aplicacion DATE,
    puntaje_total   DECIMAL(6,2),
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pauta_asig FOREIGN KEY (id_asignatura)
        REFERENCES asignaturas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pauta_prof FOREIGN KEY (id_profesor)
        REFERENCES usuarios(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- CRITERIOS DE EVALUACIÓN (dentro de una pauta)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS criterios_evaluacion (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_pauta    BIGINT NOT NULL,
    nombre      VARCHAR(200) NOT NULL,
    descripcion TEXT,
    puntaje_max DECIMAL(5,2) NOT NULL,
    orden       INT DEFAULT 0,
    CONSTRAINT fk_criterio_pauta FOREIGN KEY (id_pauta)
        REFERENCES pautas_evaluacion(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- RESULTADOS DE EVALUACIÓN (Estudiante evaluado en una pauta)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resultados_evaluacion (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_pauta        BIGINT NOT NULL,
    id_estudiante   BIGINT NOT NULL,
    id_criterio     BIGINT NOT NULL,
    puntaje_obtenido DECIMAL(5,2) NOT NULL DEFAULT 0,
    observacion     TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_res_pauta     FOREIGN KEY (id_pauta)      REFERENCES pautas_evaluacion(id) ON DELETE CASCADE,
    CONSTRAINT fk_res_estudiante FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id)       ON DELETE CASCADE,
    CONSTRAINT fk_res_criterio  FOREIGN KEY (id_criterio)   REFERENCES criterios_evaluacion(id) ON DELETE CASCADE,
    UNIQUE KEY uk_resultado (id_pauta, id_estudiante, id_criterio)
);

-- -------------------------------------------------------------
-- PAUTAS DE OBSERVACIÓN DE CLASE (para evaluar profesores)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pautas_observacion (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(200) NOT NULL,
    descripcion TEXT,
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS criterios_observacion (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_pauta        BIGINT NOT NULL,
    nombre          VARCHAR(200) NOT NULL,
    descripcion     TEXT,
    puntaje_max     DECIMAL(5,2) NOT NULL,
    orden           INT DEFAULT 0,
    CONSTRAINT fk_crit_obs_pauta FOREIGN KEY (id_pauta)
        REFERENCES pautas_observacion(id) ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- EVALUACIONES DE PROFESOR (Observación de clase)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evaluaciones_profesor (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_profesor_evaluado BIGINT NOT NULL,
    id_evaluador        BIGINT NOT NULL,
    id_planificacion    BIGINT,
    id_pauta_observacion BIGINT,
    fecha               DATE NOT NULL,
    comentarios_generales TEXT,
    puntaje_total       DECIMAL(5,2),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_eval_prof     FOREIGN KEY (id_profesor_evaluado) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_eval_evaluador FOREIGN KEY (id_evaluador)        REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_eval_plan     FOREIGN KEY (id_planificacion)     REFERENCES planificaciones(id) ON DELETE SET NULL,
    CONSTRAINT fk_eval_pauta_obs FOREIGN KEY (id_pauta_observacion) REFERENCES pautas_observacion(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS resultados_observacion (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_evaluacion_prof  BIGINT NOT NULL,
    id_criterio_obs     BIGINT NOT NULL,
    puntaje_obtenido    DECIMAL(5,2) NOT NULL DEFAULT 0,
    observacion         TEXT,
    CONSTRAINT fk_res_obs_eval    FOREIGN KEY (id_evaluacion_prof) REFERENCES evaluaciones_profesor(id) ON DELETE CASCADE,
    CONSTRAINT fk_res_obs_criterio FOREIGN KEY (id_criterio_obs)   REFERENCES criterios_observacion(id) ON DELETE CASCADE,
    UNIQUE KEY uk_res_obs (id_evaluacion_prof, id_criterio_obs)
);

-- ============================================================
-- DATOS INICIALES (seed)
-- ============================================================

-- Usuario administrador por defecto
-- Contraseña: Admin1234! (BCrypt hash)
INSERT IGNORE INTO usuarios (nombre, apellido, email, password, rol) VALUES
('Admin', 'Sistema', 'admin@pedagogia.cl',
 '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'ADMIN');

-- Pauta de observación de clase estándar
INSERT IGNORE INTO pautas_observacion (id, nombre, descripcion) VALUES
(1, 'Pauta Observación Clase Estándar',
 'Pauta oficial para la observación y evaluación de clases en Pedagogía en Matemáticas');

INSERT IGNORE INTO criterios_observacion (id_pauta, nombre, puntaje_max, orden) VALUES
(1, 'Dominio del contenido disciplinar', 5.0, 1),
(1, 'Claridad en la presentación de objetivos', 5.0, 2),
(1, 'Estrategias metodológicas utilizadas', 5.0, 3),
(1, 'Gestión del tiempo y la clase', 5.0, 4),
(1, 'Interacción con los estudiantes', 5.0, 5),
(1, 'Coherencia con la planificación presentada', 5.0, 6);
