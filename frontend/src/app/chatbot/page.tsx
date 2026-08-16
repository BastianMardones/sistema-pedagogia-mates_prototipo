"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { chatbotService } from "@/lib/api";
import {
  Upload,
  FileText,
  Send,
  Bot,
  User,
  CheckCircle,
  XCircle,
  ChevronRight,
  RotateCcw,
  Star,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  AlertTriangle,
  Download,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award,
  HelpCircle,
} from "lucide-react";
import { ChatMessage, Retroalimentacion, RetroalimentacionSeccion } from "@/types";
import clsx from "clsx";
import { useDropzone } from "react-dropzone";

type Stage = "upload" | "analyzing" | "chatting" | "feedback";

// ─── Feedback Section Card ───────────────────────────────────────────────────
function SectionCard({ section, index }: { section: any; index: number }) {
  const [expanded, setExpanded] = useState(true);
  const seccionNombre = section.seccion || section.nombre || `Sección ${index + 1}`;
  const evaluacion = section.evaluacion || "buena";
  
  const isPositive = evaluacion === "excelente" || evaluacion === "buena";
  const badgeColor = evaluacion === "excelente" ? "bg-green-100 text-green-800" : evaluacion === "buena" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800";

  const fortalezas = section.fortalezas || [];
  const mejoras = section.areas_mejora || section.mejoras || [];
  const sugerencias = section.sugerencias || [];

  return (
    <div className="card border border-gray-100 p-0 overflow-hidden shadow-xs rounded-2xl">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50/70 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1e3a5f] flex items-center justify-center font-bold text-xs">
            {index + 1}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{seccionNombre}</p>
            <span className={clsx("inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1", badgeColor)}>
              {evaluacion}
            </span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-5 space-y-4 bg-gray-50/30">
          {fortalezas.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#2d8a4e] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Fortalezas identificadas
              </p>
              <ul className="space-y-1.5">
                {fortalezas.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2d8a4e] mt-1.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {mejoras.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" /> Oportunidades de mejora
              </p>
              <ul className="space-y-1.5">
                {mejoras.map((m: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sugerencias.length > 0 && (
            <div className="bg-blue-50/60 rounded-xl p-3.5 border border-blue-100">
              <p className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wider mb-1.5">
                💡 Sugerencia pedagógica para el aula:
              </p>
              <ul className="space-y-1">
                {sugerencias.map((s: string, i: number) => (
                  <li key={i} className="text-xs text-blue-900 leading-relaxed">
                    • {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Feedback View ────────────────────────────────────────────────────────────
function FeedbackView({ retro, onRestart }: { retro: any; onRestart: () => void }) {
  const diagnostico = retro.diagnostico_general || retro.resumen || "Retroalimentación generada exitosamente.";
  const nivelPlanif = retro.nivel_planificacion || "buena";
  const puedeIr = retro.puede_ir_al_colegio ?? true;
  const secciones = retro.secciones || [];
  const recomendaciones = retro.recomendaciones_prioritarias || retro.recomendaciones || [];
  const obsProfesor = retro.observaciones_para_profesor || "";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero card */}
      <div className="card bg-gradient-to-br from-[#1e3a5f] via-[#2a4f7c] to-[#152b47] text-white p-7 rounded-3xl shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold backdrop-blur">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Dictamen Pedagógico de la IA
          </div>
          <span
            className={clsx(
              "px-3 py-1 rounded-full text-xs font-bold shadow-sm",
              puedeIr ? "bg-[#2d8a4e] text-white" : "bg-amber-500 text-white"
            )}
          >
            {puedeIr ? "✓ Apta para presentar al profesor" : "⚠ Requiere ajustes antes de autorizar"}
          </span>
        </div>

        <h2 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
          Nivel de Planificación: <span className="capitalize text-yellow-300">{nivelPlanif.replace("_", " ")}</span>
        </h2>

        <p className="text-blue-100 text-sm leading-relaxed max-w-3xl">
          {diagnostico}
        </p>

        {obsProfesor && (
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 text-xs text-blue-200">
            <strong className="text-white">Nota para el profesor de asignatura:</strong> {obsProfesor}
          </div>
        )}
      </div>

      {/* Sections */}
      {secciones.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#1e3a5f]" />
            Evaluación por Momentos y Criterios DUA / PIE
          </h3>
          <div className="space-y-3">
            {secciones.map((s: any, i: number) => (
              <SectionCard key={i} section={s} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Priority Recommendations */}
      {recomendaciones.length > 0 && (
        <div className="card bg-amber-50/70 border border-amber-200 p-6 rounded-2xl space-y-3">
          <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-600" />
            Acciones Prioritarias antes de entrar a la sala de clases:
          </h3>
          <ul className="space-y-2">
            {recomendaciones.map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-amber-950">
                <ChevronRight className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onRestart} className="btn-secondary flex items-center gap-2 text-xs font-bold">
          <RotateCcw className="w-4 h-4" />
          Evaluar otra planificación
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ChatbotPage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [nivel, setNivel] = useState("avanzado");
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(4);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [retro, setRetro] = useState<any>(null);
  const [error, setError] = useState("");
  const [loadingSample, setLoadingSample] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      setFile(accepted[0]);
      setError("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
    onDropRejected: (files) => {
      const err = files[0]?.errors[0];
      if (err?.code === "file-too-large") setError("El archivo no puede superar 20MB.");
      else if (err?.code === "file-invalid-type") setError("Solo se aceptan archivos PDF.");
      else setError("Archivo no válido.");
    },
  });

  const handleLoadSample = async () => {
    setLoadingSample(true);
    setError("");
    try {
      const response = await fetch("/ejemplo_planificacion_matematica.pdf");
      const blob = await response.blob();
      const sampleFile = new File([blob], "Planificacion_Matematica_1Medio_Ecuaciones.pdf", {
        type: "application/pdf",
      });
      setFile(sampleFile);
    } catch (err) {
      setError("No se pudo cargar el archivo de ejemplo.");
    } finally {
      setLoadingSample(false);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setStage("analyzing");
    setError("");

    try {
      const res = await chatbotService.analizarPlanificacion(file, nivel);
      const data = res.data;

      setSesionId(data.sesion_id);

      if (!data.pasa_verificacion) {
        setError(data.mensaje || "La planificación no cumple los elementos mínimos.");
        setStage("upload");
        return;
      }

      const primeraPregunta = data.primera_pregunta;
      setCurrentQuestionNumber(1);

      setMessages([
        {
          role: "bot",
          content: `👋 **¡Planificación recibida!** He verificado tu documento *"${file.name}"* y cuenta con los elementos estructurales mínimos.\n\nPara profundizar en tus decisiones didácticas antes de darte la retroalimentación completa, te haré una serie de preguntas de reflexión:`,
          timestamp: new Date(),
        },
        {
          role: "bot",
          content: primeraPregunta ? `📌 **Pregunta 1 (${primeraPregunta.aspecto}):**\n${primeraPregunta.pregunta}` : "Por favor, explica las decisiones pedagógicas principales de tu clase.",
          timestamp: new Date(),
        },
      ]);

      setStage("chatting");
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "No se pudo conectar con el Chatbot (verifique que esté corriendo en el puerto 8000 con GOOGLE_API_KEY).";
      setError(msg);
      setStage("upload");
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !sesionId || sending) return;

    const userText = inputValue;
    const userMsg: ChatMessage = {
      role: "user",
      content: userText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setSending(true);

    try {
      const res = await chatbotService.responderPregunta(sesionId, userText);
      const data = res.data;

      if (data.estado === "retroalimentacion" || data.estado === "completada" || data.retroalimentacion) {
        setRetro(data.retroalimentacion);
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content: "🎉 **¡Excelente reflexión!** Has completado las preguntas requeridas. He generado tu dictamen y retroalimentación final:",
            timestamp: new Date(),
          },
        ]);
        setStage("feedback");
      } else {
        const nextQ = data.siguiente_pregunta;
        setCurrentQuestionNumber(data.preguntas_completadas ? data.preguntas_completadas + 1 : currentQuestionNumber + 1);
        setTotalQuestions(data.total_preguntas || 4);

        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content: nextQ
              ? `${data.mensaje}\n\n📌 **Pregunta ${nextQ.numero} (${nextQ.aspecto}):**\n${nextQ.pregunta}`
              : data.mensaje || "Siguiente pregunta de reflexión...",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "⚠️ Hubo un problema al evaluar la respuesta. Asegúrate de dar una respuesta reflexiva y fundamentada pedagógicamente.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRestart = () => {
    setStage("upload");
    setFile(null);
    setMessages([]);
    setSesionId(null);
    setRetro(null);
    setError("");
    setCurrentQuestionNumber(1);
    setInputValue("");
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1e3a5f] text-xs font-bold mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2d8a4e]" />
              Tutor Inteligente de Práctica
            </div>
            <h1
              className="text-3xl font-bold text-[#1e3a5f]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Chatbot de Retroalimentación Pedagógica
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              Sube tu planificación de clase (PDF) y reflexiona con la IA para perfeccionarla antes de entrar al aula.
            </p>
          </div>
        </div>

        {/* ── STAGE: UPLOAD ─────────────────────────────────────────────────── */}
        {(stage === "upload" || stage === "analyzing") && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Drop zone */}
            <div
              {...getRootProps()}
              className={clsx(
                "border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 bg-white shadow-xs",
                isDragActive
                  ? "border-[#1e3a5f] bg-blue-50/80 scale-[1.01]"
                  : file
                  ? "border-[#2d8a4e] bg-green-50/50"
                  : "border-gray-300 hover:border-[#1e3a5f] hover:bg-gray-50/60"
              )}
            >
              <input {...getInputProps()} />

              {file ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-3">
                    <FileText className="w-8 h-8 text-[#2d8a4e]" />
                  </div>
                  <p className="font-bold text-gray-900 text-base">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(file.size / 1024).toFixed(1)} KB · Archivo PDF
                  </p>
                  <span className="inline-block text-xs text-[#2d8a4e] mt-3 font-semibold bg-green-100 px-3 py-1 rounded-full">
                    ✓ Documento listo para análisis
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div
                    className={clsx(
                      "w-16 h-16 rounded-2xl flex items-center justify-center mb-3 transition-colors",
                      isDragActive ? "bg-blue-100" : "bg-blue-50 text-[#1e3a5f]"
                    )}
                  >
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-gray-800 text-lg">
                    {isDragActive ? "Suelta el archivo aquí" : "Arrastra tu planificación en PDF"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    o haz clic aquí para seleccionar desde tu computador
                  </p>
                </div>
              )}
            </div>

            {/* Quick Sample Button */}
            {!file && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  disabled={loadingSample}
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#1e3a5f] hover:text-[#2d8a4e] bg-white border border-gray-200 hover:border-[#2d8a4e] px-4 py-2 rounded-xl shadow-xs transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#2d8a4e]" />
                  {loadingSample ? "Cargando ejemplo..." : "📄 Probar con Planificación de Ejemplo (Ecuaciones Lineales 1° Medio)"}
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Ciclo de Práctica Selector */}
            <div className="card rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Ciclo de Práctica (Nivel de Exigencia)
              </label>
              <select
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
                className="input-field text-sm font-medium"
              >
                <option value="avanzado">Ciclo Final (Práctica Pedagógica y Profesional) — Exige DUA y PIE completos</option>
                <option value="intermedio">Ciclo Intermedio (Práctica 3 y 4: Trabajo Colaborativo e Investigación)</option>
                <option value="inicial">Ciclo Inicial (Práctica 1 y 2: Aproximación y Ambientes)</option>
              </select>
              <p className="text-[11px] text-gray-400">
                La IA adaptará las preguntas y la severidad de la retroalimentación según el año formativo del estudiante.
              </p>
            </div>

            {/* Submit button */}
            <button
              onClick={handleAnalyze}
              disabled={!file || stage === "analyzing"}
              className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              {stage === "analyzing" ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Verificando elementos mínimos y generando preguntas...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Iniciar Evaluación con IA
                </>
              )}
            </button>
          </div>
        )}

        {/* ── STAGE: CHATTING ───────────────────────────────────────────────── */}
        {stage === "chatting" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Progress header */}
            <div className="card rounded-2xl p-4 bg-white border border-gray-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wider">
                  Etapa de Reflexión Pedagógica
                </span>
                <p className="text-xs text-gray-500">
                  Responde a las preguntas de la IA para desbloquear la retroalimentación.
                </p>
              </div>
              <span className="text-xs font-bold bg-blue-50 text-[#1e3a5f] px-3 py-1.5 rounded-lg">
                Pregunta {currentQuestionNumber} de {totalQuestions}
              </span>
            </div>

            {/* Messages box */}
            <div className="card rounded-3xl p-5 bg-gray-50/50 border border-gray-200 h-[480px] overflow-y-auto space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={clsx(
                    "flex gap-3 max-w-3xl",
                    m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div
                    className={clsx(
                      "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs",
                      m.role === "user" ? "bg-[#2d8a4e] text-white" : "bg-[#1e3a5f] text-white"
                    )}
                  >
                    {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={clsx(
                      "rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs",
                      m.role === "user"
                        ? "bg-[#1e3a5f] text-white rounded-tr-none"
                        : "bg-white text-gray-800 border border-gray-200/80 rounded-tl-none whitespace-pre-wrap"
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                placeholder="Escribe tu reflexión pedagógica y presiona Enter..."
                className="input-field flex-1 text-xs sm:text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || sending}
                className="btn-primary px-5 flex items-center justify-center"
              >
                {sending ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE: FEEDBACK ───────────────────────────────────────────────── */}
        {stage === "feedback" && retro && (
          <FeedbackView retro={retro} onRestart={handleRestart} />
        )}
      </div>
    </AppLayout>
  );
}
