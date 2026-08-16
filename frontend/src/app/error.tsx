"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl border border-gray-100">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Ocurrió un error inesperado</h2>
        <p className="text-xs text-gray-500">{error?.message || "Error al renderizar el componente."}</p>
        <div className="flex gap-3 justify-center pt-2">
          <button onClick={() => reset()} className="btn-primary text-xs font-bold flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5" />
            Reintentar
          </button>
          <Link href="/inicio" className="btn-secondary text-xs font-bold">
            Ir a Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
