package cl.pedagogia.backend.config;

import cl.pedagogia.backend.model.Asignatura;
import cl.pedagogia.backend.model.Usuario;
import cl.pedagogia.backend.repository.AsignaturaRepository;
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
    private final AsignaturaRepository asignaturaRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Inicializando datos por defecto en la base de datos...");

        // 1. Profesor Tutor
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
        // Garantizar password actualizada
        profesor.setPassword(passwordEncoder.encode("password"));
        usuarioRepository.save(profesor);

        // 2. Estudiantes en practica
        Usuario est1 = usuarioRepository.findByEmail("estudiante@pedagogia.cl")
                .orElseGet(() -> {
                    log.info("Creando estudiante principal: estudiante@pedagogia.cl");
                    return usuarioRepository.save(Usuario.builder()
                            .nombre("Matias")
                            .apellido("Silva Morales")
                            .email("estudiante@pedagogia.cl")
                            .password(passwordEncoder.encode("password"))
                            .rol(Usuario.Rol.ESTUDIANTE)
                            .activo(true)
                            .build());
                });
        est1.setPassword(passwordEncoder.encode("password"));
        usuarioRepository.save(est1);

        usuarioRepository.findByEmail("camila@pedagogia.cl")
                .orElseGet(() -> usuarioRepository.save(Usuario.builder()
                        .nombre("Camila")
                        .apellido("Torres Perez")
                        .email("camila@pedagogia.cl")
                        .password(passwordEncoder.encode("password"))
                        .rol(Usuario.Rol.ESTUDIANTE)
                        .activo(true)
                        .build()));

        usuarioRepository.findByEmail("ignacio@pedagogia.cl")
                .orElseGet(() -> usuarioRepository.save(Usuario.builder()
                        .nombre("Ignacio")
                        .apellido("Valenzuela Castro")
                        .email("ignacio@pedagogia.cl")
                        .password(passwordEncoder.encode("password"))
                        .rol(Usuario.Rol.ESTUDIANTE)
                        .activo(true)
                        .build()));

        // 3. Asignaturas de la linea de practica (6 asignaturas - 3 ciclos)
        if (asignaturaRepository.count() == 0) {
            log.info("Creando las 6 asignaturas de la linea de practica...");
            asignaturaRepository.saveAll(List.of(
                // Ciclo Inicial
                Asignatura.builder().codigo("PRA-101").nombre("Aproximacion al Sistema Escolar").semestre(1).anio(2026).profesor(profesor).activo(true).build(),
                Asignatura.builder().codigo("PRA-201").nombre("Ambientes de Aprendizaje").semestre(2).anio(2026).profesor(profesor).activo(true).build(),
                // Ciclo Intermedio
                Asignatura.builder().codigo("PRA-301").nombre("Trabajo Colaborativo en el Aula").semestre(1).anio(2026).profesor(profesor).activo(true).build(),
                Asignatura.builder().codigo("PRA-401").nombre("Investigacion en el Aula").semestre(2).anio(2026).profesor(profesor).activo(true).build(),
                // Ciclo Final
                Asignatura.builder().codigo("PRA-501").nombre("Practica Pedagogica").semestre(1).anio(2026).profesor(profesor).activo(true).build(),
                Asignatura.builder().codigo("PRA-601").nombre("Practica Profesional").semestre(2).anio(2026).profesor(profesor).activo(true).build()
            ));
        }

        log.info("Datos cargados. Profesor: profesor@pedagogia.cl / Estudiante: estudiante@pedagogia.cl / password: password");
    }
}