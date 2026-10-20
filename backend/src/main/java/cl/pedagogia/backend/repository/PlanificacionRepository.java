package cl.pedagogia.backend.repository;

import cl.pedagogia.backend.model.Planificacion;
import cl.pedagogia.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlanificacionRepository extends JpaRepository<Planificacion, Long> {
    List<Planificacion> findByEstudianteAutor(Usuario estudianteAutor);
    List<Planificacion> findByEstudianteAutorOrderByCreatedAtDesc(Usuario estudianteAutor);
    List<Planificacion> findByProfesorRevisor(Usuario profesorRevisor);
    List<Planificacion> findByEstado(Planificacion.Estado estado);
    List<Planificacion> findByEstadoOrderByCreatedAtDesc(Planificacion.Estado estado);
    List<Planificacion> findAllByOrderByCreatedAtDesc();
}
