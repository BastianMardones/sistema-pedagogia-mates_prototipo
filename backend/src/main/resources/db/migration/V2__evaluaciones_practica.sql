-- ============================================================
-- V2__evaluaciones_practica.sql
-- Agrega: tabla de evaluaciones con soporte para notas de voz,
-- criterios de pauta, y registro del chatbot.
-- ============================================================

-- Tabla de evaluaciones de práctica (observación de clases)
CREATE TABLE IF NOT EXISTS evaluaciones_practica (
    id                          BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante               BIGINT NOT NULL,
    id_evaluador                BIGINT NOT NULL,
    id_asignatura               BIGINT,
    tipo_evaluador              ENUM('PROFESOR_COLABORADOR', 'TUTOR_PRACTICA') NOT NULL,
    tipo_observacion            ENUM('MATEMATICA', 'ORIENTACION') NOT NULL,
    fecha_observacion           DATE NOT NULL,
    puntaje_total               DECIMAL(5,2),
    nota_final                  DECIMAL(4,2),
    -- Observaciones cualitativas (pueden venir de nota de voz)
    observaciones_cualitativas  TEXT,
    observaciones_desde_voz     BOOLEAN DEFAULT FALSE,
    audio_url                   VARCHAR(500),
    -- Vinculación con chatbot
    sesion_chatbot_id           VARCHAR(36),
    estado                      ENUM('BORRADOR', 'COMPLETADA', 'ENVIADA') DEFAULT 'BORRADOR',
    created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ep_estudiante  FOREIGN KEY (id_estudiante)  REFERENCES estudiantes(id),
    CONSTRAINT fk_ep_evaluador   FOREIGN KEY (id_evaluador)   REFERENCES usuarios(id),
    CONSTRAINT fk_ep_asignatura  FOREIGN KEY (id_asignatura)  REFERENCES asignaturas(id) ON DELETE SET NULL
);

-- Resultados por criterio de la pauta de observación
CREATE TABLE IF NOT EXISTS resultados_pauta_observacion (
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_evaluacion           BIGINT NOT NULL,
    id_criterio_observacion BIGINT NOT NULL,
    puntaje_obtenido        DECIMAL(3,1) NOT NULL DEFAULT 0 COMMENT 'Escala 1-5',
    observacion_criterio    TEXT,
    CONSTRAINT fk_rpo_eval      FOREIGN KEY (id_evaluacion)           REFERENCES evaluaciones_practica(id) ON DELETE CASCADE,
    CONSTRAINT fk_rpo_criterio  FOREIGN KEY (id_criterio_observacion) REFERENCES criterios_observacion(id),
    UNIQUE KEY uk_rpo (id_evaluacion, id_criterio_observacion)
);

-- Planificaciones con soporte para los 3 momentos, DUA y PIE
-- (amplía la tabla original con los nuevos campos)
ALTER TABLE planificaciones
    ADD COLUMN IF NOT EXISTS instrumento_evaluacion   TEXT,
    ADD COLUMN IF NOT EXISTS inicio                   TEXT,
    ADD COLUMN IF NOT EXISTS desarrollo               TEXT,
    ADD COLUMN IF NOT EXISTS cierre                   TEXT,
    ADD COLUMN IF NOT EXISTS dua_inicio               TEXT,
    ADD COLUMN IF NOT EXISTS dua_desarrollo           TEXT,
    ADD COLUMN IF NOT EXISTS dua_cierre               TEXT,
    ADD COLUMN IF NOT EXISTS adaptaciones_pie         TEXT,
    ADD COLUMN IF NOT EXISTS dificultades_anticipadas TEXT,
    ADD COLUMN IF NOT EXISTS sesion_chatbot_id        VARCHAR(36),
    ADD COLUMN IF NOT EXISTS retroalimentada          BOOLEAN DEFAULT FALSE;

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_eval_practica_estudiante ON evaluaciones_practica(id_estudiante);
CREATE INDEX IF NOT EXISTS idx_eval_practica_asignatura ON evaluaciones_practica(id_asignatura);
CREATE INDEX IF NOT EXISTS idx_planif_sesion_chatbot    ON planificaciones(sesion_chatbot_id);

-- Pauta de observación estándar para práctica (completa)
INSERT IGNORE INTO pautas_observacion (id, nombre, descripcion) VALUES
(2, 'Pauta Observación Práctica Profesional',
 'Pauta oficial para la observación de clases en Práctica Pedagógica y Profesional');

INSERT IGNORE INTO criterios_observacion (id_pauta, nombre, puntaje_max, orden) VALUES
(2, 'Dominio del contenido matemático', 5.0, 1),
(2, 'Planificación y organización de la clase', 5.0, 2),
(2, 'Claridad y coherencia en la presentación del objetivo', 5.0, 3),
(2, 'Estrategias de enseñanza utilizadas (metodología)', 5.0, 4),
(2, 'Implementación del DUA en la práctica', 5.0, 5),
(2, 'Atención a la diversidad e inclusión (PIE)', 5.0, 6),
(2, 'Gestión del tiempo y momentos de la clase', 5.0, 7),
(2, 'Interacción y retroalimentación con estudiantes', 5.0, 8),
(2, 'Coherencia entre planificación y ejecución', 5.0, 9),
(2, 'Reflexión y autoevaluación al cierre', 5.0, 10);
