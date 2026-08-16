package cl.pedagogia.backend.service;

import cl.pedagogia.backend.dto.UsuarioDTO;
import cl.pedagogia.backend.model.Usuario;
import cl.pedagogia.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UsuarioDTO.Response> findAll() {
        return usuarioRepository.findByActivoTrue()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UsuarioDTO.Response> findByRol(String rol) {
        return usuarioRepository.findByRol(Usuario.Rol.valueOf(rol.toUpperCase()))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UsuarioDTO.Response findById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public UsuarioDTO.PerfilPropio getPerfil(String email) {
        Usuario u = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        UsuarioDTO.PerfilPropio p = new UsuarioDTO.PerfilPropio();
        p.setId(u.getId());
        p.setNombre(u.getNombre());
        p.setApellido(u.getApellido());
        p.setEmail(u.getEmail());
        p.setRol(u.getRol().name());
        return p;
    }

    public UsuarioDTO.Response create(UsuarioDTO.Request request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Ya existe un usuario con ese email");
        }

        Usuario usuario = Usuario.builder()
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .rol(Usuario.Rol.valueOf(request.getRol().toUpperCase()))
                .activo(true)
                .build();

        return toResponse(usuarioRepository.save(usuario));
    }

    public UsuarioDTO.Response update(Long id, UsuarioDTO.Request request) {
        Usuario usuario = findOrThrow(id);
        usuario.setNombre(request.getNombre());
        usuario.setApellido(request.getApellido());
        usuario.setRol(Usuario.Rol.valueOf(request.getRol().toUpperCase()));

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return toResponse(usuarioRepository.save(usuario));
    }

    public void deactivate(Long id) {
        Usuario u = findOrThrow(id);
        u.setActivo(false);
        usuarioRepository.save(u);
    }

    private Usuario findOrThrow(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + id));
    }

    private UsuarioDTO.Response toResponse(Usuario u) {
        UsuarioDTO.Response resp = new UsuarioDTO.Response();
        resp.setId(u.getId());
        resp.setNombre(u.getNombre());
        resp.setApellido(u.getApellido());
        resp.setEmail(u.getEmail());
        resp.setRol(u.getRol().name());
        resp.setActivo(u.isActivo());
        resp.setCreatedAt(u.getCreatedAt());
        return resp;
    }
}
