package cl.pedagogia.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Evaluación de un estudiante en práctica realizada por un observador
 * (Profesor Colaborador del colegio o Tutor de Práctica de la universidad).
 *
 * El observador llena la pauta durante/después de la clase.
 * La nota de voz permite capturar observaciones cualitativas en tiempo real
 * sin necesidad de escribir mientras se observa — soluciona el problema
 * que mencionó el cliente: "los profes van a observar la clase y tienen que
 * irse súper rápido porque la clase termina cuando toca el timbre".
 */
@Entity
@Table(name = "evaluaciones_practica")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EvaluacionPractica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_estudiante", nullable = false)
    private Estudiante estudiante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_evaluador", nullable = false)
    private Usuario evaluador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_asignatura")
    private Asignatura asignatura;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_evaluador", nullable = false)
    private TipoEvaluador tipoEvaluador;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoObservacion tipoObservacion;

    @Column(name = "fecha_observacion", nullable = false)
    private LocalDate fechaObservacion;

    // Puntaje total calculado de los criterios
    @Column(name = "puntaje_total")
    private Double puntajeTotal;

    @Column(name = "nota_final")
    private Double notaFinal;

    // Observaciones cualitativas — texto (puede venir de nota de voz transcrita)
    @Column(columnDefinition = "TEXT")
    private String observacionesCualitativas;

    // Indica si las observaciones vinieron de una nota de voz
    @Column(name = "observaciones_desde_voz")
    private boolean observacionesDesdeVoz = false;

    // URL o path del archivo de audio original (guardado en el servidor)
    @Column(name = "audio_url")
    private String audioUrl;

    // Sesión del chatbot asociada (si el estudiante usó el chatbot para esta planificación)
    @Column(name = "sesion_chatbot_id")
    private String sesionChatbotId;

    @Enumerated(EnumType.STRING)
    private EstadoEvaluacion estado;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (estado == null) estado = EstadoEvaluacion.BORRADOR;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum TipoEvaluador {
        PROFESOR_COLABORADOR, // Profesor del colegio
        TUTOR_PRACTICA        // Profesor contratado por la universidad
    }

    public enum TipoObservacion {
        MATEMATICA,    // Clase de matemática
        ORIENTACION    // Clase de orientación
    }

    public enum EstadoEvaluacion {
        BORRADOR,       // En proceso de completar
        COMPLETADA,     // Evaluación finalizada
        ENVIADA         // Enviada al coordinador
    }
}
