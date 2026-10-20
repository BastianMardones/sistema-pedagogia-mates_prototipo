"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import { planificacionService } from "@/lib/api";
import {
  ArrowLeft, FileText, CheckCircle, Clock, XCircle,
  MessageSquare, ChevronDown, ChevronUp, Download, User2
} from "lucide-react";
import { Planificacion } from "@/types";
import clsx from "clsx";

function Campo({ label, value }: { label: string; value?: string | number }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{String(value)}</p>
    </div>
  );
}

function Seccion({ title, children, color = "bg-blue-500" }: { title: string; children: React.ReactNode; color?: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={clsx("w-1 h-7 rounded-full", color)} />
          <p className="font-bold text-gray-900 text-sm">{title}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-6 pb-6 pt-2 space-y-4">{children}</div>}
    </div>
  );
}

const ESTADO_CONFIG = {
  BORRADOR: { label: "Borrador", color: "bg-gray-100 text-gray-700", icon: FileText },
  EN_REVISION: { label: "En Revision por el Profesor", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  APROBADA: { label: "Aprobada", color: "bg-green-100 text-green-800", icon: CheckCircle },
  RECHAZADA: { label: "Rechazada — Requiere Correccion", color: "bg-red-100 text-red-800", icon: XCircle },
};

export default function DetallePlanificacionPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [plan, setPlan] = useState<Planificacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    planificacionService.getById(id)
      .then(r => setPlan(r.data))
      .catch(() => setError("No se pudo cargar la planificacion. Verifica que el backend este corriendo."))
      .finally(() => setLoading(false));
  }, [id]);

  let retroalimentacion: any = null;
  let historial: any[] = [];
  if (plan?.retroalimentacionIA) {
    try { retroalimentacion = JSON.parse(plan.retroalimentacionIA); } catch {}
  }
  if (plan?.historialChatbot) {
    try { historial = JSON.parse(plan.historialChatbot); } catch {}
  }

  const estadoCfg = plan ? ESTADO_CONFIG[plan.estado] || ESTADO_CONFIG.BORRADOR : ESTADO_CONFIG.BORRADOR;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl mt-0.5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-bold">Detalle de Planificacion</p>
            <h1 className="text-2xl font-bold text-[#1e3a5f]" style={{ fontFamily: "'Playfair Display', serif" }}>
              {loading ? "Cargando..." : plan?.titulo || "Planificacion"}
            </h1>
            {plan && (
              <div className="flex items-center gap-3 mt-2">
                <span className={clsx("px-3 py-1 rounded-lg text-xs font-bold", estadoCfg.color)}>
                  {estadoCfg.label}
                </span>
                {plan.createdAt && (
                  <p className="text-xs text-gray-400">
                    {new Date(plan.createdAt).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            )}
          </div>
          {plan?.pdfUrl && (
            <a
              href={plan.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-2 px-3 font-bold flex items-center gap-1.5 flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </a>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
        )}

        {/* Estado especial: rechazada */}
        {plan?.estado === "RECHAZADA" && plan.comentarioProfesor && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5">
            <p className="font-bold text-red-800 text-sm mb-2">Observacion del Profesor:</p>
            <p className="text-sm text-red-700 italic">"{plan.comentarioProfesor}"</p>
            <div className="mt-4">
              <Link
                href="/planificaciones/nueva"
                className="btn-primary text-xs py-2 px-4 font-bold inline-flex items-center gap-1.5"
              >
                Crear nueva planificacion corregida
              </Link>
            </div>
          </div>
        )}

        {/* Estado: Aprobada */}
        {plan?.estado === "APROBADA" && (
          <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-green-800 text-sm">Planificacion aprobada por el profesor</p>
                {plan.comentarioProfesor && (
                  <p className="text-sm text-green-700 mt-1 italic">"{plan.comentarioProfesor}"</p>
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && plan && (
          <>
            {/* Datos Generales */}
            <Seccion title="Datos Generales de la Clase" color="bg-indigo-500">
              <div className="grid sm:grid-cols-3 gap-4">
                <Campo label="Ano" value={plan.anioClase} />
                <Campo label="Periodo" value={plan.periodoClase} />
                <Campo label="Asignatura" value={plan.asignaturaClase} />
                <Campo label="Curso" value={plan.cursoClase} />
              </div>
              <Campo label="Unidad o Eje Tematico" value={plan.unidadTematica} />
              <Campo label="Equipo de Co-Ensenanza" value={plan.equipoCoEnsenanza} />
            </Seccion>

            {/* Caracterizacion */}
            {(plan.numEstNEET || plan.numEstNEEP || plan.otrosDatos) && (
              <Seccion title="Caracterizacion del Curso" color="bg-purple-500">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-yellow-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-yellow-800 mb-2">Estudiantes con NEET</p>
                    <p className="text-sm font-bold text-yellow-900">{plan.numEstNEET || 0} estudiantes</p>
                    {plan.diagnosticosNEET && <p className="text-xs text-yellow-700 mt-1">{plan.diagnosticosNEET}</p>}
                  </div>
                  <div className="bg-red-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-red-800 mb-2">Estudiantes con NEEP</p>
                    <p className="text-sm font-bold text-red-900">{plan.numEstNEEP || 0} estudiantes</p>
                    {plan.diagnosticosNEEP && <p className="text-xs text-red-700 mt-1">{plan.diagnosticosNEEP}</p>}
                  </div>
                </div>
                {(plan.estiloVisual || plan.estiloAuditivo || plan.estiloKinestetivo) && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Visual", val: plan.estiloVisual },
                      { label: "Kinestetivo", val: plan.estiloKinestetivo },
                      { label: "Auditivo", val: plan.estiloAuditivo },
                    ].map(s => (
                      <div key={s.label} className="bg-blue-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-[#1e3a5f]">{s.val || 0}%</p>
                        <p className="text-[10px] text-gray-500 font-medium">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
                <Campo label="Otros datos" value={plan.otrosDatos} />
              </Seccion>
            )}

            {/* Objetivos */}
            <Seccion title="Objetivos" color="bg-[#2d8a4e]">
              <Campo label="Objetivo de Aprendizaje (OA) + Indicadores" value={plan.objetivoOA} />
              <Campo label="Indicadores de Evaluacion" value={plan.indicadoresEvaluacion} />
              <Campo label="OA Transversal" value={plan.objetivoTransversal} />
              <Campo label="Objetivo de la Clase" value={plan.objetivoClase} />
            </Seccion>

            {/* 3 Momentos + DUA */}
            <Seccion title="Momentos de la Clase + DUA" color="bg-orange-500">
              <Campo label="Inicio (15 min)" value={plan.momentoInicio} />
              <Campo label="Desarrollo (60 min)" value={plan.momentoDesarrollo} />
              <Campo label="Cierre" value={plan.momentoCierre} />
              <Campo label="Principios DUA aplicados" value={plan.principiosDUA} />
              <Campo label="Evaluacion de la clase" value={plan.evaluacionClase} />
            </Seccion>

            {/* Historial Chatbot (si existe) */}
            {historial.length > 0 && (
              <Seccion title="Historial del Chatbot Pedagogico" color="bg-teal-500">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {historial.map((msg: any, i: number) => (
                    <div
                      key={i}
                      className={clsx(
                        "rounded-xl p-3 text-sm",
                        msg.role === "bot"
                          ? "bg-green-50 border border-green-100"
                          : "bg-blue-50 border border-blue-100 ml-6"
                      )}
                    >
                      <p className={clsx(
                        "text-[10px] font-bold uppercase mb-1",
                        msg.role === "bot" ? "text-green-600" : "text-blue-600"
                      )}>
                        {msg.role === "bot" ? "Chatbot IA" : "Tu respuesta"}
                      </p>
                      <p className="text-gray-700 leading-relaxed">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </Seccion>
            )}

            {/* Retroalimentacion IA */}
            {retroalimentacion && (
              <Seccion title="Retroalimentacion de la IA" color="bg-[#2d8a4e]">
                {retroalimentacion.diagnostico_general && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-green-700 uppercase mb-1">Diagnostico General</p>
                    <p className="text-sm text-green-900 leading-relaxed">{retroalimentacion.diagnostico_general}</p>
                  </div>
                )}
                {retroalimentacion.secciones?.map((s: any, i: number) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-2">
                    <p className="font-bold text-sm text-gray-900">{s.seccion}</p>
                    {s.fortalezas?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-green-600 uppercase mb-1">Fortalezas</p>
                        <ul className="space-y-0.5">
                          {s.fortalezas.map((f: string, j: number) => (
                            <li key={j} className="text-xs text-gray-700 flex gap-1.5"><span className="text-green-500">+</span>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {s.areas_mejora?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-orange-600 uppercase mb-1">Areas de mejora</p>
                        <ul className="space-y-0.5">
                          {s.areas_mejora.map((f: string, j: number) => (
                            <li key={j} className="text-xs text-gray-700 flex gap-1.5"><span className="text-orange-500">!</span>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {s.sugerencias?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Sugerencias</p>
                        <ul className="space-y-0.5">
                          {s.sugerencias.map((f: string, j: number) => (
                            <li key={j} className="text-xs text-gray-700 flex gap-1.5"><span className="text-blue-500">-</span>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
                {retroalimentacion.recomendaciones_prioritarias?.length > 0 && (
                  <div className="bg-[#1e3a5f]/5 rounded-xl p-4">
                    <p className="font-bold text-[#1e3a5f] text-xs uppercase mb-2">Acciones Prioritarias</p>
                    <ol className="space-y-1.5">
                      {retroalimentacion.recomendaciones_prioritarias.map((r: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-gray-800">
                          <span className="w-4 h-4 rounded-full bg-[#1e3a5f] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                          {r}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </Seccion>
            )}

            {/* Si el estudiante puede enviar al chatbot (BORRADOR) */}
            {plan.estado === "BORRADOR" && (
              <div className="flex gap-3">
                <Link
                  href={`/chatbot?planId=${plan.id}`}
                  className="btn-primary flex-1 py-3 text-sm font-bold text-center flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Enviar al Chatbot para analisis
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}