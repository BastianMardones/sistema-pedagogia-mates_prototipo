package cl.pedagogia.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class PlanificacionDTO {

    @Data
    public static class Request {
        @NotNull
        private Long idAsignatura;

        @NotBlank
        private String titulo;

        @NotNull
        private LocalDate fechaClase;

        @NotBlank(message = "El objetivo de la clase es requerido")
        private String objetivo;

        // Recursos didácticos
        private String recursos;

        // Instrumento de evaluación
        private String instrumentoEvaluacion;

        // Los 3 momentos de la clase (textos descriptivos)
        @NotBlank(message = "La descripción del inicio es requerida")
        private String inicio;

        @NotBlank(message = "La descripción del desarrollo es requerida")
        private String desarrollo;

        @NotBlank(message = "La descripción del cierre es requerida")
        private String cierre;

        // DUA - Diseño Universal para el Aprendizaje
        private String duaInicio;
        private String duaDesarrollo;
        private String duaCierre;

        // PIE - Proyecto de Integración Escolar
        private String adaptacionesPie;

        // Dificultades anticipadas y cómo abordarlas
        private String dificultadesAnticipadas;

        private String observaciones;
    }

    @Data
    public static class Response {
        private Long id;
        private String titulo;
        private LocalDate fechaClase;
        private String objetivo;
        private String recursos;
        private String instrumentoEvaluacion;
        private String inicio;
        private String desarrollo;
        private String cierre;
        private String duaInicio;
        private String duaDesarrollo;
        private String duaCierre;
        private String adaptacionesPie;
        private String dificultadesAnticipadas;
        private String estado;
        private String observaciones;
        private AsignaturaResumen asignatura;
        private ProfesorResumen profesor;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        // Indicador si pasó por el chatbot
        private Boolean retroalimentadaPorChatbot;
        private String sesionChatbotId;
    }

    @Data
    public static class AsignaturaResumen {
        private Long id;
        private String codigo;
        private String nombre;
    }

    @Data
    public static class ProfesorResumen {
        private Long id;
        private String nombre;
        private String apellido;
    }
}
