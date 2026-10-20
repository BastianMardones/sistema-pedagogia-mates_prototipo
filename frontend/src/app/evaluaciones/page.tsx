"use client";

/**
 * =============================================================================
 * PÁGINA: Evaluaciones y Observaciones de Clase (/evaluaciones)
 * PROYECTO: Sistema de Gestión de Prácticas Pedagógicas (SGP Matemáticas - UBB)
 * =============================================================================
 * PROPÓSITO DE NEGOCIO:
 * Digitaliza la pauta de observación en aula aplicada por el Profesor Tutor o
 * Profesor Colaborador en los establecimientos educacionales.
 *
 * SOLUCIÓN AL "TOQUE DE TIMBRE":
 * Incluye un sistema dual de Grabación y Transcripción de Notas de Voz (es-CL):
 *   1. Transcripción en Vivo (Web Speech API - SpeechRecognition / webkitSpeechRecognition):
 *      Convierte la voz del docente a texto en tiempo real mientras habla.
 *   2. Grabación de Audio + Respaldo Backend (MediaRecorder API + FastAPI /voz/transcribir):
 *      Captura el archivo de audio (con reproductor integrado para escuchar la nota)
 *      y, si el navegador no soporta dictado en vivo, lo envía al microservicio Python
 *      que lo convierte con FFmpeg y lo transcribe con SpeechRecognition / Whisper.
 * =============================================================================
 */

import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { evaluacionService } from "@/lib/api";
import { Mic, MicOff, CheckCircle, Save, Plus, AlertCircle, FileText, Volume2 } from "lucide-react";
import { User } from "@/types";
import clsx from "clsx";

/**
 * Criterios oficiales de la rúbrica de observación de clases de práctica (escala 1 a 5).
 * Evalúan gestión de aula, coherencia con el OA del MINEDUC, los 3 momentos, DUA y PIE.
 */
const CRITERIOS_RUBRICA = [
  { id: "gestion_aula", nombre: "Gestión del Aula", descripcion: "Manejo del espacio, tiempo y clima de convivencia escolar del grupo" },
  { id: "implementacion_oa", nombre: "Implementación del OA", descripcion: "Las actividades permiten lograr el Objetivo de Aprendizaje (MINEDUC) declarado" },
  { id: "momentos_clase", nombre: "3 Momentos de la Clase", descripcion: "Inicio (15m), Desarrollo (60m) y Cierre (15m) estructurados y respetados" },
  { id: "aplicacion_dua", nombre: "Aplicación del DUA", descripcion: "Los principios DUA declarados en la planificación fueron implementados en aula" },
  { id: "atencion_diversidad", nombre: "Atención a la Diversidad (NEET/NEEP)", descripcion: "Estrategias concretas para atender a estudiantes del PIE con necesidades educativas" },
  { id: "evaluacion_formativa", nombre: "Evaluación Formativa", descripcion: "Se aplicó el instrumento de evaluación (rúbrica, lista de cotejo o ticket de salida)" },
  { id: "reflexion_pedagogica", nombre: "Reflexión Pedagógica", descripcion: "El docente en práctica demuestra autocrítica y reflexión sobre su propia clase" },
];

interface PuntajeState {
  [key: string]: number;
}

export default function EvaluacionesPage() {
  // Estado de sesión del usuario autenticado (Solo accesible por rol PROFESOR)
  const [user, setUser] = useState<User | null>(null);
  const [modo, setModo] = useState<"lista" | "nueva">("lista");
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado del formulario de nueva evaluación
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [estudiante, setEstudiante] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [puntajes, setPuntajes] = useState<PuntajeState>({});

  // Estado del módulo de Grabación y Transcripción de Voz
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribiendo, setIsTranscribiendo] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState(""); // Texto parcial mientras el profesor habla
  const [audioUrl, setAudioUrl] = useState<string | null>(null); // URL local para reproducir el audio grabado
  const [recordingError, setRecordingError] = useState("");

  // Referencias para MediaRecorder (captura de archivo de audio) y SpeechRecognition (dictado en vivo)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);
  const capturedViaLiveSpeechRef = useRef<boolean>(false);

  // Estado de guardado en el Backend Spring Boot
  const [guardando, setGuardando] = useState(false);
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [error, setError] = useState("");

  /**
   * Al montar el componente:
   * 1. Carga el usuario desde localStorage.
   * 2. Obtiene la lista histórica de evaluaciones desde el Backend (/api/evaluaciones).
   */
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    evaluacionService.getAll()
      .then(r => setEvaluaciones(r.data || []))
      .catch(() => setEvaluaciones([]))
      .finally(() => setLoading(false));
  }, []);

  /** Asigna el puntaje (1 a 5) a un criterio específico de la rúbrica */
  const setPuntaje = (id: string, val: number) => {
    setPuntajes(p => ({ ...p, [id]: val }));
  };

  /**
   * Inicia la grabación de voz combinando:
   * - Web Speech API (webkitSpeechRecognition) para transcripción instantánea en español (es-CL).
   * - MediaRecorder API para almacenar el clip de audio y enviarlo al servidor Python si es necesario.
   */
  const startRecording = async () => {
    setRecordingError("");
    setLiveTranscript("");
    capturedViaLiveSpeechRef.current = false;

    try {
      // 1. Solicitar permiso de micrófono al navegador
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 2. Seleccionar el formato MIME de audio compatible con el navegador actual
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      // 3. Al detener la grabación: crear reproductor de audio y, si no hubo dictado en vivo, transcribir en backend
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Si el navegador no transcribió en vivo (ej. Firefox o sin soporte Web Speech), usar el microservicio Python
        if (!capturedViaLiveSpeechRef.current && blob.size > 500) {
          await transcribirAudioEnServidor(blob);
        }
      };

      // 4. Iniciar reconocimiento de voz en vivo del navegador (Chrome / Edge / Brave)
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "es-CL"; // Español de Chile
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let interim = "";
          let finalChunk = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalChunk += transcript + " ";
            } else {
              interim += transcript;
            }
          }

          if (finalChunk.trim()) {
            capturedViaLiveSpeechRef.current = true;
            setObservaciones(prev => {
              const textoLimpio = finalChunk.trim();
              return prev ? `${prev.trim()} ${textoLimpio}.` : `${textoLimpio}.`;
            });
          }
          setLiveTranscript(interim);
        };

        recognition.onerror = () => {
          // Si falla el dictado en vivo, el onstop del MediaRecorder usará el servidor Python automáticamente
        };

        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch {}
      }

      mr.start(250); // Capturar bloques cada 250ms
      setIsRecording(true);
    } catch (err) {
      setRecordingError("No se pudo acceder al micrófono. Verifica que hayas otorgado permisos en el navegador.");
    }
  };

  /** Detiene tanto el reconocimiento en vivo como la grabación del archivo de audio */
  const stopRecording = () => {
    setLiveTranscript("");
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  /**
   * Envía el archivo de audio (Blob) al microservicio FastAPI (POST /voz/transcribir)
   * donde FFmpeg lo normaliza a WAV 16kHz y SpeechRecognition / Whisper extrae el texto.
   */
  const transcribirAudioEnServidor = async (blob: Blob) => {
    setIsTranscribiendo(true);
    try {
      const res = await evaluacionService.transcribirVoz(blob, "webm");
      const texto: string = res.data?.texto || res.data?.transcripcion || "";
      if (texto.trim()) {
        setObservaciones(prev => prev ? `${prev}\n${texto}` : texto);
      }
    } catch (err) {
      setRecordingError("No se pudo conectar con el servidor de transcripción en el puerto 8000.");
    } finally {
      setIsTranscribiendo(false);
    }
  };

  /** Suma los puntajes asignados en los 7 criterios de la rúbrica (máximo 35 puntos) */
  const calcularPuntajeTotal = () => {
    const vals = Object.values(puntajes);
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0);
  };

  /** Envía la evaluación completa al Backend Spring Boot (POST /api/evaluaciones) */
  const handleGuardar = async () => {
    if (!titulo.trim()) { setError("Ingresa un título para la evaluación."); return; }
    setGuardando(true);
    setError("");
    try {
      const data = {
        titulo,
        fecha,
        estudianteNombre: estudiante,
        observaciones,
        puntajes,
        puntajeTotal: calcularPuntajeTotal(),
        maxPuntaje: CRITERIOS_RUBRICA.length * 5,
        observacionesDesdeVoz: Boolean(audioUrl || capturedViaLiveSpeechRef.current),
        estado: "COMPLETADA"
      };
      await evaluacionService.create(data);
      setGuardadoOk(true);
      setTimeout(() => {
        setModo("lista");
        setGuardadoOk(false);
        setTitulo("");
        setEstudiante("");
        setObservaciones("");
        setPuntajes({});
        setAudioUrl(null);
        evaluacionService.getAll().then(r => setEvaluaciones(r.data || [])).catch(() => {});
      }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al guardar la evaluación. Verifica que el backend esté corriendo.");
    } finally {
      setGuardando(false);
    }
  };

  if (user?.rol !== "PROFESOR") {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <p className="text-gray-500">Esta sección solo está disponible para usuarios con rol PROFESOR.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Encabezado de la vista */}
        <div className="flex items-center justify-between pb-5 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Evaluaciones y Observaciones
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Registra observaciones de clase en terreno con rúbrica digital y transcripción de nota de voz
            </p>
          </div>
          {modo === "lista" && (
            <button
              type="button"
              onClick={() => { setModo("nueva"); setError(""); setGuardadoOk(false); }}
              className="btn-primary text-xs py-2.5 px-4 font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Nueva Evaluación
            </button>
          )}
          {modo === "nueva" && (
            <button
              type="button"
              onClick={() => setModo("lista")}
              className="btn-secondary text-xs py-2.5 px-4 font-bold"
            >
              Cancelar
            </button>
          )}
        </div>

        {/* MODO LISTA: Historial de evaluaciones registradas */}
        {modo === "lista" && (
          <div>
            {loading ? (
              <div className="card rounded-2xl p-8 text-center text-sm text-gray-400">Cargando evaluaciones...</div>
            ) : evaluaciones.length === 0 ? (
              <div className="card rounded-2xl p-10 text-center border-dashed border-2 border-gray-200">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-gray-700">No hay evaluaciones registradas</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">Registra tu primera observación de clase con nota de voz</p>
                <button onClick={() => setModo("nueva")} className="btn-primary text-xs py-2 px-4 font-bold">
                  Nueva Evaluación
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {evaluaciones.map((ev: any) => (
                  <div key={ev.id} className="card rounded-2xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm">{ev.titulo}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {ev.estudianteNombre && <><strong>{ev.estudianteNombre}</strong> · </>}
                          {new Date(ev.fecha || ev.createdAt).toLocaleDateString("es-CL")}
                        </p>
                        {ev.puntajeTotal != null && (
                          <p className="text-xs text-[#2d8a4e] font-semibold mt-1">
                            Puntaje Rúbrica: {ev.puntajeTotal}/{ev.maxPuntaje || 35} pts
                            {ev.notaFinal ? ` · Nota: ${ev.notaFinal}` : ""}
                          </p>
                        )}
                        {ev.observaciones && (
                          <p className="text-xs text-gray-600 mt-1.5 whitespace-pre-wrap">{ev.observaciones}</p>
                        )}
                      </div>
                      <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-lg text-[10px] font-bold flex-shrink-0">
                        {ev.estado || "COMPLETADA"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODO NUEVA EVALUACIÓN: Formulario con Rúbrica y Grabador de Voz */}
        {modo === "nueva" && (
          <div className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {guardadoOk && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700 font-semibold">Evaluación guardada exitosamente en la base de datos.</p>
              </div>
            )}

            {/* 1. Datos generales de la sesión observada */}
            <div className="card rounded-2xl p-6 space-y-4">
              <p className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-3">Datos de la Evaluación</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Título de la Observación *</label>
                  <input
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    className="input-field text-sm"
                    placeholder="Ej: Observación de clase - Ecuaciones 8° Básico B"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Fecha</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nombre del Estudiante en Práctica</label>
                  <input
                    value={estudiante}
                    onChange={e => setEstudiante(e.target.value)}
                    className="input-field text-sm"
                    placeholder="Ej: Matías Silva Morales"
                  />
                </div>
              </div>
            </div>

            {/* 2. Rúbrica cuantitativa (7 criterios de 1 a 5 puntos) */}
            <div className="card rounded-2xl p-6 space-y-4">
              <p className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-3">
                Rúbrica de Evaluación (1 = Insuficiente / 5 = Excelente)
              </p>
              <div className="space-y-4">
                {CRITERIOS_RUBRICA.map(c => (
                  <div key={c.id} className="space-y-2">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{c.nombre}</p>
                      <p className="text-[10px] text-gray-500">{c.descripcion}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setPuntaje(c.id, n)}
                          className={clsx(
                            "w-10 h-10 rounded-xl font-bold text-sm transition-all border-2",
                            puntajes[c.id] === n
                              ? n <= 2 ? "bg-red-100 border-red-400 text-red-800"
                                : n === 3 ? "bg-yellow-100 border-yellow-400 text-yellow-800"
                                : "bg-green-100 border-green-400 text-green-800"
                              : "border-gray-200 text-gray-400 hover:border-gray-400"
                          )}
                        >
                          {n}
                        </button>
                      ))}
                      <span className="text-xs text-gray-400 ml-2">
                        {puntajes[c.id] ? ["", "Insuficiente", "Básico", "Adecuado", "Bueno", "Excelente"][puntajes[c.id]] : "Sin puntaje"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-[#1e3a5f]/5 rounded-xl p-3 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">Puntaje Total Acumulado</p>
                <p className="text-lg font-bold text-[#1e3a5f]">{calcularPuntajeTotal()} / {CRITERIOS_RUBRICA.length * 5}</p>
              </div>
            </div>

            {/* 3. Observaciones Cualitativas + Grabación/Transcripción de Nota de Voz */}
            <div className="card rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-bold text-gray-900 text-sm">Observaciones Cualitativas (Nota de Voz a Texto)</p>
                  <p className="text-[11px] text-gray-500">
                    Presiona el botón y habla al micrófono: tu voz se transcribirá automáticamente al español.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isTranscribiendo && (
                    <p className="text-xs text-blue-600 font-semibold animate-pulse">
                      Procesando audio en servidor...
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isTranscribiendo}
                    className={clsx(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs",
                      isRecording
                        ? "bg-red-600 text-white border-2 border-red-700 animate-pulse"
                        : "bg-green-50 text-green-800 border-2 border-green-300 hover:border-green-500"
                    )}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {isRecording ? "Detener grabación" : "Grabar nota de voz"}
                  </button>
                </div>
              </div>

              {/* Indicador visual en tiempo real mientras el docente está hablando */}
              {isRecording && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-red-600 animate-ping flex-shrink-0" />
                  <div className="text-xs text-red-900">
                    <span className="font-bold">Grabando y transcribiendo en vivo (es-CL): </span>
                    <span className="italic">{liveTranscript || "Habla ahora frente al micrófono..."}</span>
                  </div>
                </div>
              )}

              {/* Reproductor de la nota de voz grabada */}
              {audioUrl && !isRecording && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#1e3a5f]">
                    <Volume2 className="w-4 h-4 text-blue-600" />
                    Audio de la observación registrado:
                  </div>
                  <audio controls src={audioUrl} className="h-8 w-full sm:w-72" />
                </div>
              )}

              {recordingError && <p className="text-xs text-red-600 font-medium">{recordingError}</p>}

              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                rows={6}
                placeholder="Escribe tus observaciones aquí, o presiona 'Grabar nota de voz' para dictar tus comentarios al terminar la clase..."
                className="input-field resize-none text-sm leading-relaxed"
              />
            </div>

            {/* Botón de guardado */}
            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-md"
            >
              <Save className="w-4 h-4" />
              {guardando ? "Guardando evaluación..." : "Guardar Evaluación"}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
