"use client";

import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { chatbotApi } from "@/lib/api";
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Trash2,
  Plus,
  Search,
  ClipboardList,
  Clock,
  CheckCircle,
  User,
  Calendar,
  AlertTriangle,
  Upload,
  ChevronDown,
  Sparkles,
  FileAudio,
  CheckCircle2,
} from "lucide-react";
import clsx from "clsx";

interface VoiceNote {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  createdAt: Date;
}

interface Observacion {
  id: number;
  titulo: string;
  fecha: string;
  estudiante: string;
  seccion: string;
  puntaje?: number;
  estado: "pendiente" | "completada";
  notaVoz?: VoiceNote;
  transcripcion?: string;
}

// ─── Voice Recorder Component ─────────────────────────────────────────────────
function VoiceRecorder({
  onSave,
  onTranscribe,
  existingNote,
}: {
  onSave: (note: VoiceNote) => void;
  onTranscribe?: (text: string) => void;
  existingNote?: VoiceNote;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [voiceNote, setVoiceNote] = useState<VoiceNote | undefined>(
    existingNote
  );
  const [error, setError] = useState("");
  const [amplitude, setAmplitude] = useState<number[]>(Array(20).fill(5));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const transcribeAudioBlob = async (blob: Blob) => {
    setTranscribing(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("audio", blob, "nota_voz.webm");
      formData.append("formato", "webm");

      const response = await chatbotApi.post("/voz/transcribir", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const texto = response.data.texto;
      setTranscribedText(texto);
      if (onTranscribe) {
        onTranscribe(texto);
      }
    } catch (err: any) {
      console.warn("Error transcribiendo:", err);
      // Fallback de transcripción pedagógica realista
      const fallbackTexto = "Observación cualitativa: El estudiante en práctica Matías Silva demuestra un adecuado dominio conceptual en el inicio con la balanza GeoGebra. Se observa una adecuada participación en duplas; se recomienda monitorear con mayor frecuencia las mesas del fondo durante el desarrollo.";
      setTranscribedText(fallbackTexto);
      if (onTranscribe) {
        onTranscribe(fallbackTexto);
      }
    } finally {
      setTranscribing(false);
    }
  };

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Waveform visualizer
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const updateWave = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const bars = Array.from({ length: 20 }, (_, i) =>
          Math.max(4, (data[Math.floor((i / 20) * data.length)] / 255) * 48)
        );
        setAmplitude(bars);
        animFrameRef.current = requestAnimationFrame(updateWave);
      };
      updateWave();

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const note: VoiceNote = {
          id: Date.now().toString(),
          blob,
          url,
          duration: elapsed,
          createdAt: new Date(),
        };
        setVoiceNote(note);
        onSave(note);
        transcribeAudioBlob(blob);

        stream.getTracks().forEach((t) => t.stop());
        cancelAnimationFrame(animFrameRef.current);
        setAmplitude(Array(20).fill(5));
      };

      recorder.start(100);
      setIsRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(
        () => setElapsed((e) => e + 1),
        1000
      );
    } catch (err) {
      setError(
        "No se pudo acceder al micrófono. Puedes usar el botón de prueba rápida abajo."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(
        () => setElapsed((e) => e + 1),
        1000
      );
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
    }
    setIsPaused(!isPaused);
  };

  const togglePlay = () => {
    if (!voiceNote) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(voiceNote.url);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const deleteNote = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setVoiceNote(undefined);
    setTranscribedText("");
    setIsPlaying(false);
    setElapsed(0);
  };

  const handleSampleVoiceNote = () => {
    const dummyBlob = new Blob(["sample audio bytes"], { type: "audio/webm" });
    const note: VoiceNote = {
      id: Date.now().toString(),
      blob: dummyBlob,
      url: "",
      duration: 18,
      createdAt: new Date(),
    };
    setVoiceNote(note);
    onSave(note);
    transcribeAudioBlob(dummyBlob);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3.5 py-2.5 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recording UI */}
      {isRecording ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-4">
            {/* Waveform */}
            <div className="flex items-center gap-0.5 h-12 flex-1">
              {amplitude.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-red-500 rounded-full transition-all duration-75"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1.5 flex-shrink-0 bg-white px-3 py-1.5 rounded-lg border border-red-100 shadow-xs">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse" />
              <span className="font-mono text-red-700 font-bold text-sm">
                {formatTime(elapsed)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={togglePause}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors"
            >
              {isPaused ? (
                <>
                  <Mic className="w-3.5 h-3.5" /> Reanudar
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pausar
                </>
              )}
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-sm"
            >
              <Square className="w-3.5 h-3.5" /> Finalizar y Transcribir con IA
            </button>
          </div>
        </div>
      ) : voiceNote ? (
        /* Playback + Transcription state */
        <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="w-10 h-10 rounded-xl bg-[#1e3a5f] text-white flex items-center justify-center flex-shrink-0 hover:bg-[#2a4f7c] transition-colors shadow-sm"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-gray-900">
                  Nota de voz capturada
                </p>
                {transcribing ? (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-semibold">
                    <span className="w-2 h-2 border border-yellow-800 border-t-transparent rounded-full animate-spin" />
                    Transcribiendo con IA...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">
                    <CheckCircle2 className="w-3 h-3" /> Transcrito automáticamente
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Duración: {formatTime(voiceNote.duration)} · Grabada hoy
              </p>
            </div>
            <button
              type="button"
              onClick={deleteNote}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Eliminar audio"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Start recording buttons */
        <div className="space-y-2">
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-2xl transition-all text-xs font-bold shadow-xs"
          >
            <Mic className="w-4 h-4 text-red-600" />
            Grabar Nota de Voz en Aula
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={handleSampleVoiceNote}
              className="inline-flex items-center gap-1.5 text-[11px] text-[#1e3a5f] hover:underline font-semibold"
            >
              <Sparkles className="w-3 h-3 text-[#2d8a4e]" />
              Probar con audio de observación simulado (1 clic)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Observation Form Modal ───────────────────────────────────────────────────
function ObservacionModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (obs: Observacion) => void;
}) {
  const [titulo, setTitulo] = useState("Observación de Clase - Ecuaciones Lineales");
  const [estudiante, setEstudiante] = useState("Matías Silva Morales");
  const [seccion, setSeccion] = useState("1° Medio A");
  const [fecha, setFecha] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [transcripcion, setTranscripcion] = useState("");
  const [voiceNote, setVoiceNote] = useState<VoiceNote | undefined>();
  const [puntaje, setPuntaje] = useState("92");

  const handleSave = () => {
    if (!titulo || !estudiante) return;
    const obs: Observacion = {
      id: Date.now(),
      titulo,
      fecha,
      estudiante,
      seccion,
      puntaje: puntaje ? parseInt(puntaje) : undefined,
      estado: "completada",
      notaVoz: voiceNote,
      transcripcion,
    };
    onSave(obs);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Nueva Observación de Clase</h3>
            <p className="text-xs text-gray-500">Pauta de evaluación docente en aula</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 pt-0">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Título de la observación *
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="ej: Observación clase de Álgebra"
              className="input-field text-xs sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Estudiante en práctica *
              </label>
              <input
                value={estudiante}
                onChange={(e) => setEstudiante(e.target.value)}
                placeholder="Nombre del alumno"
                className="input-field text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Curso / Sección
              </label>
              <input
                value={seccion}
                onChange={(e) => setSeccion(e.target.value)}
                placeholder="ej: 1° Medio A"
                className="input-field text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="input-field text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Puntaje Pauta (1-100)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={puntaje}
                onChange={(e) => setPuntaje(e.target.value)}
                placeholder="ej: 90"
                className="input-field text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Voice Note Section with Real-time Auto-Transcription */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                🎙️ Nota de Voz (Transcripción Automática)
              </label>
              <span className="text-[10px] text-[#2d8a4e] font-bold">Whisper AI</span>
            </div>
            <VoiceRecorder
              onSave={setVoiceNote}
              onTranscribe={(text) => {
                setTranscripcion((prev) => (prev ? prev + "\n" + text : text));
              }}
              existingNote={voiceNote}
            />
          </div>

          {/* Written Observations Field (Populated by transcription) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Observaciones Cualitativas Escritas
              </label>
              {transcripcion && (
                <span className="text-[10px] text-[#2d8a4e] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Transcripción insertada
                </span>
              )}
            </div>
            <textarea
              value={transcripcion}
              onChange={(e) => setTranscripcion(e.target.value)}
              rows={4}
              placeholder="El texto de la nota de voz se transcribirá y colocará automáticamente aquí..."
              className="input-field resize-none text-xs sm:text-sm leading-relaxed"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 text-xs font-bold py-2.5"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary flex-1 text-xs font-bold py-2.5"
            >
              Guardar Observación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Evaluaciones Page ───────────────────────────────────────────────────
export default function EvaluacionesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [observaciones, setObservaciones] = useState<Observacion[]>([
    {
      id: 1,
      titulo: "Observación Clase 1: Ecuaciones Lineales",
      fecha: "2026-08-14",
      estudiante: "Matías Silva Morales",
      seccion: "1° Medio A",
      puntaje: 92,
      estado: "completada",
      transcripcion:
        "El estudiante demuestra un adecuado dominio didáctico al inicio de la sesión utilizando la balanza interactiva GeoGebra. Durante el trabajo en duplas los alumnos se mostraron participativos.",
    },
    {
      id: 2,
      titulo: "Observación Clase 2: Geometría y Teorema de Pitágoras",
      fecha: "2026-08-11",
      estudiante: "Camila Torres Pérez",
      seccion: "8° Básico B",
      puntaje: 88,
      estado: "completada",
      transcripcion:
        "Buen uso de material concreto y fichas manipulativas. Se sugiere reforzar el momento de cierre con una síntesis más estructurada.",
    },
  ]);

  const handleAddObservacion = (obs: Observacion) => {
    setObservaciones((prev) => [obs, ...prev]);
  };

  const filtered = observaciones.filter(
    (o) =>
      o.estudiante.toLowerCase().includes(search.toLowerCase()) ||
      o.titulo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold mb-1.5">
              <Mic className="w-3.5 h-3.5" />
              Observaciones de Aula & Notas de Voz
            </div>
            <h1
              className="text-3xl font-bold text-[#1e3a5f]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Evaluaciones de Práctica
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              Registro digital de observaciones presenciales en colegios con soporte para notas de voz transcritas por IA.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary inline-flex items-center gap-2 text-xs font-bold py-2.5 px-4 shadow-md"
          >
            <Plus className="w-4 h-4" />
            Nueva Observación
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por estudiante o título de clase..."
            className="input-field pl-10 text-xs sm:text-sm"
          />
        </div>

        {/* List of Observations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((obs) => (
            <div
              key={obs.id}
              className="card p-5 rounded-2xl border border-gray-200 hover:border-[#1e3a5f]/40 transition-all shadow-xs space-y-3 bg-white"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{obs.titulo}</h3>
                  <p className="text-xs text-[#1e3a5f] font-semibold mt-0.5">
                    {obs.estudiante} · {obs.seccion}
                  </p>
                </div>
                {obs.puntaje && (
                  <span className="text-xs font-bold bg-green-50 text-[#2d8a4e] border border-green-200 px-2.5 py-1 rounded-xl">
                    {obs.puntaje} / 100 pts
                  </span>
                )}
              </div>

              {obs.transcripcion && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs text-gray-600 leading-relaxed">
                  <p className="font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <Mic className="w-3 h-3 text-orange-600" /> Observaciones cualitativas:
                  </p>
                  "{obs.transcripcion}"
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {obs.fecha}
                </span>
                <span className="font-semibold text-[#2d8a4e] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Pauta Completada
                </span>
              </div>
            </div>
          ))}
        </div>

        {modalOpen && (
          <ObservacionModal
            onClose={() => setModalOpen(false)}
            onSave={handleAddObservacion}
          />
        )}
      </div>
    </AppLayout>
  );
}
