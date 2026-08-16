package cl.pedagogia.backend.config;

import cl.pedagogia.backend.model.Asignatura;
import cl.pedagogia.backend.model.Estudiante;
import cl.pedagogia.backend.model.Usuario;
import cl.pedagogia.backend.repository.AsignaturaRepository;
import cl.pedagogia.backend.repository.EstudianteRepository;
import cl.pedagogia.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final EstudianteRepository estudianteRepository;
    private final AsignaturaRepository asignaturaRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Inicializando datos por defecto en la base de datos...");

        // 1. Usuarios del sistema
        Usuario admin = usuarioRepository.findByEmail("admin@pedagogia.cl")
                .orElseGet(() -> {
                    log.info("Creando usuario administrador: admin@pedagogia.cl");
                    return usuarioRepository.save(Usuario.builder()
                            .nombre("Admin")
                            .apellido("Sistema")
                            .email("admin@pedagogia.cl")
                            .password(passwordEncoder.encode("password"))
                            .rol(Usuario.Rol.ADMIN)
                            .activo(true)
                            .build());
                });

        // Asegurar que la contraseña de admin sea 'password'
        admin.setPassword(passwordEncoder.encode("password"));
        usuarioRepository.save(admin);

        Usuario profesor = usuarioRepository.findByEmail("profesor@pedagogia.cl")
                .orElseGet(() -> {
                    log.info("Creando usuario profesor: profesor@pedagogia.cl");
                    return usuarioRepository.save(Usuario.builder()
                            .nombre("Carlos")
                            .apellido("Mendoza")
                            .email("profesor@pedagogia.cl")
                            .password(passwordEncoder.encode("password"))
                            .rol(Usuario.Rol.PROFESOR)
                            .activo(true)
                            .build());
                });

        Usuario coordinador = usuarioRepository.findByEmail("coordinador@pedagogia.cl")
                .orElseGet(() -> {
                    log.info("Creando usuario coordinador: coordinador@pedagogia.cl");
                    return usuarioRepository.save(Usuario.builder()
                            .nombre("Rodrigo")
                            .apellido("Bustos")
                            .email("coordinador@pedagogia.cl")
                            .password(passwordEncoder.encode("password"))
                            .rol(Usuario.Rol.DIRECTIVO)
                            .activo(true)
                            .build());
                });

        // 2. Asignaturas de la línea de práctica (6 asignaturas)
        if (asignaturaRepository.count() == 0) {
            log.info("Creando las 6 asignaturas de la línea de práctica...");
            asignaturaRepository.saveAll(List.of(
                    Asignatura.builder().codigo("PRA-101").nombre("Aproximación al Sistema Escolar").semestre(1).anio(2026).profesor(profesor).activo(true).build(),
                    Asignatura.builder().codigo("PRA-201").nombre("Ambientes de Aprendizaje").semestre(2).anio(2026).profesor(profesor).activo(true).build(),
                    Asignatura.builder().codigo("PRA-301").nombre("Trabajo Colaborativo en el Aula").semestre(1).anio(2026).profesor(profesor).activo(true).build(),
                    Asignatura.builder().codigo("PRA-401").nombre("Investigación en el Aula").semestre(2).anio(2026).profesor(profesor).activo(true).build(),
                    Asignatura.builder().codigo("PRA-501").nombre("Práctica Pedagógica").semestre(1).anio(2026).profesor(profesor).activo(true).build(),
                    Asignatura.builder().codigo("PRA-601").nombre("Práctica Profesional").semestre(2).anio(2026).profesor(coordinador).activo(true).build()
            ));
        }

        // 3. Estudiantes de prueba
        if (estudianteRepository.count() == 0) {
            log.info("Creando estudiantes de prueba...");
            estudianteRepository.saveAll(List.of(
                    Estudiante.builder().rut("20.123.456-7").nombre("Matías").apellido("Silva Morales").email("matias.silva@alumnos.cl").activo(true).build(),
                    Estudiante.builder().rut("20.234.567-8").nombre("Camila").apellido("Torres Pérez").email("camila.torres@alumnos.cl").activo(true).build(),
                    Estudiante.builder().rut("20.345.678-9").nombre("Ignacio").apellido("Valenzuela Castro").email("ignacio.valenzuela@alumnos.cl").activo(true).build(),
                    Estudiante.builder().rut("20.456.789-0").nombre("Valentina").apellido("Rojas González").email("valentina.rojas@alumnos.cl").activo(true).build()
            ));
        }

        log.info("✅ Datos iniciales cargados exitosamente. Usuario listo: admin@pedagogia.cl / password");
    }
}
