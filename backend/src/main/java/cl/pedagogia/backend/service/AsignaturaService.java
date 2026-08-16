package cl.pedagogia.backend.service;

import cl.pedagogia.backend.dto.AsignaturaDTO;
import cl.pedagogia.backend.model.Asignatura;
import cl.pedagogia.backend.model.Usuario;
import cl.pedagogia.backend.repository.AsignaturaRepository;
import cl.pedagogia.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AsignaturaService {

    private final AsignaturaRepository asignaturaRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<AsignaturaDTO.Response> findAll() {
        return asignaturaRepository.findByActivoTrue()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AsignaturaDTO.Response> findByAnioSemestre(Integer anio, Integer semestre) {
        return asignaturaRepository.findByAnioAndSemestre(anio, semestre)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AsignaturaDTO.Response> findByProfesor(Long idProfesor) {
        Usuario profesor = findUsuarioOrThrow(idProfesor);
        return asignaturaRepository.findByProfesor(profesor)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AsignaturaDTO.Response findById(Long id) {
        return toResponse(findOrThrow(id));
    }

    public AsignaturaDTO.Response create(AsignaturaDTO.Request request) {
        if (asignaturaRepository.existsByCodigo(request.getCodigo())) {
            throw new RuntimeException("Ya existe una asignatura con código: " + request.getCodigo());
        }

        Asignatura asignatura = Asignatura.builder()
                .codigo(request.getCodigo())
                .nombre(request.getNombre())
                .semestre(request.getSemestre())
                .anio(request.getAnio())
                .activo(true)
                .build();

        if (request.getIdProfesor() != null) {
            asignatura.setProfesor(findUsuarioOrThrow(request.getIdProfesor()));
        }

        return toResponse(asignaturaRepository.save(asignatura));
    }

    public AsignaturaDTO.Response update(Long id, AsignaturaDTO.Request request) {
        Asignatura asignatura = findOrThrow(id);
        asignatura.setNombre(request.getNombre());
        asignatura.setSemestre(request.getSemestre());
        asignatura.setAnio(request.getAnio());

        if (request.getIdProfesor() != null) {
            asignatura.setProfesor(findUsuarioOrThrow(request.getIdProfesor()));
        } else {
            asignatura.setProfesor(null);
        }

        return toResponse(asignaturaRepository.save(asignatura));
    }

    public void deactivate(Long id) {
        Asignatura a = findOrThrow(id);
        a.setActivo(false);
        asignaturaRepository.save(a);
    }

    private Asignatura findOrThrow(Long id) {
        return asignaturaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asignatura no encontrada: " + id));
    }

    private Usuario findUsuarioOrThrow(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + id));
    }

    private AsignaturaDTO.Response toResponse(Asignatura a) {
        AsignaturaDTO.Response resp = new AsignaturaDTO.Response();
        resp.setId(a.getId());
        resp.setCodigo(a.getCodigo());
        resp.setNombre(a.getNombre());
        resp.setSemestre(a.getSemestre());
        resp.setAnio(a.getAnio());
        resp.setActivo(a.isActivo());
        resp.setCreatedAt(a.getCreatedAt());

        if (a.getProfesor() != null) {
            AsignaturaDTO.ProfesorResumen pr = new AsignaturaDTO.ProfesorResumen();
            pr.setId(a.getProfesor().getId());
            pr.setNombre(a.getProfesor().getNombre());
            pr.setApellido(a.getProfesor().getApellido());
            pr.setEmail(a.getProfesor().getEmail());
            resp.setProfesor(pr);
        }

        return resp;
    }
}
