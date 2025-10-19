type Props = {
  name: string
  subtitle?: string // mantener compatibilidad
  avatar?: string   // mantener compatibilidad
  photo?: string    // nuevo campo de foto
  description?: string
  party?: string
  selected?: boolean
  onClick?: () => void
}

function cn(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ")
}

export default function CandidateCard({ name, subtitle, avatar, photo, description, party, selected, onClick }: Props) {
  // Usar photo si está disponible, sino usar avatar (para compatibilidad)
  const imageUrl = photo || avatar;
  // Usar party si está disponible, sino usar subtitle (para compatibilidad)
  const displaySubtitle = party || subtitle;
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "candidate-card relative w-80 rounded-xl border bg-white overflow-hidden text-left",
        "transition-all duration-300 ease-out active:scale-98",
        "touch-manipulation min-h-[200px]",
        selected
          ? "card-selected border-indigo-500 ring-4 ring-indigo-200 ring-offset-2 ring-offset-white bg-gradient-to-br from-indigo-50 to-blue-50 shadow-xl transform -translate-y-2"
          : "border-gray-200 hover:border-gray-300 active:border-indigo-400 shadow-sm"
      )}
      aria-pressed={selected}
    >
      {/* check de selección mejorado */}
      <div
        className={cn(
          "absolute right-3 top-3 h-8 w-8 rounded-full grid place-items-center text-white font-bold z-10 shadow-lg",
          "transition-all duration-300 ease-out",
          selected 
            ? "bg-gradient-to-br from-indigo-600 to-indigo-700 opacity-100 scale-110" 
            : "bg-gray-300 opacity-0 scale-90"
        )}
      >
        <span className="text-sm">✓</span>
      </div>

      <div className="p-4 sm:p-6 h-full flex flex-col">
        <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
          <img
            src={imageUrl}
            alt={name}
            className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover shadow-sm flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "text-base sm:text-lg font-bold leading-tight mb-1 transition-colors duration-200",
              selected ? "text-indigo-800" : "text-gray-900"
            )}>
              {name}
            </h3>
            {displaySubtitle && (
              <p className={cn(
                "text-sm font-medium mb-1 sm:mb-2 transition-colors duration-200",
                selected ? "text-indigo-700" : "text-indigo-600"
              )}>
                {displaySubtitle}
              </p>
            )}
          </div>
        </div>
        
        {description && (
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-3 flex-1">
            {description}
          </p>
        )}
        
        {/* Indicador visual de selección en móvil mejorado */}
        {selected && (
          <div className="mt-3 sm:hidden flex items-center justify-center bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 rounded-xl shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span className="text-sm font-semibold tracking-wide">SELECCIONADO</span>
            </div>
          </div>
        )}
      </div>
    </button>
  )
}
