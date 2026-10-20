# Modelado de Procesos de Negocio (BPMN) — Sistema de Gestión de Prácticas

Este documento contiene la especificación y los diagramas formales de procesos bajo estándar **BPMN (Business Process Model and Notation)** para la entrega del **Sprint 1 de Ingeniería de Software 2026**.

---

## 1. Proceso Actual del Cliente: Diagrama As-Is (BPMN)

### Descripción de la Problemática Detectada
En el proceso actual de la carrera de Pedagogía en Educación Matemática de la UBB:
1. **Planificación aislada:** El estudiante redacta su planificación en documentos Word sin una guía interactiva ni validación previa de directrices curriculares y DUA.
2. **Evaluaciones en papel y presión de tiempo:** Durante la observación en el aula escolar, cuando toca el timbre el profesor colaborador debe trasladarse inmediatamente a otra sala, lo que provoca observaciones cualitativas incompletas o apresuradas.
3. **Logística física ineficiente:** Las evaluaciones se acumulan en carpetas de papel que el estudiante traslada físicamente a la universidad al finalizar las semanas de práctica (1 pauta en práctica intermedia, 4 en pedagógica, 8 en profesional).
4. **Carga administrativa docente:** El profesor de la asignatura universitaria debe transcribir manualmente cada pauta física a planillas Excel para calcular promedios, existiendo riesgo de extravío, inconsistencias y nula retroalimentación formativa oportuna.

### Diagrama As-Is en Notación Mermaid (BPMN Workflow)

```mermaid
flowchart TD
    subgraph Estudiante["Estudiante en Práctica"]
        E1([Inicio: Necesidad de preparar clase]) --> E2[Redactar planificación en Word]
        E2 --> E3[Imprimir planificación en papel]
        E3 --> E4[Asistir al centro de práctica / colegio]
        E4 --> E5[Impartir clase en aula]
        E5 --> E6[Recibir pauta física firmada al terminar]
        E6 --> E7[Archivar hojas en carpeta física de práctica]
        E7 --> E8[Trasladar carpeta física a la universidad]
        E8 --> E9([Fin del ciclo en aula])
    end

    subgraph Colegio["Profesor Colaborador (Colegio)"]
        C1([Inicio de observación de clase]) --> C2[Recibir pauta de evaluación en papel]
        C2 --> C3[Observar desempeño docente del practicante]
        C3 --> C4{Suena el timbre?}
        C4 -- Sí --> C5[Llenar puntajes y notas apresuradamente a mano]
        C5 --> C6[Firmar pauta en papel y entregar al estudiante]
        C6 --> C7([Docente se retira a otra clase])
    end

    subgraph Universidad["Profesor de Asignatura (Universidad)"]
        U1([Recepción de carpetas de fin de semestre]) --> U2[Recibir decenas de carpetas físicas en papel]
        U2 --> U3[Revisar pauta por pauta de cada estudiante]
        U3 --> U4[Digitar manualmente notas en planilla Excel]
        U4 --> U5[Calcular promedios ponderados manualmente]
        U5 --> U6{Inconsistencia o extravío de hojas?}
        U6 -- Sí --> U7[Contactar al estudiante/colegio para regularizar]
        U6 -- No --> U8[Subir notas finales a intranet UBB]
        U7 --> U8
        U8 --> U9([Cierre de actas de práctica])
    end

    E5 -. Observación en vivo .-> C3
    C6 -. Entrega física .-> E6
    E8 -. Entrega carpeta .-> U2
```

---

## 2. Proceso Mejorado Propuesto: Diagrama To-Do (BPMN)

### Descripción de la Propuesta de Valor (SGP Matemáticas)
1. **Estandarización y reflexión pedagógica:** El estudiante planifica en la plataforma web mediante un formulario guiado por la pauta oficial (6 dimensiones). Antes de enviar, un **Chatbot IA Pedagógico** valida los 5 mínimos obligatorios y formula preguntas de mediación para potenciar la coherencia didáctica y el enfoque DUA.
2. **Supervisión y control docente previo:** El profesor tutor revisa la planificación en línea, accediendo a la retroalimentación del chatbot, y aprueba o rechaza con comentarios antes de que la clase sea ejecutada.
3. **Observación ágil con notas de voz:** El evaluador (profesor colaborador o tutor) califica la rúbrica digital desde cualquier dispositivo móvil o laptop. Para no perder tiempo escribiendo cuando toca el timbre, graba **notas de voz** que la IA (Whisper) transcribe automáticamente a texto editable.
4. **Cálculo automatizado y trazabilidad:** Las calificaciones, ponderaciones y portafolios se consolidan en tiempo real en la base de datos MySQL, eliminando el papel y la transcripción manual.

### Diagrama To-Do en Notación Mermaid (BPMN Workflow)

```mermaid
flowchart TD
    subgraph Estudiante["Estudiante en Práctica"]
        ET1([Inicio: Preparación de clase]) --> ET2[Ingresar a plataforma SGP Matemáticas]
        ET2 --> ET3[Completar formulario de planificación: 6 dimensiones]
        ET3 --> ET4[Solicitar validación al Chatbot Pedagógico IA]
        ET4 --> ET5[Responder preguntas de reflexión socrática del Chatbot]
        ET5 --> ET6[Ajustar planificación con sugerencias DUA/OA]
        ET6 --> ET7[Enviar planificación a revisión docente]
        ET7 --> ET8{Estado de revisión}
        ET8 -- Rechazada --> ET9[Revisar comentarios del profesor y corregir]
        ET9 --> ET7
        ET8 -- Aprobada --> ET10[Impartir clase en colegio con planificación aprobada]
        ET10 --> ET11([Fin de ejecución de clase])
    end

    subgraph Sistema["Plataforma SGP Matemáticas (Backend + IA)"]
        S1[Registrar planificación en estado BORRADOR]
        S2[Motor IA: Validar 5 mínimos + Generar preguntas reflexión]
        S3[Persistir retroalimentación IA en BD MySQL]
        S4[Cambiar estado a EN_REVISION y notificar a profesor]
        S5[Actualizar estado a APROBADA o RECHAZADA]
        S6[Capturar audio de voz del evaluador]
        S7[Motor Whisper: Transcribir voz a texto editable]
        S8[Calcular puntaje total y nota automáticamente]
        S9[Consolidar historial y portafolio del estudiante en tiempo real]
    end

    subgraph Profesor["Profesor Tutor / Evaluador"]
        PT1([Notificación de nueva planificación]) --> PT2[Acceder a bandeja de planificaciones pendientes]
        PT2 --> PT3[Revisar planificación + informe del Chatbot IA]
        PT3 --> PT4{Decisión docente}
        PT4 -- Rechazar --> PT5[Ingresar observaciones y registrar RECHAZO]
        PT4 -- Aprobar --> PT6[Ingresar comentarios y registrar APROBACIÓN]
        PT6 --> PT7[Asistir a observar la clase en colegio]
        PT7 --> PT8[Abrir pauta digital en SGP y marcar rúbrica]
        PT8 --> PT9[Grabar nota de voz cualitativa durante/post clase]
        PT9 --> PT10[Revisar transcripción automática y firmar digitalmente]
        PT10 --> PT11([Evaluación finalizada y respaldada])
    end

    ET3 --> S1
    ET4 --> S2
    S2 --> ET5
    ET7 --> S4
    S4 --> PT1
    PT5 --> S5
    PT6 --> S5
    S5 --> ET8
    PT9 --> S6
    S6 --> S7
    S7 --> PT10
    PT10 --> S8
    S8 --> S9
```

---

## 3. Matriz Comparativa de Procesos (As-Is vs. To-Do)

| Aspecto Evaluado | Proceso Actual (As-Is) | Proceso Propuesto con SGP (To-Do) | Beneficio Concreto |
|---|---|---|---|
| **Estructuración de Planificación** | Documento Word libre, sin validación institucional obligatoria. | Formulario web estandarizado con las 6 dimensiones de la pauta real. | 100% de coherencia con el marco curricular MINEDUC y DUA. |
| **Acompañamiento Formativo** | Nulo antes de la clase; el estudiante entrega sin filtro. | Chatbot Pedagógico con IA que verifica 5 mínimos y genera reflexión. | Retroalimentación instantánea que eleva la calidad didáctica. |
| **Supervisión Previa** | Informal o inexistente por falta de tiempo docente. | Flujo de aprobación/rechazo formal en plataforma antes de la clase. | Asegura que ninguna clase se dicte sin validación pedagógica. |
| **Captura de Observaciones** | Pautas impresas en papel; anotaciones breves por toque de timbre. | Rúbrica digital + notas de voz con transcripción automática Whisper. | Ahorro del 80% del tiempo de redacción sin perder detalle cualitativo. |
| **Gestión de Notas y Actas** | Transcripción manual de decenas de hojas de papel a Excel. | Consolidación y cálculo automatizado de notas en MySQL. | Eliminación de errores de digitación, extravíos y sobrecarga administrativa. |