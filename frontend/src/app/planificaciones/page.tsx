"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileUp,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { planificacionService } from "@/lib/api";
import { Planificacion, PlanificacionEstado, User } from "@/types";
import Link from "next/link";
import clsx from "clsx";

const ESTADOS: { value: PlanificacionEstado | ""; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "BORRADOR", label: "Borrador" },
  { value: "ENVIADA", label: "Enviada" },
  { value: "EN_REVISION", label: "En Revisión" },
  { value: "APROBADA", label: "Aprobada" },
  { value: "RECHAZADA", label: "Rechazada" },
];

export default function PlanificacionesPage() {
  const [planificaciones, setPlanificaciones] = useState<Planificacion[]>([]);
  const [filtered, setFiltered] = useState<Planificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<PlanificacionEstado | "">("");
  const [user, setUser] = useState<User | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newNivel, setNewNivel] = useState("PRIMERO");
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
    fetchPlanificaciones();
  }, []);

  useEffect(() => {
    let result = planificaciones;
    if (search) {
      result = result.filter(
        (p) =>
          p.titulo.toLowerCase().includes(search.toLowerCase()) ||
          p.estudiante?.nombre.toLowerCase().includes(search.toLowerCase()) ||
          p.estudiante?.apellido.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (estadoFilter) {
      result = result.filter((p) => p.estado === estadoFilter);
    }
    setFiltered(result);
  }, [planificaciones, search, estadoFilter]);

  const fetchPlanificaciones = async () => {
    setLoading(true);
    try {
      const res = await planificacionService.getAll();
      setPlanificaciones(res.data || []);
    } catch {
      setPlanificaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await planificacionService.create({
        titulo: newTitle,
        descripcion: newDesc,
        nivel: newNivel,
      });
      setShowNewForm(false);
      setNewTitle("");
      setNewDesc("");
      fetchPlanificaciones();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleEjecutar = async (id: number) => {
    setActionLoading(id);
    try {
      await planificacionService.ejecutar(id);
      fetchPlanificaciones();
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const statusConfig: Record<
    PlanificacionEstado,
    { label: string; class: string; icon: React.ElementType }
  > = {
    BORRADOR: { label: "Borrador", class: "badge-draft", icon: FileText },
    ENVIADA: { label: "Enviada", class: "badge-pending", icon: Clock },
    EN_REVISION: {
      label: "En Revisión",
      class: "badge-pending",
      icon: Clock,
    },
    APROBADA: {
      label: "Aprobada",
      class: "badge-approved",
      icon: CheckCircle,
    },
    RECHAZADA: {
      label: "Rechazada",
      class: "badge-rejected",
      icon: XCircle,
    },
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-3xl font-bold text-[#1e3a5f]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Planificaciones
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {filtered.length} planificación{filtered.length !== 1 ? "es" : ""}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchPlanificaciones}
              className="btn-secondary p-2.5"
              title="Actualizar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            {user?.rol === "ESTUDIANTE" && (
              <button
                onClick={() => setShowNewForm(!showNewForm)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nueva planificación
              </button>
            )}
          </div>
        </div>

        {/* New form */}
        {showNewForm && (
          <div className="card mb-6 border-2 border-[#1e3a5f]/20">
            <h3 className="font-semibold text-gray-800 mb-4">
              Nueva Planificación
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Título *
                  </label>
                  <input
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="ej: Planificación Álgebra Lineal - Semana 3"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nivel
                  </label>
                  <select
                    value={newNivel}
                    onChange={(e) => setNewNivel(e.target.value)}
                    className="input-field"
                  >
                    <option value="PRIMERO">1° año</option>
                    <option value="SEGUNDO">2° año</option>
                    <option value="TERCERO">3° año</option>
                    <option value="CUARTO">4° año</option>
                    <option value="QUINTO">5° año</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Descripción breve del contenido a trabajar..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Crear planificación
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título o estudiante..."
                className="input-field pl-9 py-2.5"
              />
            </div>
            <div className="relative sm:w-56">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={estadoFilter}
                onChange={(e) =>
                  setEstadoFilter(e.target.value as PlanificacionEstado | "")
                }
                className="input-field pl-9 py-2.5 appearance-none"
              >
                {ESTADOS.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileText className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium text-gray-500">
                No se encontraron planificaciones
              </p>
              <p className="text-sm mt-1">
                {search || estadoFilter
                  ? "Intente con otros filtros"
                  : "Aún no hay planificaciones registradas"}
              </p>
              {user?.rol === "ESTUDIANTE" && !search && !estadoFilter && (
                <Link href="/chatbot" className="btn-accent mt-4 text-sm">
                  Analizar con IA
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Planificación
                      </th>
                      {user?.rol !== "ESTUDIANTE" && (
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Estudiante
                        </th>
                      )}
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Nivel
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-5 py-3.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((plan) => {
                      const sc = statusConfig[plan.estado];
                      const Icon = sc.icon;
                      return (
                        <tr key={plan.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-[#1e3a5f]" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 text-sm">
                                  {plan.titulo}
                                </p>
                                {plan.descripcion && (
                                  <p className="text-xs text-gray-400 truncate max-w-xs">
                                    {plan.descripcion}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          {user?.rol !== "ESTUDIANTE" && (
                            <td className="px-5 py-4">
                              {plan.estudiante ? (
                                <div>
                                  <p className="text-sm font-medium text-gray-700">
                                    {plan.estudiante.nombre}{" "}
                                    {plan.estudiante.apellido}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {plan.estudiante.email}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                          )}
                          <td className="px-5 py-4">
                            <span className="text-sm text-gray-600">
                              {plan.nivel || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={clsx(
                                "inline-flex items-center gap-1.5",
                                sc.class
                              )}
                            >
                              <Icon className="w-3 h-3" />
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm text-gray-500">
                              {new Date(plan.createdAt).toLocaleDateString(
                                "es-CL"
                              )}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {plan.archivoUrl && (
                                <a
                                  href={plan.archivoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-400 hover:text-[#1e3a5f] hover:bg-blue-50 rounded transition-colors"
                                  title="Ver archivo"
                                >
                                  <Eye className="w-4 h-4" />
                                </a>
                              )}
                              {user?.rol !== "ESTUDIANTE" &&
                                plan.estado === "ENVIADA" && (
                                  <button
                                    onClick={() => handleEjecutar(plan.id)}
                                    disabled={actionLoading === plan.id}
                                    className="px-3 py-1.5 text-xs font-medium bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2a4f7c] transition-colors disabled:opacity-50"
                                  >
                                    {actionLoading === plan.id ? (
                                      <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin inline-block" />
                                    ) : (
                                      "Revisar"
                                    )}
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {filtered.map((plan) => {
                  const sc = statusConfig[plan.estado];
                  return (
                    <div key={plan.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 text-sm">
                            {plan.titulo}
                          </p>
                          {plan.estudiante && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {plan.estudiante.nombre} {plan.estudiante.apellido}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(plan.createdAt).toLocaleDateString("es-CL")}
                          </p>
                        </div>
                        <span className={clsx("flex-shrink-0", sc.class)}>
                          {sc.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
