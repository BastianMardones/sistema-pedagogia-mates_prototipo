package cl.pedagogia.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthDTO {

    @Data
    public static class LoginRequest {
        @NotBlank(message = "El email es requerido")
        @Email(message = "Formato de email inválido")
        private String email;

        @NotBlank(message = "La contraseña es requerida")
        private String password;
    }

    @Data
    public static class LoginResponse {
        private String token;
        private String tipo = "Bearer";
        private Long id;
        private String nombre;
        private String apellido;
        private String email;
        private String rol;

        public LoginResponse(String token, Long id, String nombre,
                             String apellido, String email, String rol) {
            this.token = token;
            this.id = id;
            this.nombre = nombre;
            this.apellido = apellido;
            this.email = email;
            this.rol = rol;
        }
    }

    @Data
    public static class RegisterRequest {
        @NotBlank
        private String nombre;

        @NotBlank
        private String apellido;

        @NotBlank @Email
        private String email;

        @NotBlank @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
        private String password;

        @NotBlank
        private String rol; // ADMIN, PROFESOR, DIRECTIVO
    }
}
