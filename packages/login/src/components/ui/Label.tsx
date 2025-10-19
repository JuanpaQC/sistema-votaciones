import * as React from "react"
import { cn } from "../../lib/utils"

export const Label = React.forwardRef<
  React.ElementRef<"label">,
  React.ComponentPropsWithoutRef<"label">
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("text-sm font-medium leading-none", "peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
    {...props}
  />
))
Label.displayName = "Label"

export function FieldMessage({
  id,
  children,
  tone = "default",
}: {
  id?: string
  children?: React.ReactNode
  tone?: "default" | "error" | "success"
}) {
  const styles =
    tone === "error" ? "text-xs text-red-600" : tone === "success" ? "text-xs text-emerald-600" : "text-xs text-muted-foreground"
  return (
    <p id={id} role={tone === "error" ? "alert" : undefined} className={styles}>
      {children}
    </p>
  )
}
