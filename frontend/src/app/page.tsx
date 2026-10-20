"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/api";
import { GraduationCap, Eye, EyeOff, BookOpen, Users, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("estudiante@pedagogia.cl");
  const [password, setPassword] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) router.push("/dashboard");
  }, [router]);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await authService.login(email, password);
      const data = res.data;
      localStorage.setItem("token", data.token || data.accessToken);
      localStorage.setItem("user", JSON.stringify({
        id: data.id,
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        rol: data.rol,
      }));
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Credenciales incorrectas. Verifique que el Backend este corriendo en el puerto 8081."
      );
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (rol: "ESTUDIANTE" | "PROFESOR") => {
    if (rol === "ESTUDIANTE") {
      setEmail("estudiante@pedagogia.cl");
    } else {
      setEmail("profesor@pedagogia.cl");
    }
    setPassword("password");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - decorative */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2d8a4e 100%)" }}
      >
        <div className="flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-white" />
          <span className="text-white font-bold text-xl">SGP Matematicas</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Sistema de Gestion de Practicas Pedagogicas
          </h1>
          <p className="text-blue-200 text-base leading-relaxed">
            Plataforma centralizada para el portafolio de estudiantes en practica, retroalimentacion inteligente de planificaciones y digitalizacion de evaluaciones docentes.
          </p>
          <div className="space-y-3">
            {[
              { icon: BookOpen, text: "Sube y analiza planificaciones con IA (Ciclo Inicial a Profesional)" },
              { icon: Sparkles, text: "Chatbot pedagogico con verificacion de DUA, NEET/NEEP y 3 momentos" },
              { icon: Users, text: "Profesor revisa, aprueba o rechaza con comentarios escritos" },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-blue-100 text-sm">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="inline-block px-3 py-1.5 bg-yellow-400/20 border border-yellow-400/30 rounded-lg">
            <p className="text-yellow-200 text-xs font-semibold">Acreditacion CNA 2030 — Evidencia Longitudinal</p>
          </div>
        </div>

        <p className="text-blue-300/60 text-xs">Pedagogia en Matematicas · Universidad · Sprint 1</p>
      </div>

      {/* Right panel - login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <GraduationCap className="w-8 h-8 text-[#1e3a5f]" />
            <span className="font-bold text-xl text-[#1e3a5f]">SGP Matematicas</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Iniciar Sesion</h2>
            <p className="text-gray-500 text-sm mt-1">Accede a tu cuenta de practica pedagogica</p>
          </div>

          {/* Quick access buttons */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Acceso rapido de prueba</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => quickLogin("ESTUDIANTE")}
                className="flex items-center gap-2.5 p-3 bg-white border-2 border-blue-100 hover:border-[#1e3a5f] rounded-xl text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-[#1e3a5f]/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-[#1e3a5f]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Estudiante</p>
                  <p className="text-[10px] text-gray-400">Matias Silva</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => quickLogin("PROFESOR")}
                className="flex items-center gap-2.5 p-3 bg-white border-2 border-green-100 hover:border-[#2d8a4e] rounded-xl text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-green-50 group-hover:bg-[#2d8a4e]/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-[#2d8a4e]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Profesor</p>
                  <p className="text-[10px] text-gray-400">Carlos Mendoza</p>
                </div>
              </button>
            </div>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Correo electronico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Contrasena
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verificando...</>
              ) : (
                "Ingresar al sistema"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
