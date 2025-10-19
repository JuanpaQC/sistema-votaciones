import { Outlet, useLocation } from "react-router-dom"

export default function AppShell() {
  const { pathname } = useLocation()
  const isBallot =
    pathname.endsWith("/ballot") ||
    /\/[^/]+\/ballot$/.test(pathname) // ej: /tec-consejo-2025/ballot

  return (
    <div className="min-h-screen bg-white">
      <main
        className={
          isBallot
            ? // Full-bleed para papeleta
              "px-4 md:px-8 lg:px-12 py-8"
            : // Centrado para pantallas normales (login, etc.)
              "flex items-center justify-center px-6 sm:px-12 py-12"
        }
      >
        <div
          className={
            isBallot
              ? "mx-auto w-full max-w-[1600px]" // o max-w-screen-2xl si prefieres
              : "w-full max-w-2xl animate-slide-up"
          }
        >
          <Outlet />
        </div>
      </main>
    </div>
  )
}
