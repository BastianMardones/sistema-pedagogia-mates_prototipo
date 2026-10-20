"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import { planificacionService } from "@/lib/api";
import {
  FileText, Plus, CheckCircle, Clock, XCircle, MessageSquare,
  Users, ClipboardList, AlertTriangle, BookOpen, ChevronRight, Sparkles
} from "lucide-react";
import { User, Planificacion } from "@/types";
import clsx from "clsx";

const ESTADO_CONFIG = {
  BORRADOR: { label: "Borrador", color: "bg-gray-100 text-gray-600", icon: FileText },
  EN_REVISION: { label: "En Revision", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  APROBADA: { label: "Aprobada", color: "bg-green-100 text-green-800", icon: CheckCircle },
  RECHAZADA: { label: "Rechazada", color: "bg-red-100 text-red-800", icon: XCircle },
};

// ─── DASHBOARD ESTUDIANTE ─────────────────────────────────────────────────────
function DashboardEstudiante({ user }: { user: User }) {
  const [planificaciones, setPlanificaciones] = useState<Planificacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    planificacionService.getAll()
      .then(r => setPlanificaciones(r.data?.slice(0, 5) || []))
      .catch(() => setPlanificaciones([]))
      .finally(() => setLoading(false));
  }, []);

  const aprobadas = planificaciones.filter(p => p.estado === "APROBADA").length;
  const enRevision = planificaciones.filter(p => p.estado === "EN_REVISION").length;
  const rechazadas = planificaciones.filter(p => p.estado === "RECHAZADA").length;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-200">
        <div>
          <p className="text-sm text-gray-500 mb-1">Bienvenido de vuelta</p>
          <h1 className="text-3xl font-bold text-[#1e3a5f]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Hola, {user.nombre}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Aqui esta el resumen de tu portafolio de practicas</p>
        </div>
        <Link href="/planificaciones/nueva" className="btn-primary inline-flex items-center gap-2 text-sm font-bold py-2.5 px-5 shadow-md">
          <Plus className="w-4 h-4" /> Nueva Planificacion
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total enviadas", value: planificaciones.length, color: "text-[#1e3a5f]", bg: "bg-blue-50" },
          { label: "Aprobadas", value: aprobadas, color: "text-[#2d8a4e]", bg: "bg-green-50" },
          { label: "En revision", value: enRevision, color: "text-yellow-700", bg: "bg-yellow-50" },
          { label: "Rechazadas", value: rechazadas, color: "text-red-700", bg: "bg-red-50" },
        ].map(stat => (
          <div key={stat.label} className={clsx("card rounded-2xl p-5 text-center", stat.bg, "border-0 shadow-xs")}>
            <p className={clsx("text-3xl font-bold", stat.color)}>{stat.value}</p>
            <p className="text-xs text-gray-600 mt-1 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/planificaciones/nueva" className="card rounded-2xl p-6 hover:border-[#1e3a5f]/30 hover:shadow-md transition-all group border-2 border-dashed border-gray-200 bg-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-[#1e3a5f]/10 transition-colors">
              <Plus className="w-6 h-6 text-[#1e3a5f]" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base">Nueva Planificacion</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Llena la pauta institucional con los 3 momentos, DUA, NEET/NEEP y sube tu PDF
              </p>
            </div>
          </div>
        </Link>

        <Link href="/chatbot" className="card rounded-2xl p-6 hover:border-[#2d8a4e]/30 hover:shadow-md transition-all group border-2 border-dashed border-green-200 bg-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center group-hover:bg-[#2d8a4e]/10 transition-colors">
              <Sparkles className="w-6 h-6 text-[#2d8a4e]" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base">Chatbot Pedagogico</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                La IA verifica tu planificacion y te hace preguntas de reflexion antes de retroalimentarte
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent planificaciones */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 text-base">Mis planificaciones recientes</h2>
          <Link href="/planificaciones" className="text-xs text-[#1e3a5f] font-bold hover:underline">Ver todas</Link>
        </div>

        {loading ? (
          <div className="card rounded-2xl p-6 text-center text-sm text-gray-400">Cargando...</div>
        ) : planificaciones.length === 0 ? (
          <div className="card rounded-2xl p-8 text-center border-dashed border-2 border-gray-200">
            <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">Aun no tienes planificaciones</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Sube tu primera planificacion para comenzar</p>
            <Link href="/planificaciones/nueva" className="btn-primary text-xs py-2 px-4 font-bold">Subir primera planificacion</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {planificaciones.map(p => {
              const cfg = ESTADO_CONFIG[p.estado];
              return (
                <Link key={p.id} href={`/planificaciones/${p.id}`} className="card rounded-2xl p-4 hover:border-[#1e3a5f]/30 hover:shadow-sm transition-all flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-[#1e3a5f]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{p.titulo}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.asignaturaClase || "Matematica"} · {p.cursoClase || "—"}</p>
                  </div>
                  <span className={clsx("px-2.5 py-1 rounded-lg text-[10px] font-bold flex-shrink-0", cfg.color)}>
                    {cfg.label}
                  </span>
                  {p.estado === "RECHAZADA" && p.comentarioProfesor && (
                    <div className="hidden sm:block max-w-xs">
                      <p className="text-[10px] text-red-600 truncate">"{p.comentarioProfesor}"</p>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DASHBOARD PROFESOR ───────────────────────────────────────────────────────
function DashboardProfesor({ user }: { user: User }) {
  const [pendientes, setPendientes] = useState<Planificacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    planificacionService.getPendientes()
      .then(r => setPendientes(r.data?.slice(0, 8) || []))
      .catch(() => setPendientes([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-200">
        <div>
          <p className="text-sm text-gray-500 mb-1">Panel de supervision</p>
          <h1 className="text-3xl font-bold text-[#1e3a5f]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Hola, Prof. {user.apellido}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Revisa las planificaciones pendientes de tus estudiantes</p>
        </div>
        <div className="flex gap-3">
          <Link href="/evaluaciones" className="btn-secondary inline-flex items-center gap-2 text-xs font-bold py-2.5 px-4">
            <ClipboardList className="w-4 h-4" /> Nueva Evaluacion
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Pendientes de revision", value: pendientes.length, color: "text-yellow-700", bg: "bg-yellow-50", href: "/planificaciones" },
          { label: "Total estudiantes", value: 3, color: "text-[#1e3a5f]", bg: "bg-blue-50", href: "/estudiantes" },
          { label: "Evaluaciones este mes", value: 2, color: "text-[#2d8a4e]", bg: "bg-green-50", href: "/evaluaciones" },
        ].map(stat => (
          <Link key={stat.label} href={stat.href} className={clsx("card rounded-2xl p-5 text-center hover:shadow-md transition-all", stat.bg, "border-0 shadow-xs")}>
            <p className={clsx("text-3xl font-bold", stat.color)}>{stat.value}</p>
            <p className="text-xs text-gray-600 mt-1 font-medium">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: "/planificaciones", icon: FileText, title: "Revisar planificaciones", desc: "Aprueba o rechaza las entregas de tus estudiantes", color: "bg-blue-50 text-[#1e3a5f]" },
          { href: "/estudiantes", icon: Users, title: "Ver estudiantes", desc: "Consulta el portafolio completo de cada alumno", color: "bg-green-50 text-[#2d8a4e]" },
          { href: "/evaluaciones", icon: ClipboardList, title: "Registrar observacion", desc: "Completa la pauta de evaluacion con nota de voz", color: "bg-orange-50 text-orange-700" },
        ].map(item => (
          <Link key={item.href} href={item.href} className="card rounded-2xl p-5 hover:shadow-md transition-all group">
            <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center mb-3", item.color)}>
              <item.icon className="w-5 h-5" />
            </div>
            <p className="font-bold text-gray-900 text-sm">{item.title}</p>
            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* Planificaciones pendientes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            Planificaciones pendientes de revision
          </h2>
          <Link href="/planificaciones" className="text-xs text-[#1e3a5f] font-bold hover:underline">Ver todas</Link>
        </div>

        {loading ? (
          <div className="card rounded-2xl p-6 text-center text-sm text-gray-400">Cargando...</div>
        ) : pendientes.length === 0 ? (
          <div className="card rounded-2xl p-8 text-center border-dashed border-2 border-gray-200">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">Todo al dia</p>
            <p className="text-xs text-gray-400 mt-1">No hay planificaciones pendientes de revision</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendientes.map(p => (
              <Link key={p.id} href={`/planificaciones/${p.id}/revisar`} className="card rounded-2xl p-4 hover:border-yellow-300 hover:shadow-sm transition-all flex items-center gap-4 border-l-4 border-l-yellow-400">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{p.titulo}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Estudiante: <strong>{p.estudianteAutorNombre || "—"}</strong> · {p.asignaturaClase || "Matematica"} · {p.cursoClase || "—"}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{new Date(p.createdAt).toLocaleDateString("es-CL")}</p>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-yellow-700 bg-yellow-100 px-3 py-1.5 rounded-xl flex-shrink-0">
                  <Clock className="w-3.5 h-3.5" /> Revisar
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  if (!user) return null;

  return (
    <AppLayout>
      {user.rol === "PROFESOR"
        ? <DashboardProfesor user={user} />
        : <DashboardEstudiante user={user} />}
    </AppLayout>
  );
}
