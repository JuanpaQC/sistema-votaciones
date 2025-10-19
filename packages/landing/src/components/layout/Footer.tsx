export default function Footer() {
    return (
        <footer className="mt-16 border-t border-white/5">
            <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-slate-400 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>© {new Date().getFullYear()} Sistema de Votaciones</div>
                <div className="flex gap-4">
                    <a href="#" className="hover:text-white">Términos</a>
                    <a href="#" className="hover:text-white">Privacidad</a>
                    <a href="#" className="hover:text-white">Contacto</a>
                </div>
            </div>
        </footer>
    )
}