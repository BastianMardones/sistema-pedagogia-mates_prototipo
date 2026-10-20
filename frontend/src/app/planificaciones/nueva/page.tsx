"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { planificacionService } from "@/lib/api";
import { Save, Send, ChevronDown, ChevronUp, HelpCircle, Upload, FileText, AlertCircle } from "lucide-react";
import clsx from "clsx";

interface SeccionProps {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  color?: string;
}

function Seccion({ title, subtitle, open, onToggle, children, color = "bg-blue-600" }: SeccionProps) {
  return (
    <div className="card rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={clsx("w-1 h-8 rounded-full", color)} />
          <div>
            <p className="font-bold text-gray-900 text-sm">{title}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-6 pb-6 pt-2 space-y-4">{children}</div>}
    </div>
  );
}

const Field = ({ label, tooltip, required, children }: {
  label: string; tooltip?: string; required?: boolean; children: React.ReactNode
}) => (
  <div>
    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
      {label} {required && <span className="text-red-500">*</span>}
      {tooltip && <span className="text-gray-400 cursor-help text-[10px] normal-case font-normal ml-1">({tooltip})</span>}
    </label>
    {children}
  </div>
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    rows={props.rows || 3}
    className={clsx("input-field resize-none text-sm", props.className)}
  />
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={clsx("input-field text-sm", props.className)} />
);

export default function NuevaPlanificacionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [secciones, setSecciones] = useState([true, false, false, false, false, false]);

  const toggleSeccion = (i: number) => setSecciones(s => s.map((v, idx) => idx === i ? !v : v));

  const [form, setForm] = useState({
    titulo: "",
    // Equipo
    equipoCoEnsenanza: "",
    // Caracterizacion
    numEstNEET: 0, diagnosticosNEET: "",
    numEstNEEP: 0, diagnosticosNEEP: "",
    estiloVisual: 50, estiloKinestetivo: 10, estiloAuditivo: 40,
    otrosDatos: "",
    // Datos generales
    anioClase: new Date().getFullYear(),
    periodoClase: "II Semestre",
    asignaturaClase: "Matematica",
    cursoClase: "",
    unidadTematica: "",
    // Objetivos
    objetivoOA: "",
    indicadoresEvaluacion: "",
    objetivoTransversal: "",
    objetivoClase: "",
    // 3 Momentos
    momentoInicio: "",
    momentoDesarrollo: "",
    momentoCierre: "",
    principiosDUA: "",
    evaluacionClase: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
  };

  const handleSubmit = async (estado: "BORRADOR" | "EN_REVISION") => {
    if (!form.titulo.trim() || !form.objetivoOA.trim()) {
      setError("El titulo y el Objetivo de Aprendizaje (OA) son obligatorios.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = { ...form, estado };
      const res = await planificacionService.create(payload);
      const id = res.data?.id;
      if (pdfFile && id) {
        await planificacionService.uploadPdf(id, pdfFile).catch(() => {});
      }
      router.push(estado === "EN_REVISION" ? "/chatbot?planId=" + id : "/planificaciones");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al guardar. Verifica que el backend este corriendo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Nueva Planificacion
            </h1>
            <p className="text-sm text-gray-500 mt-1">Completa los campos de la pauta institucional</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => handleSubmit("BORRADOR")}
              disabled={loading}
              className="btn-secondary text-xs py-2 px-3 font-bold flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Borrador
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("EN_REVISION")}
              disabled={loading}
              className="btn-primary text-xs py-2 px-3 font-bold flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? "Enviando..." : "Enviar al Chatbot"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Titulo de la planificacion */}
        <div className="card rounded-2xl p-6">
          <Field label="Titulo de la planificacion" required>
            <Input
              value={form.titulo}
              onChange={set("titulo")}
              placeholder="Ej: Planificacion OA16 - Probabilidad y Estadistica - 7mo Basico A"
            />
          </Field>
        </div>

        {/* Seccion 1: Equipo */}
        <Seccion title="Equipo de Co-Ensenanza" subtitle="Docentes involucrados en la clase" open={secciones[0]} onToggle={() => toggleSeccion(0)} color="bg-[#1e3a5f]">
          <Field label="Integrantes del equipo">
            <Textarea
              value={form.equipoCoEnsenanza}
              onChange={set("equipoCoEnsenanza")}
              placeholder="Ej: Docente en practica: [Tu nombre] / Profesor colaborador del colegio: [Nombre] / Tutor universitario: Carlos Mendoza"
              rows={2}
            />
          </Field>
        </Seccion>

        {/* Seccion 2: Caracterizacion del Curso */}
        <Seccion title="Caracterizacion del Curso" subtitle="Necesidades educativas, estilos de aprendizaje y otros datos del grupo" open={secciones[1]} onToggle={() => toggleSeccion(1)} color="bg-purple-600">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                Estudiantes con NEET
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Field label="N° estudiantes">
                  <Input type="number" min={0} value={form.numEstNEET} onChange={set("numEstNEET")} />
                </Field>
                <Field label="Diagnosticos" tooltip="DEA, Dislexia, etc.">
                  <Input value={form.diagnosticosNEET} onChange={set("diagnosticosNEET")} placeholder="DEA, Dislexia..." />
                </Field>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                Estudiantes con NEEP
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Field label="N° estudiantes">
                  <Input type="number" min={0} value={form.numEstNEEP} onChange={set("numEstNEEP")} />
                </Field>
                <Field label="Diagnosticos" tooltip="TEA, DIL, etc.">
                  <Input value={form.diagnosticosNEEP} onChange={set("diagnosticosNEEP")} placeholder="TEA, DIL..." />
                </Field>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Estilos de aprendizaje (%)</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { k: "estiloVisual", label: "Visual" },
                { k: "estiloKinestetivo", label: "Kinestetivo" },
                { k: "estiloAuditivo", label: "Auditivo" },
              ].map(s => (
                <div key={s.k}>
                  <label className="block text-[10px] text-gray-500 mb-1">{s.label}</label>
                  <div className="relative">
                    <Input
                      type="number" min={0} max={100}
                      value={(form as any)[s.k]}
                      onChange={set(s.k)}
                      className="pr-6"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Field label="Otros datos de importancia">
            <Textarea value={form.otrosDatos} onChange={set("otrosDatos")} placeholder="Ej: Una alumna proveniente del extranjero con nivel de comprension bajo en idioma espanol..." rows={2} />
          </Field>
        </Seccion>

        {/* Seccion 3: Datos Generales */}
        <Seccion title="Datos Generales de la Clase" subtitle="Informacion formal del registro de planificacion" open={secciones[2]} onToggle={() => toggleSeccion(2)} color="bg-indigo-600">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Ano">
              <Input type="number" value={form.anioClase} onChange={set("anioClase")} />
            </Field>
            <Field label="Periodo">
              <select value={form.periodoClase} onChange={set("periodoClase")} className="input-field text-sm">
                <option>I Semestre</option>
                <option>II Semestre</option>
              </select>
            </Field>
            <Field label="Asignatura">
              <Input value={form.asignaturaClase} onChange={set("asignaturaClase")} placeholder="Matematica" />
            </Field>
            <Field label="Curso" required>
              <Input value={form.cursoClase} onChange={set("cursoClase")} placeholder="7mo Basico A" />
            </Field>
          </div>
          <Field label="Unidad o Eje Tematico">
            <Input value={form.unidadTematica} onChange={set("unidadTematica")} placeholder="Probabilidad y Estadistica" />
          </Field>
        </Seccion>

        {/* Seccion 4: Objetivos */}
        <Seccion title="Objetivos" subtitle="OA del MINEDUC, transversal y objetivo de la clase" open={secciones[3]} onToggle={() => toggleSeccion(3)} color="bg-[#2d8a4e]">
          <Field label="Objetivo de Aprendizaje (OA) + Indicadores de evaluacion" required tooltip="Ej: OA16 - Representar datos mediante tablas de frecuencias...">
            <Textarea
              value={form.objetivoOA}
              onChange={set("objetivoOA")}
              placeholder="OA16: Representar datos obtenidos en una muestra mediante tablas de frecuencias absolutas y relativas, utilizando graficos apropiados..."
              rows={3}
            />
          </Field>
          <Field label="Indicadores de Evaluacion">
            <Textarea value={form.indicadoresEvaluacion} onChange={set("indicadoresEvaluacion")} placeholder="Describe como mediras el logro del OA..." rows={2} />
          </Field>
          <Field label="Objetivo de Aprendizaje Transversal">
            <Textarea
              value={form.objetivoTransversal}
              onChange={set("objetivoTransversal")}
              placeholder="Gestionar de manera activa el propio aprendizaje, utilizando capacidades de analisis, interpretacion y sintesis..."
              rows={2}
            />
          </Field>
          <Field label="Objetivo de la Clase" required>
            <Textarea
              value={form.objetivoClase}
              onChange={set("objetivoClase")}
              placeholder="Recordar conceptos como poblacion, muestra, datos y tipos de variables..."
              rows={2}
            />
          </Field>
        </Seccion>

        {/* Seccion 5: 3 Momentos + DUA */}
        <Seccion title="Momentos de la Clase + Diversificacion (DUA)" subtitle="Inicio / Desarrollo / Cierre con principios DUA por momento" open={secciones[4]} onToggle={() => toggleSeccion(4)} color="bg-orange-600">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-800">
            Para cada momento: describe las actividades. En la columna DUA, indica el Principio DUA (ej: 1.1, 7.2, 3.3) y que estrategia aplicaste.
          </div>
          <Field label="Inicio (15 min)" required>
            <Textarea
              value={form.momentoInicio}
              onChange={set("momentoInicio")}
              placeholder="Las docentes saludan a los alumnos, se solicita sentarse en los puestos definidos... Actividad de calculo mental..."
              rows={4}
            />
          </Field>
          <Field label="Desarrollo (60 min)" required>
            <Textarea
              value={form.momentoDesarrollo}
              onChange={set("momentoDesarrollo")}
              placeholder="Las docentes escriben en la pizarra una breve descripcion de los contenidos... Trabajo individual con guia..."
              rows={4}
            />
          </Field>
          <Field label="Cierre" required>
            <Textarea
              value={form.momentoCierre}
              onChange={set("momentoCierre")}
              placeholder="Plenario de cierre, revision conjunta, sintesis de la clase..."
              rows={3}
            />
          </Field>
          <Field label="Principios DUA aplicados" tooltip="Indica numero de principio y momento. Ej: '72 - Inicio: variar fuentes; 12 - Desarrollo: preensenar vocabulario'">
            <Textarea
              value={form.principiosDUA}
              onChange={set("principiosDUA")}
              placeholder="Inicio: 7.2 Reducir niveles de incertidumbre (agenda del dia), 2.2 Anular conocimiento previo (calculo mental)&#10;Desarrollo: 1.4 Insertar apoyos visuales, 2.0 Presentar conceptos clave en forma de texto e imagen&#10;Cierre: 4.9 Proporcionar variados monitoreos"
              rows={5}
            />
          </Field>
          <Field label="Evaluacion de la clase">
            <Textarea
              value={form.evaluacionClase}
              onChange={set("evaluacionClase")}
              placeholder="Se utilizara una rubrica para evaluar la clase (Anexo 6)"
              rows={2}
            />
          </Field>
        </Seccion>

        {/* PDF Upload */}
        <div className="card rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-3 mb-1">
            <FileText className="w-5 h-5 text-[#1e3a5f]" />
            <div>
              <p className="font-bold text-gray-900 text-sm">Documento PDF (opcional pero recomendado)</p>
              <p className="text-xs text-gray-500">Sube el documento Word/PDF completo de tu planificacion</p>
            </div>
          </div>
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#1e3a5f]/30 hover:bg-gray-50 transition-colors">
            <Upload className="w-6 h-6 text-gray-400 mb-2" />
            <span className="text-xs text-gray-500">{pdfFile ? pdfFile.name : "Arrastra un PDF o haz clic para seleccionar"}</span>
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        {/* Bottom actions */}
        <div className="flex gap-3 pb-8">
          <button type="button" onClick={() => handleSubmit("BORRADOR")} disabled={loading} className="btn-secondary flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Guardar como borrador
          </button>
          <button type="button" onClick={() => handleSubmit("EN_REVISION")} disabled={loading} className="btn-primary flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2">
            <Send className="w-4 h-4" />
            {loading ? "Enviando..." : "Enviar al Chatbot para analisis"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
