"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles, BookOpen, UserCheck, HelpCircle } from "lucide-react";
import { authService } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@pedagogia.cl");
  const [password, setPassword] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      const data = response.data;

      // Store token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          rol: data.rol,
        })
      );

      router.push("/inicio");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Credenciales incorrectas. Verifique que el Backend esté corriendo en el puerto 8081.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("password");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2a4f7c] to-[#152b47] flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-[#2d8a4e]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 backdrop-blur shadow-inner">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            SGP Matemáticas
          </h1>
          <p className="text-blue-200 text-sm font-medium">
            Sistema de Gestión Pedagógica & Prácticas
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-7 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              Iniciar Sesión
            </h2>
            <button
              onClick={() => setShowInfoModal(true)}
              className="text-xs text-[#1e3a5f] hover:underline font-semibold flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Ver Contexto
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@pedagogia.cl"
                  className="input-field pl-10 text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Conectando...
                </>
              ) : (
                "Ingresar al sistema"
              )}
            </button>
          </form>

          {/* Quick Access Roles */}
          <div className="pt-2 space-y-2.5">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">
              Cuentas rápidas de prueba
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials("admin@pedagogia.cl")}
                className="px-2 py-1.5 rounded-lg border border-gray-200 hover:border-[#1e3a5f] hover:bg-blue-50 text-[11px] font-semibold text-gray-700 transition-colors"
              >
                🏛️ Admin
              </button>
              <button
                type="button"
                onClick={() => fillCredentials("profesor@pedagogia.cl")}
                className="px-2 py-1.5 rounded-lg border border-gray-200 hover:border-[#1e3a5f] hover:bg-blue-50 text-[11px] font-semibold text-gray-700 transition-colors"
              >
                👨‍🏫 Profesor
              </button>
              <button
                type="button"
                onClick={() => fillCredentials("coordinador@pedagogia.cl")}
                className="px-2 py-1.5 rounded-lg border border-gray-200 hover:border-[#1e3a5f] hover:bg-blue-50 text-[11px] font-semibold text-gray-700 transition-colors"
              >
                📋 Directivo
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-200/60 text-xs mt-6">
          Pedagogía en Matemáticas · Acreditación CNA 2030
        </p>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 bg-blue-50 text-[#1e3a5f] rounded-xl flex items-center justify-center font-bold">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  Sobre SGP Matemáticas
                </h3>
                <p className="text-xs text-gray-500">Contexto y Requerimientos del Cliente</p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-gray-600 leading-relaxed max-h-80 overflow-y-auto pr-1">
              <p>
                <strong>🎯 Meta Principal:</strong> Acreditación CNA al 2030 (Estándar Nivel 3). Exige monitoreo longitudinal de las evidencias de las 6 asignaturas de práctica.
              </p>
              <p>
                <strong>🤖 Chatbot de Planificación:</strong> Automatiza la retroalimentación de las 3 planificaciones semanales que hacen los estudiantes, exigiendo responder 5 preguntas de reflexión pedagógica antes de emitir sugerencias.
              </p>
              <p>
                <strong>🎙️ Notas de Voz para Observaciones:</strong> Permite que los tutores graben audios en el aula que se transcriben automáticamente a las pautas de evaluación.
              </p>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="btn-primary w-full py-2.5 text-xs font-bold"
            >
              Entendido, volver al inicio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
