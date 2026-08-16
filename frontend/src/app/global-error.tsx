"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Error en la aplicación</h2>
          <p className="text-xs text-gray-500">{error?.message || "Algo salió mal."}</p>
          <button onClick={() => reset()} className="btn-primary text-xs font-bold">
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
