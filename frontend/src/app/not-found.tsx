import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl border border-gray-100">
        <div className="w-12 h-12 bg-blue-50 text-[#1e3a5f] rounded-2xl flex items-center justify-center mx-auto">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Página no encontrada (404)</h2>
        <p className="text-xs text-gray-500">La ruta que intentas acceder no existe en el sistema.</p>
        <div className="pt-2">
          <Link href="/inicio" className="btn-primary inline-flex text-xs font-bold">
            Volver a Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
