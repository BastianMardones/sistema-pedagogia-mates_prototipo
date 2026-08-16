"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import {
  FileText,
  MessageSquare,
  Users,
  ClipboardList,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  BookOpen,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { User, UserRole } from "@/types";
import { planificacionService, estudianteService } from "@/lib/api";

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
  href?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      loadData(u.rol);
    }
  }, []);

  const loadData = async (rol: UserRole) => {
    try {
      const [planRes] = await Promise.allSettled([
        planificacionService.getAll(),
      ]);

      if (planRes.status === "fulfilled") {
        const plans = planRes.value.data || [];
        const counts = {
          total: plans.length,
          aprobadas: plans.filter((p: any) => p.estado === "APROBADA").length,
          pendientes: plans.filter(
            (p: any) => p.estado === "ENVIADA" || p.estado === "EN_REVISION"
          ).length,
          rechazadas: plans.filter((p: any) => p.estado === "RECHAZADA").length,
        };
        setStats(counts);
        setRecentItems(plans.slice(0, 5));
      }

      if (rol !== "ESTUDIANTE") {
        const estRes = await estudianteService.getAll().catch(() => null);
        if (estRes) {
          setStats((prev) => ({
            ...prev,
            estudiantes: estRes.data?.length || 0,
          }));
        }
      }
    } catch {
      // Silently handle - API may not be running
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const getStatCards = (): StatCard[] => {
    if (!user) return [];

    const base: StatCard[] = [
      {
        label: "Total Planificaciones",
        value: stats.total ?? "—",
        icon: FileText,
        color: "text-blue-600",
        bg: "bg-blue-50",
        href: "/planificaciones",
      },
      {
        label: "Aprobadas",
        value: stats.aprobadas ?? "—",
        icon: CheckCircle,
        color: "text-green-600",
        bg: "bg-green-50",
      },
      {
        label: "En Revisión",
        value: stats.pendientes ?? "—",
        icon: Clock,
        color: "text-yellow-600",
        bg: "bg-yellow-50",
      },
      {
        label: "Rechazadas",
        value: stats.rechazadas ?? "—",
        icon: AlertCircle,
        color: "text-red-600",
        bg: "bg-red-50",
      },
    ];

    if (user.rol !== "ESTUDIANTE") {
      base.push({
        label: "Estudiantes",
        value: stats.estudiantes ?? "—",
        icon: Users,
        color: "text-purple-600",
        bg: "bg-purple-50",
        href: "/estudiantes",
      });
    }

    return base;
  };

  const getRoleQuickActions = () => {
    if (!user) return [];

    const actions: { href: string; label: string; description: string; icon: React.ElementType; color: string }[] = [];

    if (user.rol === "ESTUDIANTE") {
      actions.push(
        {
          href: "/chatbot",
          label: "Analizar Planificación",
          description: "Sube tu planificación al asistente IA",
          icon: MessageSquare,
          color: "bg-[#2d8a4e]",
        },
        {
          href: "/planificaciones",
          label: "Mis Planificaciones",
          description: "Ver el historial de tus planificaciones",
          icon: FileText,
          color: "bg-[#1e3a5f]",
        }
      );
    } else {
      actions.push(
        {
          href: "/planificaciones",
          label: "Revisar Planificaciones",
          description: "Planificaciones pendientes de revisión",
          icon: FileText,
          color: "bg-[#1e3a5f]",
        },
        {
          href: "/evaluaciones",
          label: "Observaciones de Clase",
          description: "Registrar observaciones y notas de voz",
          icon: ClipboardList,
          color: "bg-[#2d8a4e]",
        },
        {
          href: "/estudiantes",
          label: "Gestionar Estudiantes",
          description: "Ver y gestionar estudiantes del sistema",
          icon: Users,
          color: "bg-purple-600",
        }
      );
    }

    return actions;
  };

  const statusBadge = (estado: string) => {
    const map: Record<string, string> = {
      BORRADOR: "badge-draft",
      ENVIADA: "badge-pending",
      EN_REVISION: "badge-pending",
      APROBADA: "badge-approved",
      RECHAZADA: "badge-rejected",
    };
    return map[estado] || "badge-draft";
  };

  const statusLabel = (estado: string) => {
    const map: Record<string, string> = {
      BORRADOR: "Borrador",
      ENVIADA: "Enviada",
      EN_REVISION: "En Revisión",
      APROBADA: "Aprobada",
      RECHAZADA: "Rechazada",
    };
    return map[estado] || estado;
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1e3a5f] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            {getGreeting()}, {user?.nombre} 👋
          </h1>
          <p className="text-gray-500">
            {new Date().toLocaleDateString("es-CL", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {getStatCards().map((card) => {
            const Icon = card.icon;
            const Wrapper = card.href ? Link : "div";
            return (
              <Wrapper
                key={card.label}
                href={card.href || "#"}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                    <p className="text-3xl font-bold text-gray-800">
                      {loading ? (
                        <span className="inline-block w-8 h-8 bg-gray-100 rounded animate-pulse" />
                      ) : (
                        card.value
                      )}
                    </p>
                  </div>
                  <div className={`${card.bg} ${card.color} p-2.5 rounded-lg`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                {card.href && (
                  <div className="flex items-center gap-1 mt-3 text-xs font-medium text-gray-400 hover:text-[#1e3a5f] transition-colors">
                    Ver todos <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </Wrapper>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Acciones rápidas
            </h2>
            <div className="space-y-3">
              {getRoleQuickActions().map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-4 card hover:shadow-md transition-all group p-4"
                  >
                    <div className={`${action.color} p-2.5 rounded-lg flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm group-hover:text-[#1e3a5f]">
                        {action.label}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#1e3a5f] group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </Link>
                );
              })}
            </div>

            {/* Progress indicator for students */}
            {user?.rol === "ESTUDIANTE" && (
              <div className="card mt-4 bg-gradient-to-br from-[#1e3a5f] to-[#2a4f7c] text-white">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-semibold text-sm">Tu progreso</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-200">Planificaciones</span>
                    <span className="font-medium">{stats.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Aprobadas</span>
                    <span className="font-medium text-green-300">
                      {stats.aprobadas || 0}
                    </span>
                  </div>
                  {stats.total > 0 && (
                    <>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-blue-200">Tasa de aprobación</span>
                          <span>
                            {Math.round(
                              ((stats.aprobadas || 0) / stats.total) * 100
                            )}
                            %
                          </span>
                        </div>
                        <div className="h-2 bg-white/20 rounded-full">
                          <div
                            className="h-2 bg-[#2d8a4e] rounded-full transition-all"
                            style={{
                              width: `${Math.round(
                                ((stats.aprobadas || 0) / stats.total) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Recent Planificaciones */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Planificaciones recientes
              </h2>
              <Link
                href="/planificaciones"
                className="text-sm text-[#1e3a5f] hover:text-[#2a4f7c] font-medium flex items-center gap-1"
              >
                Ver todas <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="card p-0 overflow-hidden">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : recentItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <BookOpen className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">No hay planificaciones aún</p>
                  <p className="text-xs mt-1">
                    {user?.rol === "ESTUDIANTE"
                      ? "Sube tu primera planificación al asistente IA"
                      : "Las planificaciones enviadas aparecerán aquí"}
                  </p>
                  {user?.rol === "ESTUDIANTE" && (
                    <Link href="/chatbot" className="btn-accent mt-4 text-sm py-2 px-4">
                      Comenzar ahora
                    </Link>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentItems.map((plan: any) => (
                    <div
                      key={plan.id}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-[#1e3a5f]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">
                          {plan.titulo}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(plan.createdAt).toLocaleDateString("es-CL")}
                          {plan.estudiante &&
                            ` · ${plan.estudiante.nombre} ${plan.estudiante.apellido}`}
                        </p>
                      </div>
                      <span className={statusBadge(plan.estado)}>
                        {statusLabel(plan.estado)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Analytics card for coordinadores */}
            {(user?.rol === "COORDINADOR" || user?.rol === "DIRECTIVO") && (
              <div className="card mt-4 flex items-center gap-4">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">Reportes y Estadísticas</p>
                  <p className="text-sm text-gray-500">
                    Visualiza métricas de desempeño de todos los estudiantes
                  </p>
                </div>
                <button className="btn-secondary text-sm py-2">Ver reportes</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
