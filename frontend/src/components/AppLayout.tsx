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
  ChevronRight,
  ArrowLeft,
  Info,
  Sparkles,
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

const navItems: NavItem[] = [
  {
    href: "/inicio",
    label: "Inicio / Contexto",
    icon: Info,
    roles: ["ADMIN", "DIRECTIVO", "COORDINADOR", "PROFESOR", "ESTUDIANTE"],
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "DIRECTIVO", "COORDINADOR", "PROFESOR", "ESTUDIANTE"],
  },
  {
    href: "/chatbot",
    label: "Chatbot de Planificación",
    icon: MessageSquare,
    roles: ["ADMIN", "DIRECTIVO", "COORDINADOR", "PROFESOR", "ESTUDIANTE"],
    badge: "IA",
  },
  {
    href: "/planificaciones",
    label: "Planificaciones",
    icon: FileText,
    roles: ["ADMIN", "DIRECTIVO", "COORDINADOR", "PROFESOR", "ESTUDIANTE"],
  },
  {
    href: "/evaluaciones",
    label: "Evaluaciones (Notas de Voz)",
    icon: ClipboardList,
    roles: ["ADMIN", "DIRECTIVO", "COORDINADOR", "PROFESOR"],
  },
  {
    href: "/estudiantes",
    label: "Estudiantes en Práctica",
    icon: Users,
    roles: ["ADMIN", "DIRECTIVO", "COORDINADOR", "PROFESOR"],
  },
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

  const filteredNav = navItems.filter(
    (item) => user && (item.roles.includes(user.rol) || user.rol === "ADMIN")
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isDashboardOrHome = pathname === "/dashboard" || pathname === "/inicio";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#1e3a5f] flex flex-col transition-transform duration-300 shadow-xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shadow-inner">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">
              SGP Matemáticas
            </p>
            <p className="text-blue-200 text-xs">Gestión Pedagógica</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && item.href !== "/inicio" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200",
                  isActive
                    ? "bg-white/20 text-white shadow-sm font-semibold"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-[#2d8a4e] text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-2.5 h-2.5" />
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-blue-200 ml-auto" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-white/10 p-4 bg-[#152b47]/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#2d8a4e] rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
              {user.nombre?.[0]?.toUpperCase()}
              {user.apellido?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {user.nombre} {user.apellido}
              </p>
              <span className="inline-block text-[11px] font-medium bg-white/15 text-blue-100 px-2 py-0.5 rounded-md mt-0.5">
                {user.rol}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-red-200 hover:text-white transition-all text-xs font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900 p-1"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Back to Dashboard Button when inside subpages */}
            {!isDashboardOrHome && (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#1e3a5f] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver al Dashboard
              </Link>
            )}

            {/* Breadcrumb / Title hint */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
              <Link href="/inicio" className="hover:text-[#1e3a5f] font-medium">Inicio</Link>
              <span>/</span>
              <Link href="/dashboard" className="hover:text-[#1e3a5f] font-medium">Dashboard</Link>
              {!isDashboardOrHome && (
                <>
                  <span>/</span>
                  <span className="text-gray-900 font-semibold capitalize">
                    {pathname.replace("/", "")}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick links header */}
          <div className="flex items-center gap-3">
            <Link
              href="/chatbot"
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#2d8a4e] text-white px-3 py-1.5 rounded-lg hover:bg-[#226b3c] transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Probar Chatbot IA
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
