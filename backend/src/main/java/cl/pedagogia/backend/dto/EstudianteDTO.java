package cl.pedagogia.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDate;

public class EstudianteDTO {

    @Data
    public static class Request {
        @NotBlank(message = "El RUT es requerido")
        @Pattern(regexp = "\\d{7,8}-[\\dkK]", message = "Formato de RUT inválido (ej: 12345678-9)")
        private String rut;

        @NotBlank(message = "El nombre es requerido")
        private String nombre;

        @NotBlank(message = "El apellido es requerido")
        private String apellido;

        @Email(message = "Formato de email inválido")
        private String email;

        private LocalDate fechaIngreso;
    }

    @Data
    public static class Response {
        private Long id;
        private String rut;
        private String nombre;
        private String apellido;
        private String email;
        private LocalDate fechaIngreso;
        private boolean activo;
    }
}
