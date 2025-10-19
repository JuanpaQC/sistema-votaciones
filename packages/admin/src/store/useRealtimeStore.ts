import { create } from 'zustand'
import type { RealtimeTick, Election, AuditLog } from '../types'
import { socket } from '../lib/mockSocket'


interface RealtimeState {
tick: RealtimeTick | null
elections: Election[]
audits: AuditLog[]
start: () => void
}


export const useRealtimeStore = create<RealtimeState>((set) => ({
tick: null,
elections: [],
audits: [],
start: () => {
socket.start()
socket.on('tick', (t) => set({ tick: t }))
socket.on('elections', (arr) => set({ elections: arr }))
socket.on('audit', (log) => set((s) => ({ audits: [log, ...s.audits].slice(0, 200) })))
}
}))