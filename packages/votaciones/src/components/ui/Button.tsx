import { type ButtonHTMLAttributes, forwardRef } from "react"

function cn(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ")
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost"
}

const variants: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 shadow-soft active:scale-[0.98] transition-all focus:ring-2 focus:ring-indigo-500",
  outline:
    "border border-gray-300 text-gray-800 hover:bg-gray-50 active:scale-[0.98] transition-all focus:ring-2 focus:ring-gray-300",
  ghost:
    "text-gray-600 hover:bg-gray-100 active:scale-[0.98] transition-all focus:ring-2 focus:ring-gray-200",
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled}                      // ✅ hace que el botón sea realmente inactivo
      aria-disabled={disabled ? "true" : undefined}
      className={cn(
        "px-4 py-2.5 rounded-xl font-medium text-sm duration-150 ease-soft select-none",
        variants[variant],
        disabled &&
          "opacity-60 cursor-not-allowed pointer-events-none", // ✅ se ve y se comporta como disabled
        className
      )}
      {...rest}                                // ✅ onClick, type, etc.
    />
  )
})
