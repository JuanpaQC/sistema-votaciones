type Props = {
  length?: number
  value: string
  onChange: (v: string) => void
}

export default function CodeInput({ length = 6, value, onChange }: Props) {
  return (
    <input
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={length}
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      className="w-full border-2 border-gray-300 rounded-xl px-4 py-4 sm:py-3 font-mono tracking-widest text-center text-xl sm:text-lg
                 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1
                 transition-all duration-150 outline-none placeholder:text-gray-400 touch-manipulation
                 min-h-[56px] sm:min-h-[48px]"
      placeholder={"•".repeat(length)}
    />
  )
}
