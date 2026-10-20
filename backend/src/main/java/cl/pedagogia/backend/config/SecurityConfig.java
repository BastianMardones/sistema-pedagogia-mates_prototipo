package cl.pedagogia.backend.config;

import cl.pedagogia.backend.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * =============================================================================
 * CONFIGURACIÓN DE SEGURIDAD: SecurityConfig (Spring Security 6 + JWT)
 * PROYECTO: Sistema de Gestión de Prácticas Pedagógicas (SGP Matemáticas - UBB)
 * =============================================================================
 * PROPÓSITO:
 * Define la arquitectura de seguridad sin estado (STATELESS) basada en JSON Web
 * Tokens (JWT) y control de acceso basado en roles (RBAC) para los 2 perfiles:
 *   - ESTUDIANTE: Acceso a su propio portafolio de planificaciones y chatbot.
 *   - PROFESOR: Acceso a supervisión de estudiantes, visto bueno de planificaciones
 *     y registro de evaluaciones de observación en aula con nota de voz.
 * =============================================================================
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Value("${cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    /**
     * Cadena de filtros HTTP:
     * 1. Deshabilita CSRF (no requerido en APIs REST stateless con JWT).
     * 2. Aplica política CORS para permitir peticiones desde Next.js (puerto 3000).
     * 3. Restringe endpoints sensibles (/api/estudiantes, /api/evaluaciones) exclusivamente al rol PROFESOR.
     * 4. Registra el filtro `JwtAuthenticationFilter` antes del filtro de usuario/contraseña.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/api/planificaciones", "/api/planificaciones/**").authenticated()
                .requestMatchers("/api/usuarios", "/api/usuarios/**").authenticated()
                .requestMatchers("/api/asignaturas", "/api/asignaturas/**").authenticated()
                .requestMatchers("/api/estudiantes", "/api/estudiantes/**").hasRole("PROFESOR")
                .requestMatchers("/api/evaluaciones", "/api/evaluaciones/**").hasRole("PROFESOR")
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Configuración de CORS (Cross-Origin Resource Sharing) para autorizar
     * cabeceras `Authorization: Bearer <token>` desde el cliente web Next.js.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
