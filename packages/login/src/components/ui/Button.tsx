import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
    "disabled:pointer-events-none disabled:opacity-50 active:scale-[.985]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:shadow-lg/40 hover:brightness-[1.02]",
        outline: "border border-input bg-transparent hover:bg-accent hover:text-foreground",
        ghost: "hover:bg-accent hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground shadow hover:shadow-lg/40",
        subtle: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        gradient:
          "text-white shadow-lg bg-[linear-gradient(135deg,#2563eb_0%,#06b6d4_100%)] " +
          "hover:shadow-[0_8px_30px_-12px_rgba(37,99,235,.45)]",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, fullWidth, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        data-loading={loading || undefined}
        aria-busy={loading || undefined}
        className={cn(buttonVariants({ variant, size, fullWidth }), "motion-safe:transition-[transform,box-shadow]", className)}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"
