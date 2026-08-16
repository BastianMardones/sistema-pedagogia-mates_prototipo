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
} from "lucide-react";
import { ChatMessage, ChatSession, Retroalimentacion, RetroalimentacionSeccion } from "@/types";
import clsx from "clsx";
import { useDropzone } from "react-dropzone";

type Stage = "upload" | "analyzing" | "chatting" | "feedback";

// ─── Feedback Section Card ───────────────────────────────────────────────────
function SectionCard({ section, index }: { section: RetroalimentacionSeccion; index: number }) {
  const [expanded, setExpanded] = useState(true);
  const pct = Math.round((section.puntaje / section.maximo) * 100);
  const color = pct >= 80 ? "bg-[#2d8a4e]" : pct >= 60 ? "bg-yellow-500" : "bg-red-500";
  const textColor = pct >= 80 ? "text-[#2d8a4e]" : pct >= 60 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="card border border-gray-100 p-0 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 hover:bg-gray-50/60 transition-colors text-left"
      >
        <div className={`w-8 h-8 rounded-full ${pct >= 80 ? "bg-green-100" : pct >= 60 ? "bg-yellow-100" : "bg-red-100"} flex items-center justify-center flex-shrink-0 text-sm font-bold ${textColor}`}>
          {index + 1}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-800 text-sm">{section.nombre}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex-1 h-2 bg-gray-100 rounded-full">
              <div
                className={`h-2 rounded-full transition-all duration-700 ${color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${textColor} w-14 text-right`}>
              {section.puntaje}/{section.maximo} pts
            </span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-5 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">{section.comentario}</p>

          {section.fortalezas?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#2d8a4e] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Fortalezas
              </p>
              <ul className="space-y-1.5">
                {section.fortalezas.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2d8a4e] mt-2 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {section.mejoras?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" /> Oportunidades de mejora
              </p>
              <ul className="space-y-1.5">
                {section.mejoras.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                    {m}
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
function FeedbackView({ retro, onRestart }: { retro: Retroalimentacion; onRestart: () => void }) {
  const pct = retro.porcentaje ?? Math.round((retro.puntaje_total / retro.puntaje_maximo) * 100);
  const nivelColor =
    pct >= 80 ? "text-[#2d8a4e]" : pct >= 60 ? "text-yellow-600" : "text-red-600";
  const nivelBg =
    pct >= 80 ? "bg-green-50 border-green-200" : pct >= 60 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200";

  // Gauge arc
  const radius = 56;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ * 0.75;
  const gaugeColor = pct >= 80 ? "#2d8a4e" : pct >= 60 ? "#d97706" : "#dc2626";

  return (
    <div className="space-y-6">
      {/* Score hero */}
      <div className={`card border-2 ${nivelBg} flex flex-col sm:flex-row items-center gap-6`}>
        {/* Gauge */}
        <div className="relative w-36 h-36 flex-shrink-0">
          <svg viewBox="0 0 140 140" className="w-full h-full -rotate-[135deg]">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeLinecap="round" />
            <circle
              cx="70" cy="70" r={radius} fill="none" stroke={gaugeColor}
              strokeWidth="12"
              strokeDasharray={`${(pct / 100) * circ * 0.75} ${circ}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 1s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${nivelColor}`}>{pct}%</span>
            <span className="text-xs text-gray-400 mt-0.5">logro</span>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
            Retroalimentación completa
          </h2>
          <p className={`text-lg font-semibold mt-1 ${nivelColor}`}>
            {retro.nivel_logro}
          </p>
          <p className="text-gray-600 text-sm mt-2 leading-relaxed">{retro.resumen}</p>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="text-gray-500">
              Puntaje: <strong>{retro.puntaje_total}/{retro.puntaje_maximo}</strong>
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">
              Secciones evaluadas: <strong>{retro.secciones?.length ?? 0}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Sections */}
      {retro.secciones?.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#1e3a5f]" />
            Evaluación por secciones
          </h3>
          <div className="space-y-3">
            {retro.secciones.map((s, i) => (
              <SectionCard key={i} section={s} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {retro.recomendaciones?.length > 0 && (
        <div className="card bg-gradient-to-br from-[#1e3a5f] to-[#2a4f7c] text-white">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-300" />
            Recomendaciones finales
          </h3>
          <ul className="space-y-2">
            {retro.recomendaciones.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-blue-100">
                <ChevronRight className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button onClick={onRestart} className="btn-secondary flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          Nueva planificación
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ChatbotPage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [nivel, setNivel] = useState("PRIMERO");
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [totalQuestions] = useState(5);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [retro, setRetro] = useState<Retroalimentacion | null>(null);
  const [error, setError] = useState("");
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
    maxSize: 20 * 1024 * 1024, // 20MB
    onDropRejected: (files) => {
      const err = files[0]?.errors[0];
      if (err?.code === "file-too-large") setError("El archivo no puede superar 20MB.");
      else if (err?.code === "file-invalid-type") setError("Solo se aceptan archivos PDF.");
      else setError("Archivo no válido.");
    },
  });

  const handleAnalyze = async () => {
    if (!file) return;
    setStage("analyzing");
    setError("");

    try {
      const res = await chatbotService.analizarPlanificacion(file, nivel);
      const data: ChatSession = res.data;

      setSesionId(data.sesion_id);
      setCurrentQuestion(data.pregunta_actual ?? 1);

      const botMsg: ChatMessage = {
        role: "bot",
        content:
          data.pregunta ||
          data.mensaje ||
          "He analizado tu planificación. Comencemos con las preguntas de reflexión.",
        timestamp: new Date(),
      };

      setMessages([
        {
          role: "bot",
          content: `¡Hola! He recibido tu planificación **"${file.name}"**. Voy a hacerte ${totalQuestions} preguntas de reflexión para ayudarte a mejorarla.`,
          timestamp: new Date(),
        },
        botMsg,
      ]);

      setStage("chatting");
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "No se pudo analizar la planificación. Verifique que el PDF sea válido.";
      setError(msg);
      setStage("upload");
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !sesionId || sending) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setSending(true);

    try {
      const res = await chatbotService.responderPregunta(sesionId, inputValue);
      const data: ChatSession = res.data;

      if (data.estado === "completado") {
        // Fetch retroalimentacion
        const retroRes = await chatbotService.getRetroalimentacion(sesionId);
        setRetro(retroRes.data);

        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content:
              "¡Excelente! Has completado todas las preguntas de reflexión. Aquí tienes tu retroalimentación completa:",
            timestamp: new Date(),
          },
        ]);
        setStage("feedback");
      } else {
        setCurrentQuestion(data.pregunta_actual ?? currentQuestion + 1);
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content: data.pregunta || data.mensaje || "¿Puedes contarme más sobre este aspecto?",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "Hubo un error al procesar tu respuesta. Por favor intenta nuevamente.",
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
    setCurrentQuestion(1);
    setInputValue("");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-3xl font-bold text-[#1e3a5f]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Asistente de Planificación IA
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Sube tu planificación en PDF y recibe retroalimentación personalizada
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center mb-8">
          {[
            { key: "upload", label: "Subir PDF", num: 1 },
            { key: "chatting", label: "Reflexión", num: 2 },
            { key: "feedback", label: "Retroalimentación", num: 3 },
          ].map((step, i) => {
            const isActive =
              stage === step.key ||
              (stage === "analyzing" && step.key === "upload");
            const isDone =
              (step.key === "upload" && (stage === "chatting" || stage === "feedback")) ||
              (step.key === "chatting" && stage === "feedback");
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={clsx(
                      "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                      isDone
                        ? "bg-[#2d8a4e] text-white"
                        : isActive
                        ? "bg-[#1e3a5f] text-white ring-4 ring-[#1e3a5f]/20"
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {isDone ? <CheckCircle className="w-5 h-5" /> : step.num}
                  </div>
                  <span
                    className={clsx(
                      "text-xs mt-1.5 font-medium hidden sm:block",
                      isActive ? "text-[#1e3a5f]" : isDone ? "text-[#2d8a4e]" : "text-gray-400"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    className={clsx(
                      "flex-1 h-0.5 mx-2 transition-colors duration-300",
                      isDone ? "bg-[#2d8a4e]" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ── STAGE: UPLOAD ─────────────────────────────────────────────────── */}
        {(stage === "upload" || stage === "analyzing") && (
          <div className="space-y-6">
            {/* Drop zone */}
            <div
              {...getRootProps()}
              className={clsx(
                "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200",
                isDragActive
                  ? "border-[#1e3a5f] bg-blue-50/80 scale-[1.01]"
                  : file
                  ? "border-[#2d8a4e] bg-green-50/60"
                  : "border-gray-200 hover:border-[#1e3a5f]/50 hover:bg-gray-50"
              )}
            >
              <input {...getInputProps()} />

              {file ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-[#2d8a4e]" />
                  </div>
                  <p className="font-semibold text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB · PDF
                  </p>
                  <p className="text-xs text-[#2d8a4e] mt-2 font-medium">
                    ✓ Archivo listo · Haz clic para cambiar
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div
                    className={clsx(
                      "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                      isDragActive ? "bg-blue-100" : "bg-gray-100"
                    )}
                  >
                    <Upload
                      className={clsx(
                        "w-8 h-8 transition-colors",
                        isDragActive ? "text-[#1e3a5f]" : "text-gray-400"
                      )}
                    />
                  </div>
                  <p className="font-semibold text-gray-700 text-lg">
                    {isDragActive
                      ? "Suelta el PDF aquí"
                      : "Arrastra tu planificación aquí"}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    o haz clic para seleccionar un archivo PDF
                  </p>
                  <p className="text-xs text-gray-300 mt-3">Máximo 20 MB</p>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Settings */}
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel del curso
              </label>
              <select
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
                className="input-field sm:max-w-xs"
              >
                <option value="PRIMERO">1° año de Enseñanza Media</option>
                <option value="SEGUNDO">2° año de Enseñanza Media</option>
                <option value="TERCERO">3° año de Enseñanza Media</option>
                <option value="CUARTO">4° año de Enseñanza Media</option>
                <option value="BASICA_5">5° año Básico</option>
                <option value="BASICA_6">6° año Básico</option>
                <option value="BASICA_7">7° año Básico</option>
                <option value="BASICA_8">8° año Básico</option>
              </select>
              <p className="text-xs text-gray-400 mt-2">
                El asistente adaptará la retroalimentación al nivel seleccionado
              </p>
            </div>

            {/* Submit */}
            <button
              onClick={handleAnalyze}
              disabled={!file || stage === "analyzing"}
              className="btn-primary w-full py-4 text-base flex items-center justify-center gap-3"
            >
              {stage === "analyzing" ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Analizando planificación...
                </>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5" />
                  Iniciar análisis con IA
                </>
              )}
            </button>

            {/* How it works */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: Upload, label: "1. Sube el PDF", desc: "Tu planificación en formato PDF" },
                { icon: MessageSquare, label: "2. Reflexión guiada", desc: "Responde 5 preguntas sobre tu diseño" },
                { icon: Star, label: "3. Retroalimentación", desc: "Recibe feedback detallado por sección" },
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.label} className="card text-center py-5">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-5 h-5 text-[#1e3a5f]" />
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">{step.label}</p>
                    <p className="text-xs text-gray-400 mt-1">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STAGE: CHATTING ───────────────────────────────────────────────── */}
        {stage === "chatting" && (
          <div className="flex flex-col" style={{ height: "calc(100vh - 240px)", minHeight: "520px" }}>
            {/* Progress bar */}
            <div className="card mb-4 py-3 px-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Pregunta {Math.min(currentQuestion, totalQuestions)} de {totalQuestions}
                </span>
                <span className="text-xs text-gray-400">
                  {Math.round((Math.min(currentQuestion, totalQuestions) / totalQuestions) * 100)}% completado
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1e3a5f] to-[#2d8a4e] rounded-full transition-all duration-700"
                  style={{
                    width: `${(Math.min(currentQuestion, totalQuestions) / totalQuestions) * 100}%`,
                  }}
                />
              </div>
              <div className="flex gap-1 mt-2">
                {Array.from({ length: totalQuestions }).map((_, i) => (
                  <div
                    key={i}
                    className={clsx(
                      "flex-1 h-1.5 rounded-full transition-all duration-500",
                      i < currentQuestion - 1
                        ? "bg-[#2d8a4e]"
                        : i === currentQuestion - 1
                        ? "bg-[#1e3a5f] animate-pulse"
                        : "bg-gray-100"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* File indicator */}
            <div className="flex items-center gap-2 px-1 mb-3">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-400 truncate">{file?.name}</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4 pr-1 pb-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={clsx(
                    "flex gap-3 items-end",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={clsx(
                      "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center",
                      msg.role === "bot"
                        ? "bg-[#1e3a5f]"
                        : "bg-[#2d8a4e]"
                    )}
                  >
                    {msg.role === "bot" ? (
                      <Bot className="w-4 h-4 text-white" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={clsx(
                      "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      msg.role === "bot"
                        ? "bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm"
                        : "bg-[#1e3a5f] text-white rounded-tr-sm"
                    )}
                  >
                    {msg.content.split("**").map((part, j) =>
                      j % 2 === 1 ? (
                        <strong key={j}>{part}</strong>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                    {msg.timestamp && (
                      <p
                        className={clsx(
                          "text-[10px] mt-1.5",
                          msg.role === "bot" ? "text-gray-400" : "text-white/50"
                        )}
                      >
                        {msg.timestamp.toLocaleTimeString("es-CL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {sending && (
                <div className="flex gap-3 items-end">
                  <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="card py-3 px-4 mt-3 flex items-end gap-3">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu respuesta aquí... (Enter para enviar)"
                rows={2}
                disabled={sending}
                className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 focus:outline-none leading-relaxed disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || sending}
                className="btn-primary p-2.5 flex-shrink-0 rounded-xl disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              Shift+Enter para nueva línea · Enter para enviar
            </p>
          </div>
        )}

        {/* ── STAGE: FEEDBACK ───────────────────────────────────────────────── */}
        {stage === "feedback" && retro && (
          <div className="space-y-4">
            {/* Transition message from chat */}
            <div className="flex gap-3 items-end mb-2">
              <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-800 max-w-lg">
                ¡Excelente reflexión! Has completado las {totalQuestions} preguntas. Aquí está tu retroalimentación completa:
              </div>
            </div>

            <FeedbackView retro={retro} onRestart={handleRestart} />
          </div>
        )}

        {/* Feedback without retro data (loading) */}
        {stage === "feedback" && !retro && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500">Generando retroalimentación...</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
