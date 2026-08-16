"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import {
  Users,
  Plus,
  Search,
  Edit2,
  UserX,
  Mail,
  AlertTriangle,
  Check,
  X,
  UserCheck,
  ChevronDown,
} from "lucide-react";
import { estudianteService } from "@/lib/api";
import { Estudiante } from "@/types";
import clsx from "clsx";

interface EstudianteForm {
  nombre: string;
  apellido: string;
  email: string;
  rut: string;
}

const EMPTY_FORM: EstudianteForm = {
  nombre: "",
  apellido: "",
  email: "",
  rut: "",
};

// ─── Form Modal ───────────────────────────────────────────────────────────────
function EstudianteModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Estudiante;
  onClose: () => void;
  onSave: (data: EstudianteForm) => Promise<void>;
}) {
  const [form, setForm] = useState<EstudianteForm>(
    initial
      ? {
          nombre: initial.nombre,
          apellido: initial.apellido,
          email: initial.email,
          rut: initial.rut || "",
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "No se pudo guardar. Intente nuevamente."
      );
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof EstudianteForm, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">
            {initial ? "Editar estudiante" : "Nuevo estudiante"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre *
              </label>
              <input
                required
                value={form.nombre}
                onChange={(e) => update("nombre", e.target.value)}
                placeholder="María"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Apellido *
              </label>
              <input
                required
                value={form.apellido}
                onChange={(e) => update("apellido", e.target.value)}
                placeholder="González"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Correo electrónico *
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="m.gonzalez@universidad.cl"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              RUT
            </label>
            <input
              value={form.rut}
              onChange={(e) => update("rut", e.target.value)}
              placeholder="12.345.678-9"
              className="input-field"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {initial ? "Actualizar" : "Crear estudiante"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Desactivar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("active");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Estudiante | undefined>();
  const [deactivateTarget, setDeactivateTarget] = useState<Estudiante | undefined>();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchEstudiantes();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchEstudiantes = async () => {
    setLoading(true);
    try {
      const res = await estudianteService.getAll();
      setEstudiantes(res.data || []);
    } catch {
      setEstudiantes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: EstudianteForm) => {
    await estudianteService.create(data);
    setToast({ message: "Estudiante creado exitosamente", type: "success" });
    fetchEstudiantes();
  };

  const handleUpdate = async (data: EstudianteForm) => {
    if (!editTarget) return;
    await estudianteService.update(editTarget.id, data);
    setToast({ message: "Estudiante actualizado", type: "success" });
    fetchEstudiantes();
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await estudianteService.deactivate(deactivateTarget.id);
      setToast({ message: "Estudiante desactivado", type: "success" });
      fetchEstudiantes();
    } catch {
      setToast({ message: "Error al desactivar estudiante", type: "error" });
    } finally {
      setDeactivateTarget(undefined);
    }
  };

  const filtered = estudiantes.filter((e) => {
    const matchSearch =
      !search ||
      `${e.nombre} ${e.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      (e.rut && e.rut.includes(search));
    const matchActive =
      filterActive === "all" ||
      (filterActive === "active" && e.activo) ||
      (filterActive === "inactive" && !e.activo);
    return matchSearch && matchActive;
  });

  const activeCount = estudiantes.filter((e) => e.activo).length;

  return (
    <AppLayout>
      {/* Toast */}
      {toast && (
        <div
          className={clsx(
            "fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all",
            toast.type === "success"
              ? "bg-[#2d8a4e] text-white"
              : "bg-red-600 text-white"
          )}
        >
          {toast.type === "success" ? (
            <Check className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
          {toast.message}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <EstudianteModal
          onClose={() => setShowModal(false)}
          onSave={handleCreate}
        />
      )}
      {editTarget && (
        <EstudianteModal
          initial={editTarget}
          onClose={() => setEditTarget(undefined)}
          onSave={handleUpdate}
        />
      )}
      {deactivateTarget && (
        <ConfirmDialog
          message={`¿Desactivar a ${deactivateTarget.nombre} ${deactivateTarget.apellido}? No podrá acceder al sistema.`}
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivateTarget(undefined)}
        />
      )}

      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-3xl font-bold text-[#1e3a5f]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Estudiantes
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {activeCount} activos · {estudiantes.length - activeCount}{" "}
              inactivos
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo estudiante
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, email o RUT..."
                className="input-field pl-9 py-2.5"
              />
            </div>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
              {(
                [
                  { value: "active", label: "Activos" },
                  { value: "inactive", label: "Inactivos" },
                  { value: "all", label: "Todos" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterActive(opt.value)}
                  className={clsx(
                    "px-4 py-2 text-sm font-medium transition-colors",
                    filterActive === opt.value
                      ? "bg-[#1e3a5f] text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium text-gray-500">
                {search
                  ? "No se encontraron estudiantes"
                  : "No hay estudiantes registrados"}
              </p>
              {!search && (
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-primary mt-4 text-sm"
                >
                  Agregar primer estudiante
                </button>
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
                        Estudiante
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        RUT
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Registro
                      </th>
                      <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((est) => (
                      <tr
                        key={est.id}
                        className={clsx(
                          "hover:bg-gray-50/80 transition-colors",
                          !est.activo && "opacity-60"
                        )}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2a4f7c] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                              {est.nombre[0]}
                              {est.apellido[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">
                                {est.nombre} {est.apellido}
                              </p>
                              <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {est.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-600 font-mono">
                            {est.rut || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {est.activo ? (
                            <span className="badge-approved inline-flex items-center gap-1.5">
                              <UserCheck className="w-3 h-3" /> Activo
                            </span>
                          ) : (
                            <span className="badge-rejected inline-flex items-center gap-1.5">
                              <UserX className="w-3 h-3" /> Inactivo
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-500">
                            {est.createdAt
                              ? new Date(est.createdAt).toLocaleDateString(
                                  "es-CL"
                                )
                              : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => setEditTarget(est)}
                              className="p-1.5 text-gray-400 hover:text-[#1e3a5f] hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {est.activo && (
                              <button
                                onClick={() => setDeactivateTarget(est)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Desactivar"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {filtered.map((est) => (
                  <div
                    key={est.id}
                    className={clsx(
                      "flex items-center gap-4 p-4",
                      !est.activo && "opacity-60"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2a4f7c] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {est.nombre[0]}
                      {est.apellido[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm">
                        {est.nombre} {est.apellido}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {est.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditTarget(est)}
                        className="p-2 text-gray-400 hover:text-[#1e3a5f] hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {est.activo && (
                        <button
                          onClick={() => setDeactivateTarget(est)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Mostrando {filtered.length} de {estudiantes.length} estudiantes
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
