"use client";

import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { chatbotService } from "@/lib/api";
import {
  Upload, Send, CheckCircle, XCircle, AlertTriangle, FileText,
  Sparkles, ChevronRight, Info, MessageSquare, BookOpen, Loader2
} from "lucide-react";
import { ChatMessage, ChatSession, RetroalimentacionFinal } from "@/types";
import clsx from "clsx";

type Fase = "upload" | "verificando" | "rechazado" | "preguntas" | "retroalimentacion";

const CICLOS = [
  { id: "inicial", label: "Ciclo Inicial", sub: "Practicas 1-2: Aproximacion y Ambientes", color: "border-blue-200 hover:border-blue-400" },
  { id: "intermedio", label: "Ciclo Intermedio", sub: "Practicas 3-4: Colaborativo e Investigacion", color: "border-indigo-200 hover:border-indigo-400" },
  { id: "final", label: "Ciclo Final (Profesional)", sub: "Practicas 5-6: DUA + PIE completos", color: "border-green-200 hover:border-green-400" },
];

function RetroSeccion({ seccion }: { seccion: any }) {
  const colors: Record<string, string> = {
    excelente: "bg-green-50 border-green-200",
    buena: "bg-blue-50 border-blue-200",
    mejorar: "bg-yellow-50 border-yellow-200",
    insuficiente: "bg-red-50 border-red-200",
  };
  const badges: Record<string, string> = {
    excelente: "bg-green-100 text-green-800",
    buena: "bg-blue-100 text-blue-800",
    mejorar: "bg-yellow-100 text-yellow-800",
    insuficiente: "bg-red-100 text-red-800",
  };
  const ev = seccion.evaluacion || "buena";

  return (
    <div className={clsx("border rounded-2xl p-4 space-y-3", colors[ev] || colors.buena)}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold text-gray-900 text-sm">{seccion.seccion}</p>
        <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", badges[ev] || badges.buena)}>
          {ev}
        </span>
      </div>
      {seccion.fortalezas?.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-green-700 uppercase mb-1">Fortalezas</p>
          <ul className="space-y-0.5">
            {seccion.fortalezas.map((f: string, i: number) => (
              <li key={i} className="text-xs text-gray-700 flex gap-1.5"><span className="text-green-500 flex-shrink-0">+</span>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {seccion.areas_mejora?.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-orange-700 uppercase mb-1">Areas de mejora</p>
          <ul className="space-y-0.5">
            {seccion.areas_mejora.map((f: string, i: number) => (
              <li key={i} className="text-xs text-gray-700 flex gap-1.5"><span className="text-orange-500 flex-shrink-0">!</span>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {seccion.sugerencias?.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-blue-700 uppercase mb-1">Sugerencias</p>
          <ul className="space-y-0.5">
            {seccion.sugerencias.map((f: string, i: number) => (
              <li key={i} className="text-xs text-gray-700 flex gap-1.5"><span className="text-blue-500 flex-shrink-0">&#8594;</span>{f}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ChatbotPage() {
  const [fase, setFase] = useState<Fase>("upload");
  const [ciclo, setCiclo] = useState("final");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [preguntaActual, setPreguntaActual] = useState<any>(null);
  const [numPregunta, setNumPregunta] = useState(0);
  const [totalPreguntas, setTotalPreguntas] = useState(0);
  const [respuesta, setRespuesta] = useState("");
  const [mensajeRechazo, setMensajeRechazo] = useState<string[]>([]);
  const [retroalimentacion, setRetroalimentacion] = useState<RetroalimentacionFinal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (role: "bot" | "user", content: string) => {
    setMessages(m => [...m, { role, content, timestamp: new Date() }]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === "application/pdf") setArchivo(f);
  };

  const handleAnalizarPlanificacion = async () => {
    if (!archivo) { setError("Selecciona un archivo PDF primero."); return; }
    setLoading(true);
    setError("");
    setFase("verificando");
    setMessages([]);

    try {
      const res = await chatbotService.analizarPlanificacion(archivo, ciclo);
      const data: ChatSession = res.data;
      setSesionId(data.sesion_id);

      if (!data.pasa_verificacion) {
        // Rechazado
        setFase("rechazado");
        const faltantes = data.mensaje?.split("\n").filter(Boolean) || ["La planificacion no cumple con la estructura minima requerida."];
        setMensajeRechazo(faltantes);
        addMessage("bot", data.mensaje || "Tu planificacion no contiene todos los elementos minimos.");
      } else {
        // Pasa - mostrar primera pregunta
        setFase("preguntas");
        setTotalPreguntas(data.total_preguntas || 5);
        setNumPregunta(1);
        const pq = data.primera_pregunta;
        setPreguntaActual(pq);
        const intro = "Tu planificacion ha pasado la verificacion. Ahora responde las siguientes preguntas de reflexion pedagogica. Deben ser respuestas fundamentadas, no de una sola palabra.";
        addMessage("bot", intro);
        if (pq) addMessage("bot", `Pregunta 1/${data.total_preguntas}: ${pq.pregunta}`);
      }
    } catch (err: any) {
      setError("No se pudo conectar con el Chatbot (verifica que este corriendo en el puerto 8000 con GOOGLE_API_KEY).");
      setFase("upload");
    } finally {
      setLoading(false);
    }
  };

  const handleResponder = async () => {
    if (!respuesta.trim() || respuesta.trim().split(" ").length < 5) {
      setError("Escribe una respuesta mas completa (al menos 5 palabras).");
      return;
    }
    if (!sesionId) return;
    setLoading(true);
    setError("");

    addMessage("user", respuesta);
    const respGuardada = respuesta;
    setRespuesta("");

    try {
      const res = await chatbotService.responderPregunta(sesionId, respGuardada);
      const data: ChatSession = res.data;

      if (data.estado === "retroalimentacion" || data.retroalimentacion) {
        // Ir a retroalimentacion
        setFase("retroalimentacion");
        setRetroalimentacion(data.retroalimentacion);
        addMessage("bot", "Has completado todas las preguntas de reflexion. A continuacion tu retroalimentacion pedagogica:");
      } else if (data.siguiente_pregunta) {
        const pq = data.siguiente_pregunta;
        setPreguntaActual(pq);
        setNumPregunta(data.preguntas_completadas ? data.preguntas_completadas + 1 : numPregunta + 1);
        addMessage("bot", `Pregunta ${pq.numero}/${totalPreguntas}: ${pq.pregunta}`);
      }
    } catch (err: any) {
      setError("Error al enviar la respuesta. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4 pb-5 border-b border-gray-200">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2d8a4e] to-green-400 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Chatbot Pedagogico
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Sube tu planificacion para que la IA verifique los elementos minimos, te haga preguntas de reflexion y te retroalimente por seccion.
            </p>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800 space-y-1">
              <p className="font-bold">Como funciona el proceso:</p>
              <p>1. Sube el PDF de tu planificacion con OA, 3 momentos, DUA y caracterizacion del curso</p>
              <p>2. La IA verifica que tenga los elementos minimos obligatorios</p>
              <p>3. Si pasa: responde entre 1 y 5 preguntas de reflexion pedagogica</p>
              <p>4. Recibes retroalimentacion detallada por cada seccion de la pauta</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* FASE: Upload */}
        {fase === "upload" && (
          <div className="space-y-6">
            {/* Ciclo selector */}
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Ciclo de Practica</p>
              <div className="grid sm:grid-cols-3 gap-3">
                {CICLOS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCiclo(c.id)}
                    className={clsx(
                      "card rounded-2xl p-4 text-left border-2 transition-all",
                      ciclo === c.id ? "border-[#2d8a4e] bg-green-50 shadow-sm" : c.color
                    )}
                  >
                    <p className="font-bold text-sm text-gray-900">{c.label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{c.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* PDF Upload */}
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Planificacion (PDF)</p>
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onClick={() => fileRef.current?.click()}
                className={clsx(
                  "flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all",
                  dragging ? "border-[#2d8a4e] bg-green-50" :
                  archivo ? "border-green-400 bg-green-50" :
                  "border-gray-200 hover:border-[#2d8a4e]/50 hover:bg-gray-50"
                )}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={e => setArchivo(e.target.files?.[0] || null)}
                />
                {archivo ? (
                  <>
                    <FileText className="w-8 h-8 text-green-600 mb-2" />
                    <p className="font-bold text-green-800 text-sm">{archivo.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{(archivo.size / 1024).toFixed(0)} KB · Haz clic para cambiar</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="font-semibold text-gray-700 text-sm">Arrastra tu PDF aqui</p>
                    <p className="text-xs text-gray-400 mt-1">o haz clic para seleccionar</p>
                    <p className="text-[10px] text-gray-300 mt-1">Solo archivos PDF</p>
                  </>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAnalizarPlanificacion}
              disabled={!archivo || loading}
              className="btn-primary w-full py-3 font-bold text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              Analizar Planificacion con IA
            </button>
          </div>
        )}

        {/* FASE: Verificando */}
        {fase === "verificando" && (
          <div className="card rounded-2xl p-10 text-center">
            <Loader2 className="w-10 h-10 text-[#2d8a4e] animate-spin mx-auto mb-4" />
            <p className="font-bold text-gray-900">Analizando tu planificacion...</p>
            <p className="text-xs text-gray-500 mt-2">Verificando OA, 3 momentos, DUA, NEET/NEEP y evaluacion</p>
          </div>
        )}

        {/* FASE: Rechazado */}
        {fase === "rechazado" && (
          <div className="space-y-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-red-800 text-base">Planificacion rechazada</p>
                  <p className="text-xs text-red-600 mt-1">Tu planificacion no contiene todos los elementos minimos. Corrige los siguientes puntos antes de volver a enviar:</p>
                </div>
              </div>
              <ul className="space-y-2">
                {mensajeRechazo.map((m, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-red-800 bg-white rounded-xl p-3 border border-red-100">
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => { setFase("upload"); setMessages([]); setArchivo(null); setError(""); }}
              className="btn-primary w-full py-3 font-bold text-sm"
            >
              Subir planificacion corregida
            </button>
          </div>
        )}

        {/* FASE: Preguntas */}
        {fase === "preguntas" && (
          <div className="space-y-4">
            {/* Progress */}
            <div className="card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-700">Progreso de reflexion</p>
                <p className="text-xs text-gray-500">{numPregunta - 1}/{totalPreguntas} preguntas respondidas</p>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div
                  className="h-2 bg-gradient-to-r from-[#1e3a5f] to-[#2d8a4e] rounded-full transition-all"
                  style={{ width: `${((numPregunta - 1) / totalPreguntas) * 100}%` }}
                />
              </div>
            </div>

            {/* Chat messages */}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={clsx(
                    "rounded-2xl p-4 text-sm leading-relaxed",
                    m.role === "bot"
                      ? "bg-green-50 border border-green-100 text-gray-800"
                      : "bg-[#1e3a5f] text-white ml-8"
                  )}
                >
                  {m.role === "bot" && <p className="text-[10px] font-bold text-green-600 uppercase mb-1.5">Chatbot Pedagogico</p>}
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
                  <span className="text-sm text-gray-500">Procesando tu respuesta...</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {preguntaActual && !loading && (
              <div className="card rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Aspecto: {preguntaActual.aspecto?.replace(/_/g, " ")} · Pregunta {numPregunta}/{totalPreguntas}
                </div>
                <textarea
                  value={respuesta}
                  onChange={e => setRespuesta(e.target.value)}
                  rows={3}
                  placeholder="Escribe tu respuesta aqui (minimo 5 palabras)..."
                  className="input-field resize-none text-sm"
                  onKeyDown={e => { if (e.key === "Enter" && e.metaKey) handleResponder(); }}
                />
                <button
                  type="button"
                  onClick={handleResponder}
                  disabled={loading || !respuesta.trim()}
                  className="btn-primary w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Enviar respuesta
                </button>
              </div>
            )}
          </div>
        )}

        {/* FASE: Retroalimentacion */}
        {fase === "retroalimentacion" && retroalimentacion && (
          <div className="space-y-5">
            {/* Summary header */}
            <div className={clsx(
              "card rounded-2xl p-6 border-2",
              retroalimentacion.puede_ir_al_colegio ? "border-green-300 bg-green-50" : "border-yellow-300 bg-yellow-50"
            )}>
              <div className="flex items-start gap-4">
                {retroalimentacion.puede_ir_al_colegio
                  ? <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                  : <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0" />}
                <div>
                  <p className={clsx("font-bold text-lg", retroalimentacion.puede_ir_al_colegio ? "text-green-800" : "text-yellow-800")}>
                    {retroalimentacion.puede_ir_al_colegio
                      ? "Planificacion aprobada para ejecucion en aula"
                      : "Requiere ajustes antes de ir al colegio"}
                  </p>
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">{retroalimentacion.diagnostico_general}</p>
                  <div className="mt-3">
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      { muy_buena: "bg-green-100 text-green-800", buena: "bg-blue-100 text-blue-800", regular: "bg-yellow-100 text-yellow-800", insuficiente: "bg-red-100 text-red-800" }[retroalimentacion.nivel_planificacion] || "bg-gray-100 text-gray-700"
                    )}>
                      Nivel: {retroalimentacion.nivel_planificacion?.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Secciones */}
            {retroalimentacion.secciones?.map((s: any, i: number) => (
              <RetroSeccion key={i} seccion={s} />
            ))}

            {/* Recomendaciones */}
            {retroalimentacion.recomendaciones_prioritarias?.length > 0 && (
              <div className="card rounded-2xl p-5 bg-[#1e3a5f]/5 border border-[#1e3a5f]/10">
                <p className="font-bold text-[#1e3a5f] text-sm mb-3">3 Acciones Prioritarias para tu proxima planificacion:</p>
                <ol className="space-y-2">
                  {retroalimentacion.recomendaciones_prioritarias.map((r: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-800">
                      <span className="w-5 h-5 rounded-full bg-[#1e3a5f] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      {r}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Note for profesor */}
            {retroalimentacion.observaciones_para_profesor && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Nota visible para el Profesor Tutor</p>
                <p className="text-sm text-gray-700 italic">{retroalimentacion.observaciones_para_profesor}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => { setFase("upload"); setArchivo(null); setMessages([]); setRetroalimentacion(null); setSesionId(null); }}
              className="btn-secondary w-full py-3 text-sm font-bold"
            >
              Analizar otra planificacion
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}