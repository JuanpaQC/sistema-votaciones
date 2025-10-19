import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import { ChevronRight, Users, BarChart3, Clock } from 'lucide-react'

const LOGIN_BASE = import.meta.env.VITE_LOGIN_BASE ?? "http://localhost:5174";

interface VotingProgress {
  eligibleVoters: number;
  votedUsers: number;
  participationRate: string;
  remaining: number;
  lastUpdated: string;
}

interface Election {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
}

export default function Hero() {
  const [votingProgress, setVotingProgress] = useState<VotingProgress | null>(null);
  const [activeElection, setActiveElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  
  // destino al que quieres volver tras iniciar sesión:
  const redirectTo = encodeURIComponent(`${window.location.origin}/dashboard`);
  const loginUrl = `${LOGIN_BASE}/login?redirect=${redirectTo}`;

  useEffect(() => {
    const loadElectionData = async () => {
      try {
        // Cargar elección activa
        const electionResponse = await fetch('http://localhost:4000/api/elections/active');
        if (electionResponse.ok) {
          const electionData = await electionResponse.json();
          setActiveElection(electionData.election);
        }
        
        // Cargar progreso de votación
        const progressResponse = await fetch('http://localhost:4000/api/voting-progress');
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          setVotingProgress(progressData.progress);
        }
      } catch (error) {
        console.error('Error cargando datos de elección:', error);
      } finally {
        setLoading(false);
      }
    };

    loadElectionData();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadElectionData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.45),transparent_60%)]" />
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        {/* Título de la elección activa */}
        {activeElection && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4 }}
            className="text-center mb-6"
          >
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              activeElection.status === 'active' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                activeElection.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-blue-400'
              }`} />
              {activeElection.name}
            </div>
          </motion.div>
        )}
        
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="text-4xl md:text-6xl font-bold leading-tight text-center">
          Conoce a tus <span className="text-primary-400">candidatos</span> y vota informado
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
          className="mt-4 text-lg text-slate-300 max-w-2xl text-center mx-auto">
          Transparencia, propuestas claras y un diseño pensado para que descubras rápido quiénes son, qué plantean y cómo comparar opciones.
        </motion.p>

        {/* Estadísticas de participación */}
        {votingProgress && activeElection?.status === 'active' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-8 max-w-2xl mx-auto"
          >
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-medium text-slate-300 mb-4 text-center">Participación en tiempo real</h3>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users size={16} className="text-blue-400" />
                    <span className="text-sm text-slate-400">Votaron</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{votingProgress.votedUsers}</div>
                  <div className="text-xs text-slate-400">de {votingProgress.eligibleVoters}</div>
                </div>
                
                <div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <BarChart3 size={16} className="text-green-400" />
                    <span className="text-sm text-slate-400">Participación</span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">{votingProgress.participationRate}%</div>
                  <div className="text-xs text-slate-400">del padrón</div>
                </div>
                
                <div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock size={16} className="text-yellow-400" />
                    <span className="text-sm text-slate-400">Restantes</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">{votingProgress.remaining}</div>
                  <div className="text-xs text-slate-400">votantes</div>
                </div>
              </div>
              
              {/* Barra de progreso */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Progreso de votación</span>
                  <span>{votingProgress.participationRate}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${votingProgress.participationRate}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-8 flex gap-3 justify-center">
          <a href="#candidatos">
            <Button>
              Ver candidatos <ChevronRight className="ml-2" size={16} />
            </Button>
          </a>

          <a href={loginUrl}>
            <Button variant="ghost">Ir a iniciar sesión</Button>
          </a>
        </div>
      </div>
    </section>
  )
}
