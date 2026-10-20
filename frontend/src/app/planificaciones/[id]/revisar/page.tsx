"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { planificacionService } from "@/lib/api";
import { CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, ArrowLeft, User2 } from "lucide-react";
import { Planificacion } from "@/types";
import clsx from "clsx";

function Campo({ label, value }: { label: string; value?: string | number }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase mb-1">{label}</p>
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{String(value)}</p>
    </div>
  );
}

function Block({ title, open, onToggle, color, children }: {
  title: string; open: boolean; onToggle: () => void; color: string; children: React.ReactNode;
}) {
  return (
    <div className="card rounded-2xl overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 text-left">
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

export default function RevisarPlanificacionPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [plan, setPlan] = useState<Planificacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [comentario, setComentario] = useState("");
  const [accion, setAccion] = useState<"aprobar" | "rechazar" | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [openSections, setOpenSections] = useState([true, true, true, true, true, true]);

  const toggle = (i: number) => setOpenSections(s => s.map((v, idx) => idx === i ? !v : v));

  useEffect(() => {
    planificacionService.getById(id)
      .then(r => setPlan(r.data))
      .catch(() => setError("No se pudo cargar la planificacion"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAccion = async () => {
    if (accion === "rechazar" && !comentario.trim()) {
      setError("Debes ingresar el motivo del rechazo.");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      if (accion === "aprobar") {
        await planificacionService.aprobar(id, comentario || undefined);
      } else {
        await planificacionService.rechazar(id, comentario);
      }
      setExito(accion === "aprobar" ? "Planificacion aprobada." : "Planificacion rechazada.");
      setTimeout(() => router.push("/planificaciones"), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al procesar.");
    } finally {
      setEnviando(false);
    }
  };

  let retro: any = null;
  let historial: any[] = [];
  if (plan?.retroalimentacionIA) { try { retro = JSON.parse(plan.retroalimentacionIA); } catch { /* ignore */ } }
  if (plan?.historialChatbot) { try { historial = JSON.parse(plan.historialChatbot); } catch { /* ignore */ } }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-start gap-4">
          <button onClick={() => router.back()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Revision de Planificacion</p>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">{loading ? "Cargando..." : plan?.titulo}</h1>
            {plan?.estudianteAutorNombre && (
              <div className="flex items-center gap-2 mt-1">
                <User2 className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-600">Estudiante: {plan.estudianteAutorNombre}</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {exito && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700 font-semibold">{exito}</p>
          </div>
        )}

        {!loading && plan && (
          <>
            <Block title="Datos Generales" open={openSections[0]} onToggle={() => toggle(0)} color="bg-indigo-500">
              <div className="grid sm:grid-cols-3 gap-4">
                <Campo label="Ano" value={plan.anioClase} />
                <Campo label="Periodo" value={plan.periodoClase} />
                <Campo label="Asignatura" value={plan.asignaturaClase} />
                <Campo label="Curso" value={plan.cursoClase} />
                <Campo label="Unidad" value={plan.unidadTematica} />
              </div>
              <Campo label="Equipo Co-Ensenanza" value={plan.equipoCoEnsenanza} />
            </Block>

            <Block title="Caracterizacion del Curso" open={openSections[1]} onToggle={() => toggle(1)} color="bg-purple-500">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-yellow-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-yellow-800">NEET: {plan.numEstNEET || 0} est.</p>
                  {plan.diagnosticosNEET && <p className="text-xs text-yellow-700 mt-1">{plan.diagnosticosNEET}</p>}
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-red-800">NEEP: {plan.numEstNEEP || 0} est.</p>
                  {plan.diagnosticosNEEP && <p className="text-xs text-red-700 mt-1">{plan.diagnosticosNEEP}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Visual", val: plan.estiloVisual },
                  { label: "Kinestetivo", val: plan.estiloKinestetivo },
                  { label: "Auditivo", val: plan.estiloAuditivo },
                ].map(s => (
                  <div key={s.label} className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-[#1e3a5f]">{s.val || 0}%</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
              <Campo label="Otros datos" value={plan.otrosDatos} />
            </Block>

            <Block title="Objetivos" open={openSections[2]} onToggle={() => toggle(2)} color="bg-[#2d8a4e]">
              <Campo label="OA del MINEDUC" value={plan.objetivoOA} />
              <Campo label="OA Transversal" value={plan.objetivoTransversal} />
              <Campo label="Objetivo de la Clase" value={plan.objetivoClase} />
              <Campo label="Indicadores de Evaluacion" value={plan.indicadoresEvaluacion} />
            </Block>

            <Block title="3 Momentos de la Clase y DUA" open={openSections[3]} onToggle={() => toggle(3)} color="bg-orange-500">
              <Campo label="Inicio" value={plan.momentoInicio} />
              <Campo label="Desarrollo" value={plan.momentoDesarrollo} />
              <Campo label="Cierre" value={plan.momentoCierre} />
              <Campo label="Principios DUA" value={plan.principiosDUA} />
              <Campo label="Evaluacion" value={plan.evaluacionClase} />
            </Block>

            {historial.length > 0 && (
              <Block title="Historial del Chatbot" open={openSections[4]} onToggle={() => toggle(4)} color="bg-teal-500">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {historial.map((m: any, i: number) => (
                    <div key={i} className={clsx("rounded-xl p-3 text-sm", m.role === "bot" ? "bg-green-50" : "bg-blue-50 ml-6")}>
                      <p className={clsx("text-[10px] font-bold uppercase mb-1", m.role === "bot" ? "text-green-600" : "text-blue-600")}>
                        {m.role === "bot" ? "Chatbot IA" : "Estudiante"}
                      </p>
                      <p className="text-gray-700">{m.content}</p>
                    </div>
                  ))}
                </div>
              </Block>
            )}

            {retro && (
              <Block title="Retroalimentacion de la IA" open={openSections[5]} onToggle={() => toggle(5)} color="bg-teal-600">
                {retro.diagnostico_general && (
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
                    <p className="text-sm text-teal-900">{retro.diagnostico_general}</p>
                  </div>
                )}
                {retro.secciones?.map((s: any, i: number) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-1">
                    <p className="font-bold text-sm">{s.seccion}</p>
                    {s.fortalezas?.map((f: string, j: number) => <p key={j} className="text-xs text-gray-700">+ {f}</p>)}
                    {s.areas_mejora?.map((f: string, j: number) => <p key={j} className="text-xs text-orange-700">! {f}</p>)}
                  </div>
                ))}
              </Block>
            )}

            {plan.estado === "EN_REVISION" && (
              <div className="card rounded-2xl p-6 space-y-4 border-2 border-gray-200">
                <p className="font-bold text-gray-900">Decision del Profesor</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccion("aprobar")}
                    className={clsx("flex items-center gap-3 p-4 rounded-xl border-2 text-left", accion === "aprobar" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300")}
                  >
                    <CheckCircle className={clsx("w-5 h-5", accion === "aprobar" ? "text-green-600" : "text-gray-400")} />
                    <div>
                      <p className="font-bold text-sm">Aprobar</p>
                      <p className="text-xs text-gray-500">La planificacion cumple los criterios</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccion("rechazar")}
                    className={clsx("flex items-center gap-3 p-4 rounded-xl border-2 text-left", accion === "rechazar" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-300")}
                  >
                    <XCircle className={clsx("w-5 h-5", accion === "rechazar" ? "text-red-600" : "text-gray-400")} />
                    <div>
                      <p className="font-bold text-sm">Rechazar</p>
                      <p className="text-xs text-gray-500">Requiere correcciones</p>
                    </div>
                  </button>
                </div>
                {accion && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                      {accion === "rechazar" ? "Motivo del rechazo (requerido)" : "Comentario adicional (opcional)"}
                    </label>
                    <textarea
                      value={comentario}
                      onChange={e => setComentario(e.target.value)}
                      rows={3}
                      className="input-field resize-none text-sm"
                      placeholder={accion === "rechazar" ? "Indica que debe mejorar..." : "Agrega una nota adicional..."}
                    />
                    <button
                      type="button"
                      onClick={handleAccion}
                      disabled={enviando}
                      className={clsx("mt-3 w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-50", accion === "aprobar" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700")}
                    >
                      {enviando ? "Procesando..." : accion === "aprobar" ? "Confirmar Aprobacion" : "Confirmar Rechazo"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {plan.estado !== "EN_REVISION" && (
              <div className={clsx("card rounded-2xl p-5 border-l-4", plan.estado === "APROBADA" ? "border-l-green-500 bg-green-50" : plan.estado === "RECHAZADA" ? "border-l-red-500 bg-red-50" : "border-l-gray-300")}>
                <p className="font-bold text-sm">Estado actual: {plan.estado}</p>
                {plan.comentarioProfesor && <p className="text-sm mt-1 italic">{plan.comentarioProfesor}</p>}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}