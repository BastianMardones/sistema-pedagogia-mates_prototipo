package cl.pedagogia.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class PlanificacionDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        @NotBlank(message = "El titulo es obligatorio")
        private String titulo;

        // Equipo y caracterizacion
        private String equipoCoEnsenanza;
        private Integer numEstNEET;
        private String diagnosticosNEET;
        private Integer numEstNEEP;
        private String diagnosticosNEEP;
        private Integer estiloVisual;
        private Integer estiloKinestetivo;
        private Integer estiloAuditivo;
        private String otrosDatos;

        // Datos generales
        private Integer anioClase;
        private String periodoClase;
        private String asignaturaClase;
        private String cursoClase;
        private String unidadTematica;

        // Objetivos
        private String objetivoOA;
        private String indicadoresEvaluacion;
        private String objetivoTransversal;
        private String objetivoClase;

        // 3 Momentos + DUA
        private String momentoInicio;
        private String momentoDesarrollo;
        private String momentoCierre;
        private String principiosDUA;
        private String evaluacionClase;

        // PDF
        private String pdfUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private String titulo;

        private String equipoCoEnsenanza;
        private Integer numEstNEET;
        private String diagnosticosNEET;
        private Integer numEstNEEP;
        private String diagnosticosNEEP;
        private Integer estiloVisual;
        private Integer estiloKinestetivo;
        private Integer estiloAuditivo;
        private String otrosDatos;

        private Integer anioClase;
        private String periodoClase;
        private String asignaturaClase;
        private String cursoClase;
        private String unidadTematica;

        private String objetivoOA;
        private String indicadoresEvaluacion;
        private String objetivoTransversal;
        private String objetivoClase;

        private String momentoInicio;
        private String momentoDesarrollo;
        private String momentoCierre;
        private String principiosDUA;
        private String evaluacionClase;

        private String pdfUrl;
        private String estado;
        private String comentarioProfesor;
        private String retroalimentacionIA;
        private String historialChatbot;

        private Long estudianteAutorId;
        private String estudianteAutorNombre;
        private Long profesorRevisorId;

        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    public static class RevisionRequest {
        private String comentario;
    }

    @Data
    public static class ChatbotUpdateRequest {
        private String retroalimentacionIA;
        private String historialChatbot;
    }
}
