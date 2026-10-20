"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import { usuarioService } from "@/lib/api";
import { Users, FileText, ChevronRight, Search, BookOpen } from "lucide-react";
import { User } from "@/types";
import clsx from "clsx";

export default function EstudiantesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [estudiantes, setEstudiantes] = useState<User[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    usuarioService.getMisEstudiantes()
      .then(r => setEstudiantes(r.data || []))
      .catch(() => {
        // Fallback demo data si el backend no esta corriendo
        setEstudiantes([
          { id: 1, nombre: "Matias", apellido: "Silva Morales", email: "estudiante@pedagogia.cl", rol: "ESTUDIANTE" },
          { id: 2, nombre: "Camila", apellido: "Torres Perez", email: "camila@pedagogia.cl", rol: "ESTUDIANTE" },
          { id: 3, nombre: "Ignacio", apellido: "Valenzuela Castro", email: "ignacio@pedagogia.cl", rol: "ESTUDIANTE" },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (user?.rol !== "PROFESOR") {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <p className="text-gray-500">Esta seccion solo esta disponible para profesores.</p>
        </div>
      </AppLayout>
    );
  }

  const filtrados = estudiantes.filter(e =>
    !busqueda ||
    `${e.nombre} ${e.apellido}`.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Mis Estudiantes en Practica
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {estudiantes.length} estudiantes asignados — Ciclo Practica Profesional
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="input-field pl-9 text-sm"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="card rounded-2xl p-8 text-center text-sm text-gray-400">Cargando estudiantes...</div>
        ) : filtrados.length === 0 ? (
          <div className="card rounded-2xl p-10 text-center border-dashed border-2 border-gray-200">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">No se encontraron estudiantes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map(est => (
              <div key={est.id} className="card rounded-2xl p-5 hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#1e3a5f]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#1e3a5f] font-bold text-sm">
                      {est.nombre?.charAt(0)}{est.apellido?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{est.nombre} {est.apellido}</p>
                    <p className="text-xs text-gray-500">{est.email}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      href={`/planificaciones?estudianteId=${est.id}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-[#1e3a5f] text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Ver planificaciones
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}