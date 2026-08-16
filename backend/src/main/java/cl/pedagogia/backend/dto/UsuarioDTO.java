package cl.pedagogia.backend.dto;

import cl.pedagogia.backend.model.Usuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

public class UsuarioDTO {

    @Data
    public static class Request {
        @NotBlank
        private String nombre;

        @NotBlank
        private String apellido;

        @NotBlank @Email
        private String email;

        private String password; // Opcional en UPDATE

        @NotBlank
        private String rol; // ADMIN, PROFESOR, DIRECTIVO
    }

    @Data
    public static class Response {
        private Long id;
        private String nombre;
        private String apellido;
        private String email;
        private String rol;
        private boolean activo;
        private LocalDateTime createdAt;
    }

    @Data
    public static class PerfilPropio {
        private Long id;
        private String nombre;
        private String apellido;
        private String email;
        private String rol;
    }
}
