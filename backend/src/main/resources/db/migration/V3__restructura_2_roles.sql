-- V3__restructura_2_roles.sql
-- Reestructura para sistema de 2 roles: ESTUDIANTE y PROFESOR
-- Compatible con MySQL 8.x

-- Actualizar tabla planificaciones con los campos de la pauta institucional real
-- (Solo agrega las columnas que no existen para ser idempotente)

-- Equipo y caracterizacion
ALTER TABLE planificaciones
    ADD COLUMN IF NOT EXISTS equipo_co_ensenanza TEXT,
    ADD COLUMN IF NOT EXISTS num_est_neet INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS diagnosticos_neet TEXT,
    ADD COLUMN IF NOT EXISTS num_est_neep INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS diagnosticos_neep TEXT,
    ADD COLUMN IF NOT EXISTS estilo_visual INT DEFAULT 50,
    ADD COLUMN IF NOT EXISTS estilo_kinestetivo INT DEFAULT 10,
    ADD COLUMN IF NOT EXISTS estilo_auditivo INT DEFAULT 40,
    ADD COLUMN IF NOT EXISTS otros_datos TEXT;

-- Datos generales de la clase
ALTER TABLE planificaciones
    ADD COLUMN IF NOT EXISTS anio_clase INT,
    ADD COLUMN IF NOT EXISTS periodo_clase VARCHAR(50),
    ADD COLUMN IF NOT EXISTS asignatura_clase VARCHAR(150),
    ADD COLUMN IF NOT EXISTS curso_clase VARCHAR(100),
    ADD COLUMN IF NOT EXISTS unidad_tematica TEXT;

-- Objetivos
ALTER TABLE planificaciones
    ADD COLUMN IF NOT EXISTS objetivo_oa TEXT,
    ADD COLUMN IF NOT EXISTS indicadores_evaluacion TEXT,
    ADD COLUMN IF NOT EXISTS objetivo_transversal TEXT,
    ADD COLUMN IF NOT EXISTS objetivo_clase TEXT;

-- 3 Momentos + DUA
ALTER TABLE planificaciones
    ADD COLUMN IF NOT EXISTS momento_inicio TEXT,
    ADD COLUMN IF NOT EXISTS momento_desarrollo TEXT,
    ADD COLUMN IF NOT EXISTS momento_cierre TEXT,
    ADD COLUMN IF NOT EXISTS principios_dua TEXT,
    ADD COLUMN IF NOT EXISTS evaluacion_clase TEXT;

-- PDF y revision
ALTER TABLE planificaciones
    ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS comentario_profesor TEXT,
    ADD COLUMN IF NOT EXISTS retroalimentacion_ia TEXT,
    ADD COLUMN IF NOT EXISTS historial_chatbot TEXT;

-- Relaciones
ALTER TABLE planificaciones
    ADD COLUMN IF NOT EXISTS id_estudiante_autor BIGINT,
    ADD COLUMN IF NOT EXISTS id_profesor_revisor BIGINT;

-- Agregar foreign keys si no existen (MySQL: verificar con INFORMATION_SCHEMA)
-- Cambiar estado ENUM en planificaciones
-- Nota: En MySQL no se puede cambiar ENUM directamente con ALTER en columna existente
-- solo si los valores son diferentes. Verificar y actualizar.
-- La nueva aplicacion Spring Boot crea la tabla con el nuevo ENUM desde cero.