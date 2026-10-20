package cl.pedagogia.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "planificaciones")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Planificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 300)
    private String titulo;

    // ─── Equipo de Co-Ensenanza ───────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String equipoCoEnsenanza;

    // ─── Caracterizacion del Curso ────────────────────────────────
    private Integer numEstNEET;

    @Column(columnDefinition = "TEXT")
    private String diagnosticosNEET;   // ej: "DEA, Dislexia"

    private Integer numEstNEEP;

    @Column(columnDefinition = "TEXT")
    private String diagnosticosNEEP;   // ej: "TEA, DIL"

    private Integer estiloVisual;       // porcentaje
    private Integer estiloKinestetivo;  // porcentaje
    private Integer estiloAuditivo;     // porcentaje

    @Column(columnDefinition = "TEXT")
    private String otrosDatos;

    // ─── Datos Generales de la Clase ─────────────────────────────
    private Integer anioClase;

    @Column(length = 50)
    private String periodoClase;        // "I Semestre", "II Semestre"

    @Column(length = 150)
    private String asignaturaClase;     // "Matematica"

    @Column(length = 100)
    private String cursoClase;          // "7mo Basico A"

    @Column(columnDefinition = "TEXT")
    private String unidadTematica;

    // ─── Objetivos ────────────────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String objetivoOA;          // OA del MINEDUC con numero: "OA16 - Representar datos..."

    @Column(columnDefinition = "TEXT")
    private String indicadoresEvaluacion;

    @Column(columnDefinition = "TEXT")
    private String objetivoTransversal;

    @Column(columnDefinition = "TEXT")
    private String objetivoClase;

    // ─── Los 3 Momentos ──────────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String momentoInicio;       // Inicio (~15 min)

    @Column(columnDefinition = "TEXT")
    private String momentoDesarrollo;   // Desarrollo (~60 min)

    @Column(columnDefinition = "TEXT")
    private String momentoCierre;       // Cierre

    @Column(columnDefinition = "TEXT")
    private String principiosDUA;       // JSON con principios por momento

    @Column(columnDefinition = "TEXT")
    private String evaluacionClase;     // descripcion del instrumento evaluativo

    // ─── Archivo PDF ──────────────────────────────────────────────
    @Column(length = 500)
    private String pdfUrl;

    // ─── Estado y Revision ────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Estado estado = Estado.BORRADOR;

    @Column(columnDefinition = "TEXT")
    private String comentarioProfesor;

    @Column(columnDefinition = "TEXT")
    private String retroalimentacionIA;  // JSON del resultado del chatbot

    @Column(columnDefinition = "TEXT")
    private String historialChatbot;     // JSON de la conversacion del chatbot

    // ─── Relaciones ───────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_estudiante_autor")
    private Usuario estudianteAutor;    // el ESTUDIANTE que sube la planificacion

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_profesor_revisor")
    private Usuario profesorRevisor;    // el PROFESOR que la aprueba/rechaza (nullable)

    // Relacion legada (mantener para compatibilidad con asignatura)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_asignatura")
    private Asignatura asignatura;

    // ─── Timestamps ───────────────────────────────────────────────
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum Estado {
        BORRADOR, EN_REVISION, APROBADA, RECHAZADA
    }

    // Helper para nombre del autor
    public String getNombreEstudiante() {
        if (estudianteAutor == null) return null;
        return estudianteAutor.getNombreCompleto();
    }
}