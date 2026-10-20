package cl.pedagogia.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

/**
 * =============================================================================
 * CONTROLADOR REST: EvaluacionController (/api/evaluaciones)
 * PROYECTO: Sistema de Gestión de Prácticas Pedagógicas (SGP Matemáticas - UBB)
 * =============================================================================
 * PROPÓSITO:
 * Gestiona el registro y consulta de pautas de observación de clases en terreno
 * realizadas por el Profesor Tutor / Colaborador, incluyendo el puntaje de la
 * rúbrica digital (7 criterios, máximo 35 puntos) y las observaciones cualitativas
 * obtenidas mediante transcripción de notas de voz.
 * =============================================================================
 */
@RestController
@RequestMapping("/api/evaluaciones")
public class EvaluacionController {

    private final List<Map<String, Object>> evaluaciones = new CopyOnWriteArrayList<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    public EvaluacionController() {
        // Semilla inicial de evaluaciones de demostración para el portafolio docente
        Map<String, Object> ev1 = new LinkedHashMap<>();
        ev1.put("id", idGenerator.getAndIncrement());
        ev1.put("titulo", "Observación en Aula #1 — Ecuaciones Lineales 8° Básico B");
        ev1.put("fecha", LocalDate.now().minusDays(5).toString());
        ev1.put("estudianteNombre", "Matías Silva Morales");
        ev1.put("puntajeTotal", 31);
        ev1.put("maxPuntaje", 35);
        ev1.put("observacionesDesdeVoz", true);
        ev1.put("observaciones", "Nota de voz transcrita: El practicante inicia puntualmente los 15 minutos de activación con la balanza algebraica. Se evidencia aplicación efectiva del Principio DUA 1.2 y apoyo directo a los 2 estudiantes con DEA en el desarrollo.");
        ev1.put("estado", "COMPLETADA");
        ev1.put("createdAt", LocalDateTime.now().minusDays(5).toString());

        Map<String, Object> ev2 = new LinkedHashMap<>();
        ev2.put("id", idGenerator.getAndIncrement());
        ev2.put("titulo", "Observación en Aula #2 — Función Lineal y Afín 1° Medio A");
        ev2.put("fecha", LocalDate.now().minusDays(2).toString());
        ev2.put("estudianteNombre", "Camila Torres Pérez");
        ev2.put("puntajeTotal", 33);
        ev2.put("maxPuntaje", 35);
        ev2.put("observacionesDesdeVoz", true);
        ev2.put("observaciones", "Nota de voz transcrita: Excelente manejo del clima de aula y transición entre los 3 momentos de la clase. El ticket de salida permitió comprobar el logro del OA en el cierre.");
        ev2.put("estado", "COMPLETADA");
        ev2.put("createdAt", LocalDateTime.now().minusDays(2).toString());

        evaluaciones.add(ev1);
        evaluaciones.add(ev2);
    }

    /**
     * Lista todas las evaluaciones de observación de clases registradas.
     * Solo accesible por usuarios autenticados con rol PROFESOR.
     */
    @GetMapping
    @PreAuthorize("hasRole('PROFESOR')")
    public ResponseEntity<List<Map<String, Object>>> getAll() {
        return ResponseEntity.ok(evaluaciones);
    }

    /**
     * Obtiene el detalle de una evaluación específica por su ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('PROFESOR')")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Long id) {
        return evaluaciones.stream()
                .filter(e -> Objects.equals(e.get("id"), id))
                .findFirst()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Registra una nueva evaluación de observación en aula junto con los puntajes
     * de la rúbrica y la transcripción de la nota de voz del docente.
     */
    @PostMapping
    @PreAuthorize("hasRole('PROFESOR')")
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> payload) {
        Map<String, Object> nueva = new LinkedHashMap<>(payload);
        nueva.put("id", idGenerator.getAndIncrement());
        nueva.putIfAbsent("fecha", LocalDate.now().toString());
        nueva.putIfAbsent("maxPuntaje", 35);
        nueva.putIfAbsent("estado", "COMPLETADA");
        nueva.put("createdAt", LocalDateTime.now().toString());
        evaluaciones.add(0, nueva); // Insertar al inicio para mostrar la más reciente primero
        return ResponseEntity.status(HttpStatus.CREATED).body(nueva);
    }

    /**
     * Actualiza una evaluación de observación existente.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PROFESOR')")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        for (int i = 0; i < evaluaciones.size(); i++) {
            if (Objects.equals(evaluaciones.get(i).get("id"), id)) {
                Map<String, Object> actualizada = new LinkedHashMap<>(evaluaciones.get(i));
                actualizada.putAll(payload);
                actualizada.put("id", id);
                evaluaciones.set(i, actualizada);
                return ResponseEntity.ok(actualizada);
            }
        }
        return ResponseEntity.notFound().build();
    }
}
