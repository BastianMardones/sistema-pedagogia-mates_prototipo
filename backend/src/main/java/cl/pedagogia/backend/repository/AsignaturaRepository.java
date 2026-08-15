package cl.pedagogia.backend.repository;

import cl.pedagogia.backend.model.Asignatura;
import cl.pedagogia.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AsignaturaRepository extends JpaRepository<Asignatura, Long> {
    List<Asignatura> findByProfesor(Usuario profesor);
    List<Asignatura> findByActivoTrue();
    List<Asignatura> findByAnioAndSemestre(Integer anio, Integer semestre);
    boolean existsByCodigo(String codigo);
}
