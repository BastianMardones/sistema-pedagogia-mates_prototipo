package cl.pedagogia.backend.controller;

import cl.pedagogia.backend.dto.EstudianteDTO;
import cl.pedagogia.backend.service.EstudianteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/estudiantes")
@RequiredArgsConstructor
public class EstudianteController {

    private final EstudianteService estudianteService;

    @GetMapping
    public ResponseEntity<List<EstudianteDTO.Response>> getAll() {
        return ResponseEntity.ok(estudianteService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EstudianteDTO.Response> getById(@PathVariable Long id) {
        return ResponseEntity.ok(estudianteService.findById(id));
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<EstudianteDTO.Response>> buscar(@RequestParam String q) {
        return ResponseEntity.ok(estudianteService.buscar(q));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTIVO')")
    public ResponseEntity<EstudianteDTO.Response> create(
            @Valid @RequestBody EstudianteDTO.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(estudianteService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTIVO')")
    public ResponseEntity<EstudianteDTO.Response> update(
            @PathVariable Long id,
            @Valid @RequestBody EstudianteDTO.Request request) {
        return ResponseEntity.ok(estudianteService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        estudianteService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
