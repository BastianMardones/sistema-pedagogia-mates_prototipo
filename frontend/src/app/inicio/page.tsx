"use client";

import AppLayout from "@/components/AppLayout";
import Link from "next/link";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Award,
  Mic,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Layers,
  FileCheck,
  Building2,
  Users,
  BrainCircuit,
} from "lucide-react";

export default function InicioContextoPage() {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e3a5f] via-[#2a4f7c] to-[#152b47] text-white p-8 sm:p-12 shadow-xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-blue-200 text-xs font-semibold backdrop-blur">
              <GraduationCap className="w-4 h-4" />
              Pedagogía en Educación Matemática · ISW 2026-2
            </div>
            <h1
              className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Sistema de Gestión Pedagógica (SGP)
            </h1>
            <p className="text-blue-100 text-base sm:text-lg leading-relaxed">
              Plataforma integral diseñada para sistematizar la <strong>Línea de Prácticas Progresivas</strong>, digitalizar las evaluaciones de aula con notas de voz y automatizar la retroalimentación de planificaciones mediante un <strong>Chatbot Pedagógico Autónomo</strong>.
            </p>

            <div className="flex flex-wrap gap-3 pt-4">
              <Link
                href="/chatbot"
                className="inline-flex items-center gap-2 bg-[#2d8a4e] hover:bg-[#226b3c] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                Ir al Chatbot de Planificación
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all backdrop-blur"
              >
                Ver Dashboard Principal
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Pilares del Proyecto */}
        <div className="space-y-4">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              ¿Por qué nace este sistema?
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Contexto real extraído del requerimiento de la carrera de Pedagogía en Matemáticas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pilar 1: CNA */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs space-y-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#1e3a5f] flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">
                1. Acreditación CNA (Estándar Nivel 3)
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Por ley, la carrera debe acreditarse antes del <strong>2030</strong>. La CNA exige demostrar un <strong>seguimiento longitudinal de 6 años</strong> que evidencie la progresión del estudiante en todas sus asignaturas de práctica.
              </p>
            </div>

            {/* Pilar 2: Dispersión */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs space-y-3">
              <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">
                2. Centralización de la Información
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Actualmente la información está fragmentada: cada profesor maneja su asignatura aislada en Jadeca, las pautas se evalúan en papel hacia Dutrax, y el coordinador debe compilar informes manuales al final del semestre.
              </p>
            </div>

            {/* Pilar 3: Chatbot */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs space-y-3">
              <div className="w-11 h-11 rounded-xl bg-green-50 text-[#2d8a4e] flex items-center justify-center font-bold">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">
                3. Chatbot Autónomo de Planificación
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Reemplaza la extenuante revisión manual de <strong>35+ estudiantes × 3 planificaciones/semana</strong>. La IA exige una reflexión activa de hasta 5 preguntas pedagógicas antes de entregar retroalimentación estructurada.
              </p>
            </div>
          </div>
        </div>

        {/* La Línea de Prácticas Progresivas */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              Estructura de la Línea de Prácticas (3 Ciclos)
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              Las 6 asignaturas formativas con progresión de complejidad pedagógica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Ciclo 1 */}
            <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1e3a5f] bg-blue-100 px-2.5 py-1 rounded-md">
                  Ciclo Inicial
                </span>
                <span className="text-xs text-gray-500 font-medium">Prácticas 1 y 2</span>
              </div>
              <h4 className="font-bold text-gray-900 text-sm pt-1">
                Aproximación y Ambientes
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Sin intervención directa en aula. Los alumnos conocen el funcionamiento del colegio y realizan simulaciones en la universidad.
              </p>
            </div>

            {/* Ciclo 2 */}
            <div className="border border-yellow-100 bg-yellow-50/50 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-yellow-800 bg-yellow-100 px-2.5 py-1 rounded-md">
                  Ciclo Intermedio
                </span>
                <span className="text-xs text-gray-500 font-medium">Prácticas 3 y 4</span>
              </div>
              <h4 className="font-bold text-gray-900 text-sm pt-1">
                Trabajo Colaborativo e Investigación
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Trabajo en duplas en el colegio. Ejecutan clases guiadas y aplican principios iniciales de DUA (Diseño Universal de Aprendizaje).
              </p>
            </div>

            {/* Ciclo 3 */}
            <div className="border border-green-100 bg-green-50/50 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2d8a4e] bg-green-100 px-2.5 py-1 rounded-md">
                  Ciclo Final
                </span>
                <span className="text-xs text-gray-500 font-medium">Prácticas 5 y 6</span>
              </div>
              <h4 className="font-bold text-gray-900 text-sm pt-1">
                Práctica Pedagógica y Profesional
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                El estudiante asume la titularidad completa de un curso en Matemática y Orientación. Planificaciones completas con DUA y PIE.
              </p>
            </div>
          </div>
        </div>

        {/* Cómo funciona el Chatbot Pedagógico */}
        <div className="bg-gradient-to-br from-gray-900 to-[#1e3a5f] text-white rounded-2xl p-8 shadow-md space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2d8a4e] text-white text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Flujo del Chatbot Explicado
            </div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
              ¿Cómo interactúa el Alumno con la IA?
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm mt-1">
              El chatbot no hace la planificación por el estudiante; actúa como un tutor reflexivo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4 space-y-2 backdrop-blur">
              <div className="w-7 h-7 rounded-full bg-blue-400 text-gray-900 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h4 className="font-semibold text-sm">Carga de Planificación</h4>
              <p className="text-xs text-gray-300">
                El alumno sube su PDF o carga el formato estructurado con los 3 momentos, DUA e inclusión PIE.
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-4 space-y-2 backdrop-blur">
              <div className="w-7 h-7 rounded-full bg-yellow-400 text-gray-900 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h4 className="font-semibold text-sm">Filtro de Mínimos</h4>
              <p className="text-xs text-gray-300">
                La IA verifica si incluye Objetivo, Recursos, Inicio, Desarrollo y Cierre. Si faltan, exige completarlos.
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-4 space-y-2 backdrop-blur">
              <div className="w-7 h-7 rounded-full bg-purple-400 text-gray-900 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h4 className="font-semibold text-sm">5 Preguntas de Reflexión</h4>
              <p className="text-xs text-gray-300">
                Formula hasta 5 preguntas desafiantes sobre coherencia, habilidades y barreras de aprendizaje detectadas.
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-4 space-y-2 backdrop-blur">
              <div className="w-7 h-7 rounded-full bg-green-400 text-gray-900 flex items-center justify-center font-bold text-xs">
                4
              </div>
              <h4 className="font-semibold text-sm">Retroalimentación Final</h4>
              <p className="text-xs text-gray-300">
                Entrega diagnóstico por secciones con fortalezas, sugerencias y visto bueno antes de presentarlo al docente.
              </p>
            </div>
          </div>

          <div className="pt-2 text-center sm:text-left">
            <Link
              href="/chatbot"
              className="inline-flex items-center gap-2 bg-white text-[#1e3a5f] hover:bg-gray-100 px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-[#2d8a4e]" />
              Probar el Chatbot Ahora Mismo
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
