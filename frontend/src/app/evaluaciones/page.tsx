"use client";

import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/AppLayout";
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
  existingNote,
}: {
  onSave: (note: VoiceNote) => void;
  existingNote?: VoiceNote;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
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
        "No se pudo acceder al micrófono. Permite el acceso en el navegador."
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
    setIsPlaying(false);
    setElapsed(0);
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
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Recording UI */}
      {isRecording ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <div className="flex items-center gap-4">
            {/* Waveform */}
            <div className="flex items-center gap-0.5 h-12 flex-1">
              {amplitude.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-red-400 rounded-full transition-all duration-75"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="font-mono text-red-700 font-semibold text-sm">
                {formatTime(elapsed)}
              </span>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={togglePause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
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
              onClick={stopRecording}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors"
            >
              <Square className="w-3.5 h-3.5" /> Detener
            </button>
          </div>
        </div>
      ) : voiceNote ? (
        /* Playback UI */
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-[#1e3a5f] flex items-center justify-center flex-shrink-0 hover:bg-[#2a4f7c] transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white ml-0.5" />
            )}
          </button>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">
              Nota de voz grabada
            </p>
            <p className="text-xs text-gray-400">
              Duración: {formatTime(voiceNote.duration)} ·{" "}
              {voiceNote.createdAt.toLocaleTimeString("es-CL", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {/* Fake waveform for playback */}
            <div className="flex items-center gap-0.5 h-5 mt-1.5">
              {Array.from({ length: 30 }, (_, i) => (
                <div
                  key={i}
                  className={clsx(
                    "flex-1 rounded-full transition-colors",
                    isPlaying ? "bg-[#1e3a5f]/60 animate-pulse" : "bg-gray-200"
                  )}
                  style={{ height: `${Math.random() * 14 + 4}px` }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={deleteNote}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar nota"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Start recording button */
        <button
          onClick={startRecording}
          className="flex items-center gap-2 w-full justify-center px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50/30 transition-all text-sm font-medium"
        >
          <Mic className="w-4 h-4" />
          Grabar nota de voz
        </button>
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
  const [titulo, setTitulo] = useState("");
  const [estudiante, setEstudiante] = useState("");
  const [seccion, setSeccion] = useState("");
  const [fecha, setFecha] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [transcripcion, setTranscripcion] = useState("");
  const [voiceNote, setVoiceNote] = useState<VoiceNote | undefined>();
  const [puntaje, setPuntaje] = useState("");

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Nueva Observación de Clase</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Título de la observación *
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="ej: Observación clase de Álgebra"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Estudiante *
              </label>
              <input
                value={estudiante}
                onChange={(e) => setEstudiante(e.target.value)}
                placeholder="Nombre completo"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sección
              </label>
              <input
                value={seccion}
                onChange={(e) => setSeccion(e.target.value)}
                placeholder="ej: 3°A"
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Puntaje (1-100)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={puntaje}
                onChange={(e) => setPuntaje(e.target.value)}
                placeholder="—"
                className="input-field"
              />
            </div>
          </div>

          {/* Voice Note Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nota de voz{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-3">
              <p className="text-xs text-orange-700 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" />
                Usa esta función durante la observación en clases para grabar
                notas rápidas.
              </p>
            </div>
            <VoiceRecorder onSave={setVoiceNote} existingNote={voiceNote} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Observaciones escritas
            </label>
            <textarea
              value={transcripcion}
              onChange={(e) => setTranscripcion(e.target.value)}
              placeholder="Anota tus observaciones sobre la clase..."
              rows={4}
              className="input-field resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!titulo || !estudiante}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              Guardar observación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EvaluacionesPage() {
  const [observaciones, setObservaciones] = useState<Observacion[]>([
    {
      id: 1,
      titulo: "Observación clase de Geometría",
      fecha: "2024-11-10",
      estudiante: "María González Pérez",
      seccion: "4°B",
      puntaje: 85,
      estado: "completada",
      transcripcion:
        "Buena gestión del tiempo. Las actividades fueron variadas y pertinentes al nivel del curso.",
    },
    {
      id: 2,
      titulo: "Observación clase de Álgebra",
      fecha: "2024-11-12",
      estudiante: "Carlos Rodríguez Mena",
      seccion: "3°A",
      puntaje: 72,
      estado: "completada",
    },
    {
      id: 3,
      titulo: "Observación Estadística",
      fecha: "2024-11-14",
      estudiante: "Ana Muñoz Silva",
      seccion: "5°",
      estado: "pendiente",
    },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const audioRefs = useRef<Record<number, HTMLAudioElement>>({});

  const filtered = observaciones.filter(
    (o) =>
      o.titulo.toLowerCase().includes(search.toLowerCase()) ||
      o.estudiante.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (obs: Observacion) => {
    setObservaciones((prev) => [obs, ...prev]);
  };

  const handlePlayVoice = (obs: Observacion) => {
    if (!obs.notaVoz) return;
    if (playing === obs.id) {
      audioRefs.current[obs.id]?.pause();
      setPlaying(null);
    } else {
      if (playing && audioRefs.current[playing]) {
        audioRefs.current[playing].pause();
      }
      if (!audioRefs.current[obs.id]) {
        audioRefs.current[obs.id] = new Audio(obs.notaVoz.url);
        audioRefs.current[obs.id].onended = () => setPlaying(null);
      }
      audioRefs.current[obs.id].play();
      setPlaying(obs.id);
    }
  };

  const scoreColor = (score?: number) => {
    if (!score) return "text-gray-400";
    if (score >= 80) return "text-[#2d8a4e]";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <AppLayout>
      {showModal && (
        <ObservacionModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-3xl font-bold text-[#1e3a5f]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Pautas de Observación
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Registra observaciones de clase con notas de voz
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva observación
          </button>
        </div>

        {/* Mobile voice recording tip */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6">
          <Mic className="w-4 h-4 text-[#1e3a5f] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-[#1e3a5f]">
            <strong>Tip:</strong> Puedes usar la grabación de voz directamente
            desde tu teléfono durante la observación en sala de clases.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            {
              label: "Total",
              value: observaciones.length,
              color: "text-[#1e3a5f]",
              bg: "bg-blue-50",
            },
            {
              label: "Completadas",
              value: observaciones.filter((o) => o.estado === "completada").length,
              color: "text-[#2d8a4e]",
              bg: "bg-green-50",
            },
            {
              label: "Pendientes",
              value: observaciones.filter((o) => o.estado === "pendiente").length,
              color: "text-yellow-600",
              bg: "bg-yellow-50",
            },
          ].map((s) => (
            <div key={s.label} className={`card text-center ${s.bg} border-0`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o estudiante..."
            className="input-field pl-9"
          />
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-14 text-gray-400">
              <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
              <p className="font-medium text-gray-500">No hay observaciones</p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-accent mt-4 text-sm"
              >
                Crear primera observación
              </button>
            </div>
          ) : (
            filtered.map((obs) => (
              <div key={obs.id} className="card p-0 overflow-hidden">
                {/* Main row */}
                <div
                  className="flex items-center gap-4 p-5 cursor-pointer hover:bg-gray-50/60 transition-colors"
                  onClick={() =>
                    setExpanded(expanded === obs.id ? null : obs.id)
                  }
                >
                  <div
                    className={clsx(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      obs.estado === "completada"
                        ? "bg-green-50"
                        : "bg-yellow-50"
                    )}
                  >
                    {obs.estado === "completada" ? (
                      <CheckCircle className="w-5 h-5 text-[#2d8a4e]" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800 text-sm">
                        {obs.titulo}
                      </p>
                      {obs.notaVoz && (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          <Mic className="w-3 h-3" /> Nota de voz
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <User className="w-3 h-3" /> {obs.estudiante}
                      </span>
                      {obs.seccion && (
                        <span className="text-xs text-gray-400">
                          Sección {obs.seccion}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(obs.fecha).toLocaleDateString("es-CL")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {obs.puntaje && (
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${scoreColor(obs.puntaje)}`}
                        >
                          {obs.puntaje}
                        </p>
                        <p className="text-xs text-gray-400">pts</p>
                      </div>
                    )}
                    <ChevronDown
                      className={clsx(
                        "w-4 h-4 text-gray-400 transition-transform",
                        expanded === obs.id && "rotate-180"
                      )}
                    />
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded === obs.id && (
                  <div className="border-t border-gray-100 p-5 space-y-4 bg-gray-50/40">
                    {obs.notaVoz && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Nota de voz
                        </p>
                        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3">
                          <button
                            onClick={() => handlePlayVoice(obs)}
                            className="w-9 h-9 bg-[#1e3a5f] rounded-full flex items-center justify-center hover:bg-[#2a4f7c] transition-colors"
                          >
                            {playing === obs.id ? (
                              <Pause className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <Play className="w-3.5 h-3.5 text-white ml-0.5" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-0.5 h-6">
                              {Array.from({ length: 30 }, (_, i) => (
                                <div
                                  key={i}
                                  className={clsx(
                                    "flex-1 rounded-full",
                                    playing === obs.id
                                      ? "bg-[#1e3a5f]/50 animate-pulse"
                                      : "bg-gray-200"
                                  )}
                                  style={{ height: `${Math.random() * 18 + 4}px` }}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {obs.notaVoz.duration
                                ? `${Math.floor(obs.notaVoz.duration / 60)}:${(obs.notaVoz.duration % 60).toString().padStart(2, "0")}`
                                : "Grabación de voz"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {obs.transcripcion && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Observaciones escritas
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed bg-white rounded-lg border border-gray-100 p-3">
                          {obs.transcripcion}
                        </p>
                      </div>
                    )}

                    {obs.puntaje && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Puntaje obtenido
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={clsx(
                                "h-3 rounded-full",
                                obs.puntaje >= 80
                                  ? "bg-[#2d8a4e]"
                                  : obs.puntaje >= 60
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              )}
                              style={{ width: `${obs.puntaje}%` }}
                            />
                          </div>
                          <span
                            className={`font-bold text-sm ${scoreColor(obs.puntaje)}`}
                          >
                            {obs.puntaje}/100
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
