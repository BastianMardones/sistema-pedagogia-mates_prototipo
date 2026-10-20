package cl.pedagogia.backend.service;

import cl.pedagogia.backend.dto.PlanificacionDTO;
import cl.pedagogia.backend.model.Planificacion;
import cl.pedagogia.backend.model.Usuario;
import cl.pedagogia.backend.repository.PlanificacionRepository;
import cl.pedagogia.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PlanificacionService {

    private final PlanificacionRepository planificacionRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<PlanificacionDTO.Response> findAll(String userEmail, Long estudianteId) {
        Usuario user = getUsuarioByEmail(userEmail);
        List<Planificacion> list;
        if (user.getRol() == Usuario.Rol.ESTUDIANTE) {
            list = planificacionRepository.findByEstudianteAutorOrderByCreatedAtDesc(user);
        } else {
            if (estudianteId != null) {
                Usuario est = usuarioRepository.findById(estudianteId).orElse(null);
                list = est != null ? planificacionRepository.findByEstudianteAutorOrderByCreatedAtDesc(est) : List.of();
            } else {
                list = planificacionRepository.findAllByOrderByCreatedAtDesc();
            }
        }
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PlanificacionDTO.Response findById(Long id) {
        Planificacion plan = findOrThrow(id);
        return toResponse(plan);
    }

    @Transactional(readOnly = true)
    public List<PlanificacionDTO.Response> findPendientes() {
        return planificacionRepository.findByEstadoOrderByCreatedAtDesc(Planificacion.Estado.EN_REVISION)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public PlanificacionDTO.Response create(PlanificacionDTO.Request req, String userEmail) {
        Usuario autor = getUsuarioByEmail(userEmail);
        Planificacion plan = Planificacion.builder()
                .titulo(req.getTitulo())
                .equipoCoEnsenanza(req.getEquipoCoEnsenanza())
                .numEstNEET(req.getNumEstNEET())
                .diagnosticosNEET(req.getDiagnosticosNEET())
                .numEstNEEP(req.getNumEstNEEP())
                .diagnosticosNEEP(req.getDiagnosticosNEEP())
                .estiloVisual(req.getEstiloVisual())
                .estiloKinestetivo(req.getEstiloKinestetivo())
                .estiloAuditivo(req.getEstiloAuditivo())
                .otrosDatos(req.getOtrosDatos())
                .anioClase(req.getAnioClase())
                .periodoClase(req.getPeriodoClase())
                .asignaturaClase(req.getAsignaturaClase())
                .cursoClase(req.getCursoClase())
                .unidadTematica(req.getUnidadTematica())
                .objetivoOA(req.getObjetivoOA())
                .indicadoresEvaluacion(req.getIndicadoresEvaluacion())
                .objetivoTransversal(req.getObjetivoTransversal())
                .objetivoClase(req.getObjetivoClase())
                .momentoInicio(req.getMomentoInicio())
                .momentoDesarrollo(req.getMomentoDesarrollo())
                .momentoCierre(req.getMomentoCierre())
                .principiosDUA(req.getPrincipiosDUA())
                .evaluacionClase(req.getEvaluacionClase())
                .pdfUrl(req.getPdfUrl())
                .estado(Planificacion.Estado.BORRADOR)
                .estudianteAutor(autor)
                .build();

        return toResponse(planificacionRepository.save(plan));
    }

    public PlanificacionDTO.Response update(Long id, PlanificacionDTO.Request req, String userEmail) {
        Planificacion plan = findOrThrow(id);
        plan.setTitulo(req.getTitulo());
        plan.setEquipoCoEnsenanza(req.getEquipoCoEnsenanza());
        plan.setNumEstNEET(req.getNumEstNEET());
        plan.setDiagnosticosNEET(req.getDiagnosticosNEET());
        plan.setNumEstNEEP(req.getNumEstNEEP());
        plan.setDiagnosticosNEEP(req.getDiagnosticosNEEP());
        plan.setEstiloVisual(req.getEstiloVisual());
        plan.setEstiloKinestetivo(req.getEstiloKinestetivo());
        plan.setEstiloAuditivo(req.getEstiloAuditivo());
        plan.setOtrosDatos(req.getOtrosDatos());
        plan.setAnioClase(req.getAnioClase());
        plan.setPeriodoClase(req.getPeriodoClase());
        plan.setAsignaturaClase(req.getAsignaturaClase());
        plan.setCursoClase(req.getCursoClase());
        plan.setUnidadTematica(req.getUnidadTematica());
        plan.setObjetivoOA(req.getObjetivoOA());
        plan.setIndicadoresEvaluacion(req.getIndicadoresEvaluacion());
        plan.setObjetivoTransversal(req.getObjetivoTransversal());
        plan.setObjetivoClase(req.getObjetivoClase());
        plan.setMomentoInicio(req.getMomentoInicio());
        plan.setMomentoDesarrollo(req.getMomentoDesarrollo());
        plan.setMomentoCierre(req.getMomentoCierre());
        plan.setPrincipiosDUA(req.getPrincipiosDUA());
        plan.setEvaluacionClase(req.getEvaluacionClase());
        if (req.getPdfUrl() != null) {
            plan.setPdfUrl(req.getPdfUrl());
        }
        return toResponse(planificacionRepository.save(plan));
    }

    public PlanificacionDTO.Response submitForReview(Long id, String userEmail) {
        Planificacion plan = findOrThrow(id);
        plan.setEstado(Planificacion.Estado.EN_REVISION);
        return toResponse(planificacionRepository.save(plan));
    }

    public PlanificacionDTO.Response aprobar(Long id, String comentario, String profesorEmail) {
        Planificacion plan = findOrThrow(id);
        Usuario profesor = getUsuarioByEmail(profesorEmail);
        plan.setEstado(Planificacion.Estado.APROBADA);
        plan.setProfesorRevisor(profesor);
        plan.setComentarioProfesor(comentario);
        return toResponse(planificacionRepository.save(plan));
    }

    public PlanificacionDTO.Response rechazar(Long id, String comentario, String profesorEmail) {
        Planificacion plan = findOrThrow(id);
        Usuario profesor = getUsuarioByEmail(profesorEmail);
        plan.setEstado(Planificacion.Estado.RECHAZADA);
        plan.setProfesorRevisor(profesor);
        plan.setComentarioProfesor(comentario);
        return toResponse(planificacionRepository.save(plan));
    }

    public PlanificacionDTO.Response guardarChatbot(Long id, String retroIA, String histChatbot) {
        Planificacion plan = findOrThrow(id);
        plan.setRetroalimentacionIA(retroIA);
        plan.setHistorialChatbot(histChatbot);
        return toResponse(planificacionRepository.save(plan));
    }

    public PlanificacionDTO.Response setPdfUrl(Long id, String pdfUrl) {
        Planificacion plan = findOrThrow(id);
        plan.setPdfUrl(pdfUrl);
        return toResponse(planificacionRepository.save(plan));
    }

    private Planificacion findOrThrow(Long id) {
        return planificacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Planificacion no encontrada con id: " + id));
    }

    private Usuario getUsuarioByEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + email));
    }

    private PlanificacionDTO.Response toResponse(Planificacion p) {
        return PlanificacionDTO.Response.builder()
                .id(p.getId())
                .titulo(p.getTitulo())
                .equipoCoEnsenanza(p.getEquipoCoEnsenanza())
                .numEstNEET(p.getNumEstNEET())
                .diagnosticosNEET(p.getDiagnosticosNEET())
                .numEstNEEP(p.getNumEstNEEP())
                .diagnosticosNEEP(p.getDiagnosticosNEEP())
                .estiloVisual(p.getEstiloVisual())
                .estiloKinestetivo(p.getEstiloKinestetivo())
                .estiloAuditivo(p.getEstiloAuditivo())
                .otrosDatos(p.getOtrosDatos())
                .anioClase(p.getAnioClase())
                .periodoClase(p.getPeriodoClase())
                .asignaturaClase(p.getAsignaturaClase())
                .cursoClase(p.getCursoClase())
                .unidadTematica(p.getUnidadTematica())
                .objetivoOA(p.getObjetivoOA())
                .indicadoresEvaluacion(p.getIndicadoresEvaluacion())
                .objetivoTransversal(p.getObjetivoTransversal())
                .objetivoClase(p.getObjetivoClase())
                .momentoInicio(p.getMomentoInicio())
                .momentoDesarrollo(p.getMomentoDesarrollo())
                .momentoCierre(p.getMomentoCierre())
                .principiosDUA(p.getPrincipiosDUA())
                .evaluacionClase(p.getEvaluacionClase())
                .pdfUrl(p.getPdfUrl())
                .estado(p.getEstado().name())
                .comentarioProfesor(p.getComentarioProfesor())
                .retroalimentacionIA(p.getRetroalimentacionIA())
                .historialChatbot(p.getHistorialChatbot())
                .estudianteAutorId(p.getEstudianteAutor() != null ? p.getEstudianteAutor().getId() : null)
                .estudianteAutorNombre(p.getEstudianteAutor() != null ? p.getEstudianteAutor().getNombreCompleto() : null)
                .profesorRevisorId(p.getProfesorRevisor() != null ? p.getProfesorRevisor().getId() : null)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
