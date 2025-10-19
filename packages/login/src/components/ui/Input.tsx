import * as React from "react"
import { cn } from "../../lib/utils"
import { Eye, EyeOff } from "lucide-react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  status?: "default" | "error" | "success"
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", leftIcon, rightIcon, status = "default", ...props }, ref) => {
    const statusRing =
      status === "error"
        ? "focus-visible:ring-red-500"
        : status === "success"
        ? "focus-visible:ring-emerald-500"
        : "focus-visible:ring-ring"

    const paddingLeft = leftIcon ? "pl-10" : ""
    const paddingRight = rightIcon ? "pr-10" : ""

    return (
      <div className="relative">
        {leftIcon && <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60">{leftIcon}</span>}
        <input
          ref={ref}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-xl border border-input bg-transparent px-3 text-sm shadow-sm",
            "placeholder:text-muted-foreground transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            statusRing,
            paddingLeft,
            paddingRight,
            className
          )}
          aria-invalid={status === "error" || undefined}
          {...props}
        />
        {rightIcon && <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60">{rightIcon}</span>}
      </div>
    )
  }
)
Input.displayName = "Input"

export const InputPassword = React.forwardRef<HTMLInputElement, Omit<InputProps, "type" | "rightIcon">>(
  ({ leftIcon, status, className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)
    return (
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        leftIcon={leftIcon}
        status={status}
        className={className}
        rightIcon={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="p-0.5 rounded-md hover:bg-muted/50"
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        {...props}
      />
    )
  }
)
InputPassword.displayName = "InputPassword"
