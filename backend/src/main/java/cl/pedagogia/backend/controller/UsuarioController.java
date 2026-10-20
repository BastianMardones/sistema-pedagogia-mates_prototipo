package cl.pedagogia.backend.controller;

import cl.pedagogia.backend.dto.UsuarioDTO;
import cl.pedagogia.backend.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    @PreAuthorize("hasRole('PROFESOR')")
    public ResponseEntity<List<UsuarioDTO.Response>> getAll(
            @RequestParam(required = false) String rol) {
        if (rol != null) {
            return ResponseEntity.ok(usuarioService.findByRol(rol));
        }
        return ResponseEntity.ok(usuarioService.findAll());
    }

    @GetMapping("/estudiantes")
    @PreAuthorize("hasRole('PROFESOR')")
    public ResponseEntity<List<UsuarioDTO.Response>> getEstudiantes() {
        return ResponseEntity.ok(usuarioService.findByRol("ESTUDIANTE"));
    }

    @GetMapping("/estudiantes/{id}")
    @PreAuthorize("hasRole('PROFESOR')")
    public ResponseEntity<UsuarioDTO.Response> getEstudianteById(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.findById(id));
    }

    @GetMapping("/perfil")
    public ResponseEntity<UsuarioDTO.PerfilPropio> getPerfil(Authentication auth) {
        return ResponseEntity.ok(usuarioService.getPerfil(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioDTO.Response> getById(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('PROFESOR')")
    public ResponseEntity<UsuarioDTO.Response> create(@Valid @RequestBody UsuarioDTO.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PROFESOR')")
    public ResponseEntity<UsuarioDTO.Response> update(
            @PathVariable Long id, @Valid @RequestBody UsuarioDTO.Request request) {
        return ResponseEntity.ok(usuarioService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PROFESOR')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        usuarioService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
