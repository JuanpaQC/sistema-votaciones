import { Suspense, useEffect, useState } from "react";
import { Route, Routes, NavLink } from "react-router-dom";
import { routes } from "./routes";
import { useRealtimeStore } from "./store/useRealtimeStore";
import { useUIStore } from "./store/useUIStore";
import {
  Menu,
  BarChart2,
  Settings,
  Users,
  Vote,
  ListChecks,
  ShieldAlert,
} from "lucide-react";

export default function App() {
  const start = useRealtimeStore((s) => s.start);
  const open = useUIStore((s) => s.sidebarOpen);
  const setOpen = useUIStore((s) => s.setSidebar);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    // MODO DESARROLLO: Bypass de autenticación para pruebas
    // TODO: Restaurar autenticación completa en producción
    console.log('MODO DESARROLLO: Auto-login como admin');
    
    // Crear sesión de admin automática
    const adminSession = {
      email: 'admin@demo.com',
      password: 'admin123',
      role: 'admin',
      remember: false
    };
    
    sessionStorage.setItem('session', JSON.stringify(adminSession));
    setIsAdmin(true);
    console.log('Admin auto-logueado para desarrollo');

    // Iniciar el store original
    start();
  }, [start]);

  // Mostrar loading mientras verifica auth
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-gray-400">Verificando permisos de administrador...</p>
        </div>
      </div>
    );
  }

  // Mostrar mensaje si no es admin
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="text-6xl">🔒</div>
          <div>
            <h2 className="text-2xl font-bold text-red-400 mb-2">Acceso Denegado</h2>
            <p className="text-gray-400 mb-6">Necesitas permisos de administrador para acceder a este panel.</p>
          </div>
          <div className="space-y-3">
            <a 
              href="http://localhost:5174" 
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir al Login
            </a>
            <div className="text-sm text-gray-500">
              <p><strong>Credenciales de admin:</strong></p>
              <p>admin@demo.com / admin123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 grid" 
         style={{ gridTemplateColumns: open ? "260px 1fr" : "64px 1fr" }}>
      
      {/* Sidebar */}
      <aside className={`
        relative h-full w-64 transform transition-all duration-300 ease-in-out
        bg-neutral-800/95 backdrop-blur border-r border-white/10
        ${!open ? 'w-16' : 'w-64'}
      `}>
        {/* Header */}
        <div className="flex p-4 items-center gap-2">
          <button
            className="p-2 rounded-xl hover:bg-white/10"
            onClick={() => setOpen(!open)}
          >
            <Menu size={20} className="text-white" />
          </button>
          {open && <span className="font-bold text-white">Admin Votos</span>}
        </div>

        <nav className="px-2 space-y-2 pb-6">
          <Item to="/" icon={<BarChart2 size={18} />}>
            Dashboard
          </Item>
          <Item to="/elections" icon={<ListChecks size={18} />}>
            Elecciones
          </Item>
          <Item to="/candidates" icon={<Vote size={18} />}>
            Candidatos
          </Item>
          <Item to="/voters" icon={<Users size={18} />}>
            Padrones
          </Item>
          <Item to="/audits" icon={<ShieldAlert size={18} />}>
            Auditoría
          </Item>
          <Item to="/settings" icon={<Settings size={18} />}>
            Ajustes
          </Item>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 p-6">
        <Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <div className="animate-pulse text-gray-400">Cargando…</div>
          </div>
        }>
          <Routes>
            {routes.map((r, i) => (
              <Route key={i} path={r.path} element={<r.element />} />
            ))}
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

function Item({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const open = useUIStore((s) => s.sidebarOpen);
  
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/10 transition-colors ${
          isActive ? "bg-white/10 text-white" : "text-slate-300"
        } ${!open ? 'justify-center' : ''}`
      }
      title={!open ? children as string : ''}
    >
      {icon}
      {open && <span>{children}</span>}
    </NavLink>
  );
}
