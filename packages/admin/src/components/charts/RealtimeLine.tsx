import { useEffect, useRef, useState } from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useRealtimeStore } from '../../store/useRealtimeStore'
import { dt } from '../../lib/format'


export default function RealtimeLine(){
const tick = useRealtimeStore(s=>s.tick)
const [data, setData] = useState<{name:string, v:number}[]>([])
const ref = useRef<number>(0)


useEffect(()=>{
if(!tick) return
const point = { name: dt(tick.ts), v: tick.votesPerMinute }
setData(prev => [...prev.slice(-59), point])
}, [tick])


return (
<div className="h-64 rounded-2xl bg-neutral-800/60 border border-white/5 p-4">
<div className="text-sm text-slate-400 mb-2">Votos por minuto (tiempo real)</div>
<ResponsiveContainer width="100%" height="100%">
<LineChart data={data} margin={{left: 8, right: 16, top: 8, bottom: 8}}>
<XAxis dataKey="name" hide tick={{fontSize:10}}/>
<YAxis width={40} tick={{fontSize:10}}/>
<Tooltip contentStyle={{ background:'#0b1020', border:'1px solid rgba(255,255,255,0.08)'}}/>
<Line type="monotone" dataKey="v" dot={false} strokeWidth={2}/>
</LineChart>
</ResponsiveContainer>
</div>
)
}