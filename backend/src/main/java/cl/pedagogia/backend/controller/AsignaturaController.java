package cl.pedagogia.backend.controller;

import cl.pedagogia.backend.dto.AsignaturaDTO;
import cl.pedagogia.backend.service.AsignaturaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/asignaturas")
@RequiredArgsConstructor
public class AsignaturaController {

    private final AsignaturaService asignaturaService;

    @GetMapping
    public ResponseEntity<List<AsignaturaDTO.Response>> getAll(
            @RequestParam(required = false) Integer anio,
            @RequestParam(required = false) Integer semestre) {
        if (anio != null && semestre != null) {
            return ResponseEntity.ok(asignaturaService.findByAnioSemestre(anio, semestre));
        }
        return ResponseEntity.ok(asignaturaService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AsignaturaDTO.Response> getById(@PathVariable Long id) {
        return ResponseEntity.ok(asignaturaService.findById(id));
    }

    @GetMapping("/profesor/{idProfesor}")
    public ResponseEntity<List<AsignaturaDTO.Response>> getByProfesor(@PathVariable Long idProfesor) {
        return ResponseEntity.ok(asignaturaService.findByProfesor(idProfesor));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTIVO')")
    public ResponseEntity<AsignaturaDTO.Response> create(@Valid @RequestBody AsignaturaDTO.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(asignaturaService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTIVO')")
    public ResponseEntity<AsignaturaDTO.Response> update(
            @PathVariable Long id, @Valid @RequestBody AsignaturaDTO.Request request) {
        return ResponseEntity.ok(asignaturaService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        asignaturaService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
