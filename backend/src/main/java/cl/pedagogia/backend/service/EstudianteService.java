package cl.pedagogia.backend.service;

import cl.pedagogia.backend.dto.EstudianteDTO;
import cl.pedagogia.backend.model.Estudiante;
import cl.pedagogia.backend.repository.EstudianteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EstudianteService {

    private final EstudianteRepository estudianteRepository;

    @Transactional(readOnly = true)
    public List<EstudianteDTO.Response> findAll() {
        return estudianteRepository.findByActivoTrue()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EstudianteDTO.Response findById(Long id) {
        return toResponse(findEstudianteOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<EstudianteDTO.Response> buscar(String query) {
        return estudianteRepository
                .findByNombreContainingIgnoreCaseOrApellidoContainingIgnoreCase(query, query)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public EstudianteDTO.Response create(EstudianteDTO.Request request) {
        if (estudianteRepository.existsByRut(request.getRut())) {
            throw new RuntimeException("Ya existe un estudiante con RUT: " + request.getRut());
        }
        Estudiante estudiante = Estudiante.builder()
                .rut(request.getRut())
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .email(request.getEmail())
                .fechaIngreso(request.getFechaIngreso())
                .activo(true)
                .build();
        return toResponse(estudianteRepository.save(estudiante));
    }

    public EstudianteDTO.Response update(Long id, EstudianteDTO.Request request) {
        Estudiante estudiante = findEstudianteOrThrow(id);
        estudiante.setNombre(request.getNombre());
        estudiante.setApellido(request.getApellido());
        estudiante.setEmail(request.getEmail());
        estudiante.setFechaIngreso(request.getFechaIngreso());
        return toResponse(estudianteRepository.save(estudiante));
    }

    public void deactivate(Long id) {
        Estudiante estudiante = findEstudianteOrThrow(id);
        estudiante.setActivo(false);
        estudianteRepository.save(estudiante);
    }

    private Estudiante findEstudianteOrThrow(Long id) {
        return estudianteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Estudiante no encontrado con id: " + id));
    }

    private EstudianteDTO.Response toResponse(Estudiante e) {
        EstudianteDTO.Response resp = new EstudianteDTO.Response();
        resp.setId(e.getId());
        resp.setRut(e.getRut());
        resp.setNombre(e.getNombre());
        resp.setApellido(e.getApellido());
        resp.setEmail(e.getEmail());
        resp.setFechaIngreso(e.getFechaIngreso());
        resp.setActivo(e.isActivo());
        return resp;
    }
}
