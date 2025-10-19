const qas = [
    { q: '¿La información es oficial?', a: 'Es un prototipo visual. Cuando esté en producción, toda la información se conectará a las fuentes oficiales y auditorías.' },
    { q: '¿Puedo votar desde aquí?', a: 'Esta es solo la landing para conocer candidatos. El voto se realizará desde el portal autenticado cuando se habilite.' },
    { q: '¿Cómo reporto errores?', a: 'Habrá un formulario de contacto y un repositorio público para issues.' }
]


export default function FAQ() {
    return (
        <section id="faq" className="max-w-6xl mx-auto px-4 py-10 md:py-14">
            <h2 className="text-2xl md:text-3xl font-semibold mb-6">Preguntas frecuentes</h2>
            <div className="grid md:grid-cols-3 gap-5">
                {qas.map((x) => (
                    <div key={x.q} className="rounded-2xl border border-white/5 bg-neutral-800/60 p-5">
                        <div className="font-medium">{x.q}</div>
                        <p className="text-sm text-slate-300 mt-1">{x.a}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}