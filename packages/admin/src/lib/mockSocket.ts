import { EventEmitter } from 'events'
import type { RealtimeTick, Election, AuditLog } from '../types'


export class MockSocket extends EventEmitter {
private timer?: number
private current: RealtimeTick
elections: Election[]
audits: AuditLog[] = []


constructor() {
super()
this.current = { ts: Date.now(), votesPerMinute: 45, participation: 0.21, queue: 3 }
this.elections = [
{ id: 'e-2025', name: 'Elección General 2025', startAt: '2025-11-01', endAt: '2025-11-02', status: 'draft', totalVoters: 42000, emittedVotes: 0, participation: 0 },
{ id: 'e-centro', name: 'Centro Universitario TEC', startAt: '2025-10-15', endAt: '2025-10-15', status: 'scheduled', totalVoters: 5600, emittedVotes: 0, participation: 0 },
{ id: 'e-piloto', name: 'Piloto Municipal', startAt: '2025-10-20', endAt: '2025-10-20', status: 'open', totalVoters: 12000, emittedVotes: 3560, participation: 3560/12000 },
]
}


start() {
// @ts-ignore - window interval id typing en Vite
this.timer = setInterval(() => {
const delta = (Math.random() * 10) - 5
const vpm = Math.max(0, this.current.votesPerMinute + delta)
const part = Math.min(1, Math.max(0, this.current.participation + (vpm/60000)))
const queue = Math.max(0, Math.round(this.current.queue + (Math.random()*2 - 1)))
this.current = { ts: Date.now(), votesPerMinute: Number(vpm.toFixed(1)), participation: part, queue }


// mutamos una elección "open"
this.elections = this.elections.map(e => e.status === 'open' ? {
...e,
emittedVotes: Math.min(e.totalVoters, e.emittedVotes + Math.round(vpm/2)),
participation: Math.min(1, (e.emittedVotes + Math.round(vpm/2)) / e.totalVoters)
} : e)


if (Math.random() < 0.15) {
const log: AuditLog = {
id: crypto.randomUUID(), ts: Date.now(), type: Math.random() < 0.8 ? 'INFO' : 'WARN',
actor: ['system', 'admin@tec.cr', 'api-gateway'][Math.floor(Math.random()*3)],
message: ['Sincronización con CDN','Recuento parcial actualizado','IP sospechosa mitigada','Backup completado'][Math.floor(Math.random()*4)]
}
this.audits.unshift(log)
this.emit('audit', log)
}


this.emit('tick', this.current)
this.emit('elections', this.elections)
}, 1000)
}


stop() { if (this.timer) clearInterval(this.timer) }
}


export const socket = new MockSocket()