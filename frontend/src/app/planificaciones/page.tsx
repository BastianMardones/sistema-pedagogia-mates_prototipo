"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import { planificacionService } from "@/lib/api";
import { FileText, Plus, Clock, CheckCircle, XCircle, Search, Filter, ChevronRight } from "lucide-react";
import { User, Planificacion, PlanificacionEstado } from "@/types";
import clsx from "clsx";

const ESTADOS: { value: PlanificacionEstado | "TODOS"; label: string; color: string }[] = [
  { value: "TODOS", label: "Todas", color: "bg-gray-100 text-gray-700" },
  { value: "BORRADOR", label: "Borrador", color: "bg-gray-100 text-gray-600" },
  { value: "EN_REVISION", label: "En Revision", color: "bg-yellow-100 text-yellow-800" },
  { value: "APROBADA", label: "Aprobada", color: "bg-green-100 text-green-800" },
  { value: "RECHAZADA", label: "Rechazada", color: "bg-red-100 text-red-800" },
];

const ICON_MAP = {
  BORRADOR: FileText,
  EN_REVISION: Clock,
  APROBADA: CheckCircle,
  RECHAZADA: XCircle,
};

export default function PlanificacionesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [planificaciones, setPlanificaciones] = useState<Planificacion[]>([]);
  const [filtro, setFiltro] = useState<PlanificacionEstado | "TODOS">("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    planificacionService.getAll()
      .then(r => setPlanificaciones(r.data || []))
      .catch(() => setPlanificaciones([]))
      .finally(() => setLoading(false));
  }, []);

  const filtradas = planificaciones.filter(p => {
    const matchEstado = filtro === "TODOS" || p.estado === filtro;
    const matchBusqueda = !busqueda ||
      p.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.cursoClase || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.asignaturaClase || "").toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  const esProfesor = user?.rol === "PROFESOR";

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]" style={{ fontFamily: "'Playfair Display', serif" }}>
              {esProfesor ? "Planificaciones de Estudiantes" : "Mis Planificaciones"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {esProfesor
                ? "Revisa, aprueba o rechaza las planificaciones enviadas"
                : "Gestiona tu portafolio de planificaciones de clase"}
            </p>
          </div>
          {!esProfesor && (
            <Link href="/planificaciones/nueva" className="btn-primary inline-flex items-center gap-2 text-sm font-bold py-2.5 px-5 shadow-md flex-shrink-0">
              <Plus className="w-4 h-4" /> Nueva Planificacion
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar por titulo, asignatura o curso..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="input-field pl-9 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {ESTADOS.map(e => (
              <button
                key={e.value}
                onClick={() => setFiltro(e.value)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  filtro === e.value
                    ? e.value === "TODOS" ? "bg-[#1e3a5f] text-white" : e.color.replace("100", "200").replace("text-", "text-") + " ring-2 ring-offset-1"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
                )}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="card rounded-2xl p-8 text-center text-sm text-gray-400">Cargando planificaciones...</div>
        ) : filtradas.length === 0 ? (
          <div className="card rounded-2xl p-10 text-center border-dashed border-2 border-gray-200">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">No hay planificaciones</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              {busqueda || filtro !== "TODOS" ? "Prueba con otros filtros" : "Comienza creando tu primera planificacion"}
            </p>
            {!esProfesor && (
              <Link href="/planificaciones/nueva" className="btn-primary text-xs py-2 px-4 font-bold">Nueva Planificacion</Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtradas.map(p => {
              const Icon = ICON_MAP[p.estado];
              const href = esProfesor && p.estado === "EN_REVISION"
                ? `/planificaciones/${p.id}/revisar`
                : `/planificaciones/${p.id}`;

              return (
                <Link
                  key={p.id}
                  href={href}
                  className={clsx(
                    "card rounded-2xl p-5 hover:shadow-md transition-all flex items-start gap-4",
                    p.estado === "EN_REVISION" && esProfesor && "border-l-4 border-l-yellow-400",
                    p.estado === "RECHAZADA" && !esProfesor && "border-l-4 border-l-red-400"
                  )}
                >
                  <div className={clsx(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    p.estado === "APROBADA" ? "bg-green-50" :
                    p.estado === "EN_REVISION" ? "bg-yellow-50" :
                    p.estado === "RECHAZADA" ? "bg-red-50" : "bg-gray-100"
                  )}>
                    <Icon className={clsx(
                      "w-5 h-5",
                      p.estado === "APROBADA" ? "text-green-600" :
                      p.estado === "EN_REVISION" ? "text-yellow-600" :
                      p.estado === "RECHAZADA" ? "text-red-600" : "text-gray-400"
                    )} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-gray-900 text-sm leading-tight">{p.titulo}</p>
                      <span className={clsx(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold flex-shrink-0",
                        ESTADOS.find(e => e.value === p.estado)?.color
                      )}>
                        {ESTADOS.find(e => e.value === p.estado)?.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                      {p.asignaturaClase && <span className="text-xs text-gray-500">{p.asignaturaClase}</span>}
                      {p.cursoClase && <><span className="text-gray-300">·</span><span className="text-xs text-gray-500">{p.cursoClase}</span></>}
                      {p.unidadTematica && <><span className="text-gray-300">·</span><span className="text-xs text-gray-400 truncate max-w-xs">{p.unidadTematica}</span></>}
                    </div>

                    {esProfesor && p.estudianteAutorNombre && (
                      <p className="text-xs text-[#1e3a5f] font-semibold mt-1">Estudiante: {p.estudianteAutorNombre}</p>
                    )}

                    {p.estado === "RECHAZADA" && p.comentarioProfesor && (
                      <p className="text-xs text-red-600 mt-1.5 bg-red-50 rounded-lg px-2.5 py-1.5">
                        Razon del rechazo: {p.comentarioProfesor}
                      </p>
                    )}

                    <p className="text-[10px] text-gray-400 mt-1.5">
                      {new Date(p.createdAt).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
