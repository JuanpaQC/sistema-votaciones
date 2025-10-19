import { create } from 'zustand'
import { AdminStats, CandidateWithVotes, VoterInfo, VoteRecord, getAdminStats, getCandidatesWithVotes, getVoters, getVotesHistory, verifyAdminSession } from '../lib/api'

interface RealDataState {
  // Estados
  loading: boolean
  isAdmin: boolean | null
  stats: AdminStats | null
  candidates: CandidateWithVotes[]
  voters: VoterInfo[]
  votesHistory: VoteRecord[]
  error: string | null
  
  // Acciones
  checkAdminAuth: () => Promise<void>
  loadStats: () => Promise<void>
  loadCandidates: () => Promise<void>
  loadVoters: () => Promise<void>
  loadVotesHistory: () => Promise<void>
  refreshAll: () => Promise<void>
  startPolling: () => void
  stopPolling: () => void
}

// Timer para polling
let pollingTimer: number | null = null

export const useRealDataStore = create<RealDataState>((set, get) => ({
  // Estado inicial
  loading: false,
  isAdmin: null,
  stats: null,
  candidates: [],
  voters: [],
  votesHistory: [],
  error: null,
  
  // Verificar autenticación admin
  checkAdminAuth: async () => {
    try {
      set({ loading: true, error: null })
      const isAdmin = await verifyAdminSession()
      set({ isAdmin })
    } catch (error: any) {
      set({ error: error.message || 'Error verificando autenticación', isAdmin: false })
    } finally {
      set({ loading: false })
    }
  },
  
  // Cargar estadísticas
  loadStats: async () => {
    try {
      set({ loading: true, error: null })
      const stats = await getAdminStats()
      set({ stats })
    } catch (error: any) {
      set({ error: error.message || 'Error cargando estadísticas' })
    } finally {
      set({ loading: false })
    }
  },
  
  // Cargar candidatos
  loadCandidates: async () => {
    try {
      set({ loading: true, error: null })
      const candidates = await getCandidatesWithVotes()
      set({ candidates })
    } catch (error: any) {
      set({ error: error.message || 'Error cargando candidatos' })
    } finally {
      set({ loading: false })
    }
  },
  
  // Cargar votantes
  loadVoters: async () => {
    try {
      set({ loading: true, error: null })
      const voters = await getVoters()
      set({ voters })
    } catch (error: any) {
      set({ error: error.message || 'Error cargando votantes' })
    } finally {
      set({ loading: false })
    }
  },
  
  // Cargar historial de votos
  loadVotesHistory: async () => {
    try {
      set({ loading: true, error: null })
      const votesHistory = await getVotesHistory()
      set({ votesHistory })
    } catch (error: any) {
      set({ error: error.message || 'Error cargando historial' })
    } finally {
      set({ loading: false })
    }
  },
  
  // Refrescar todos los datos
  refreshAll: async () => {
    const state = get()
    if (state.isAdmin) {
      await Promise.all([
        state.loadStats(),
        state.loadCandidates(),
        state.loadVoters(),
        state.loadVotesHistory()
      ])
    }
  },
  
  // Iniciar polling para actualizar datos en tiempo real
  startPolling: () => {
    const { refreshAll, stopPolling } = get()
    
    // Limpiar timer anterior si existe
    stopPolling()
    
    // Actualizar cada 5 segundos
    pollingTimer = setInterval(() => {
      refreshAll()
    }, 5000)
  },
  
  // Detener polling
  stopPolling: () => {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
  }
}))

// Hook para stats computadas en tiempo real
export function useComputedStats() {
  const { stats, candidates, voters, votesHistory } = useRealDataStore()
  
  if (!stats) return null
  
  // Calcular votos por minuto (basado en últimos votos)
  const now = Date.now()
  const oneMinuteAgo = now - 60000
  const recentVotes = votesHistory.filter(vote => 
    new Date(vote.ts).getTime() > oneMinuteAgo
  )
  const votesPerMinute = recentVotes.length
  
  // Participación porcentual
  const participationPercent = Math.round(stats.participation * 100)
  
  return {
    totalVotes: stats.totalVotes,
    totalVoters: stats.totalVoters,
    participation: stats.participation,
    participationPercent,
    candidatesCount: stats.candidatesCount,
    votesPerMinute,
    hasVoted: voters.filter(v => v.hasVoted).length,
    pending: voters.filter(v => !v.hasVoted).length
  }
}