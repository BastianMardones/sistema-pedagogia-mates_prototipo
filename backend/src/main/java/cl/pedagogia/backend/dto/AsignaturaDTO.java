package cl.pedagogia.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

public class AsignaturaDTO {

    @Data
    public static class Request {
        @NotBlank(message = "El código es requerido")
        private String codigo;

        @NotBlank(message = "El nombre es requerido")
        private String nombre;

        @NotNull(message = "El semestre es requerido")
        private Integer semestre;

        @NotNull(message = "El año es requerido")
        private Integer anio;

        // ID del profesor asignado (opcional)
        private Long idProfesor;
    }

    @Data
    public static class Response {
        private Long id;
        private String codigo;
        private String nombre;
        private Integer semestre;
        private Integer anio;
        private ProfesorResumen profesor;
        private boolean activo;
        private LocalDateTime createdAt;
    }

    @Data
    public static class ProfesorResumen {
        private Long id;
        private String nombre;
        private String apellido;
        private String email;
    }
}
