package cl.pedagogia.backend.repository;

import cl.pedagogia.backend.model.Planificacion;
import cl.pedagogia.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PlanificacionRepository extends JpaRepository<Planificacion, Long> {
    List<Planificacion> findByProfesor(Usuario profesor);
    List<Planificacion> findByAsignaturaId(Long asignaturaId);
    List<Planificacion> findByEstado(Planificacion.Estado estado);
    List<Planificacion> findByFechaClaseBetween(LocalDate inicio, LocalDate fin);
    List<Planificacion> findByProfesorOrderByFechaClaseDesc(Usuario profesor);
}
