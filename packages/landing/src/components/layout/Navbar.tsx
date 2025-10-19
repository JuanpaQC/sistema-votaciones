// apps/landing/src/components/Navbar.tsx (o donde esté tu Navbar)
import Button from "../ui/Button";
import { ArrowRight, BarChart3 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const LOGIN_BASE = import.meta.env.VITE_LOGIN_BASE ?? "http://localhost:5174";

export default function Navbar() {
  const location = useLocation();
  const isResultsPage = location.pathname === '/resultados';
  
  // destino al que quieres volver tras iniciar sesión:
  const redirectTo = encodeURIComponent(`${window.location.origin}/dashboard`);
  const loginUrl = `${LOGIN_BASE}/login?redirect=${redirectTo}`;

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-neutral-900/70 border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-primary-500" />
          <span className="font-semibold">Votaciones</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          {!isResultsPage && (
            <>
              <a href="#candidatos" className="hover:text-white">Candidatos</a>
              <a href="#propuesta" className="hover:text-white">Propuesta</a>
              <a href="#faq" className="hover:text-white">Preguntas</a>
            </>
          )}
          
          <Link 
            to={isResultsPage ? "/" : "/resultados"} 
            className="flex items-center gap-2 hover:text-white"
          >
            {isResultsPage ? (
              <>
                <ArrowRight className="rotate-180" size={16} />
                Inicio
              </>
            ) : (
              <>
                <BarChart3 size={16} />
                Resultados
              </>
            )}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Enlace móvil a resultados */}
          <Link 
            to={isResultsPage ? "/" : "/resultados"} 
            className="md:hidden flex items-center gap-1 text-slate-300 hover:text-white"
          >
            {isResultsPage ? (
              <ArrowRight className="rotate-180" size={16} />
            ) : (
              <BarChart3 size={16} />
            )}
          </Link>
          
          <a href={loginUrl} aria-label="Ir a iniciar sesión" className="inline-flex">
            <Button>
              Iniciar sesión <ArrowRight className="ml-2" size={16} />
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
}
