package cl.pedagogia.backend.controller;

import cl.pedagogia.backend.dto.PlanificacionDTO;
import cl.pedagogia.backend.service.PlanificacionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/planificaciones")
@RequiredArgsConstructor
public class PlanificacionController {

    private final PlanificacionService planificacionService;

    @GetMapping
    public ResponseEntity<List<PlanificacionDTO.Response>> getAll(
            Authentication auth,
            @RequestParam(required = false) Long estudianteId) {
        return ResponseEntity.ok(planificacionService.findAll(auth.getName(), estudianteId));
    }

    @GetMapping("/pendientes")
    @PreAuthorize("hasRole('PROFESOR')")
    public ResponseEntity<List<PlanificacionDTO.Response>> getPendientes() {
        return ResponseEntity.ok(planificacionService.findPendientes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlanificacionDTO.Response> getById(@PathVariable Long id) {
        return ResponseEntity.ok(planificacionService.findById(id));
    }

    @PostMapping
    public ResponseEntity<PlanificacionDTO.Response> create(
            @Valid @RequestBody PlanificacionDTO.Request request,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(planificacionService.create(request, auth.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlanificacionDTO.Response> update(
            @PathVariable Long id,
            @Valid @RequestBody PlanificacionDTO.Request request,
            Authentication auth) {
        return ResponseEntity.ok(planificacionService.update(id, request, auth.getName()));
    }

    @PatchMapping("/{id}/enviar")
    public ResponseEntity<PlanificacionDTO.Response> submitForReview(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(planificacionService.submitForReview(id, auth.getName()));
    }

    @PatchMapping("/{id}/aprobar")
    @PreAuthorize("hasRole('PROFESOR')")
    public ResponseEntity<PlanificacionDTO.Response> aprobar(
            @PathVariable Long id,
            @RequestBody(required = false) PlanificacionDTO.RevisionRequest req,
            Authentication auth) {
        String comentario = req != null ? req.getComentario() : null;
        return ResponseEntity.ok(planificacionService.aprobar(id, comentario, auth.getName()));
    }

    @PatchMapping("/{id}/rechazar")
    @PreAuthorize("hasRole('PROFESOR')")
    public ResponseEntity<PlanificacionDTO.Response> rechazar(
            @PathVariable Long id,
            @RequestBody PlanificacionDTO.RevisionRequest req,
            Authentication auth) {
        String comentario = req != null ? req.getComentario() : "";
        return ResponseEntity.ok(planificacionService.rechazar(id, comentario, auth.getName()));
    }

    @PatchMapping("/{id}/chatbot")
    public ResponseEntity<PlanificacionDTO.Response> guardarChatbot(
            @PathVariable Long id,
            @RequestBody PlanificacionDTO.ChatbotUpdateRequest req) {
        return ResponseEntity.ok(planificacionService.guardarChatbot(
                id, req.getRetroalimentacionIA(), req.getHistorialChatbot()));
    }

    @PostMapping("/{id}/pdf")
    public ResponseEntity<PlanificacionDTO.Response> uploadPdf(
            @PathVariable Long id,
            @RequestParam("archivo") MultipartFile file) throws IOException {
        String uploadDir = "uploads/planificaciones";
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        String pdfUrl = "/uploads/planificaciones/" + fileName;
        return ResponseEntity.ok(planificacionService.setPdfUrl(id, pdfUrl));
    }
}
