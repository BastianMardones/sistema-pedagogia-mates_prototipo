"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  ClipboardList,
  Users,
  LogOut,
  GraduationCap,
  Menu,
  X,
  Plus,
  BookOpen,
  Info,
  CheckCircle,
} from "lucide-react";
import { User, UserRole } from "@/types";
import clsx from "clsx";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  badge?: string;
}

const navItemsEstudiante: NavItem[] = [
  { href: "/dashboard", label: "Mi Dashboard", icon: LayoutDashboard, roles: ["ESTUDIANTE"] },
  { href: "/planificaciones", label: "Mis Planificaciones", icon: FileText, roles: ["ESTUDIANTE"] },
  { href: "/planificaciones/nueva", label: "Nueva Planificacion", icon: Plus, roles: ["ESTUDIANTE"] },
  { href: "/chatbot", label: "Chatbot Pedagogico", icon: MessageSquare, roles: ["ESTUDIANTE"], badge: "IA" },
  { href: "/inicio", label: "Contexto del Proyecto", icon: Info, roles: ["ESTUDIANTE"] },
];

const navItemsProfesor: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["PROFESOR"] },
  { href: "/planificaciones", label: "Planificaciones para Revisar", icon: FileText, roles: ["PROFESOR"], badge: "!" },
  { href: "/estudiantes", label: "Mis Estudiantes", icon: Users, roles: ["PROFESOR"] },
  { href: "/evaluaciones", label: "Evaluaciones y Observaciones", icon: ClipboardList, roles: ["PROFESOR"] },
  { href: "/inicio", label: "Contexto del Proyecto", icon: Info, roles: ["PROFESOR"] },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!stored || !token) {
      router.push("/");
      return;
    }
    try {
      setUser(JSON.parse(stored));
    } catch {
      router.push("/");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (!user) return null;

  const navItems = user.rol === "PROFESOR" ? navItemsProfesor : navItemsEstudiante;

  const rolLabel = user.rol === "PROFESOR" ? "Profesor Tutor" : "Estudiante en Practica";
  const rolColor = user.rol === "PROFESOR"
    ? "bg-green-100 text-green-800"
    : "bg-blue-100 text-[#1e3a5f]";

  const Sidebar = () => (
    <aside
      className="h-full flex flex-col"
      style={{ background: "linear-gradient(180deg, #1e3a5f 0%, #152b47 100%)" }}
    >
      {/* Header */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">SGP Matematicas</p>
            <p className="text-blue-300/70 text-[10px]">Practicas Pedagogicas</p>
          </div>
        </div>

        {/* User card */}
        <div className="bg-white/10 rounded-xl p-3 border border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">
                {user.nombre?.charAt(0)}{user.apellido?.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-xs truncate">{user.nombre} {user.apellido}</p>
              <span className={clsx("inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5", rolColor)}>
                {rolLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150",
                isActive
                  ? "bg-white/20 text-white shadow-sm"
                  : "text-blue-200 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className={clsx(
                  "px-1.5 py-0.5 rounded-md text-[9px] font-bold",
                  item.badge === "IA"
                    ? "bg-yellow-400/20 text-yellow-300"
                    : "bg-red-400/30 text-red-300"
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-blue-300 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesion
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 flex-col flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-72 flex flex-col shadow-xl z-50">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#1e3a5f]" />
            <span className="font-bold text-[#1e3a5f] text-sm">SGP Matematicas</span>
          </div>
          <div className="w-9" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
