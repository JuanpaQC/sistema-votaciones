import { Shield, Search, ChartBar } from 'lucide-react'


const feats = [
    { icon: Shield, title: 'Transparencia', desc: 'Información clara y verificable para decisiones informadas.' },
    { icon: Search, title: 'Búsqueda sencilla', desc: 'Encuentra candidatos por temas, partido o propuestas clave.' },
    { icon: ChartBar, title: 'Datos abiertos', desc: 'Estadísticas y descargas públicas (cuando inicien las votaciones).' }
]


export default function Features() {
    return (
        <section id="propuesta" className="max-w-6xl mx-auto px-4 py-10 md:py-14">
            <h2 className="text-2xl md:text-3xl font-semibold mb-6">¿Qué ofrece la plataforma?</h2>
            <div className="grid md:grid-cols-3 gap-5">
                {feats.map((f) => {
                    const Icon = f.icon
                    return (
                        <div key={f.title} className="rounded-2xl border border-white/5 bg-neutral-800/60 p-5">
                            <Icon className="mb-3" />
                            <div className="font-semibold">{f.title}</div>
                            <p className="text-sm text-slate-300 mt-1">{f.desc}</p>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}