import { cn } from './utils'
export default function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
    return <span className={cn('text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-200', className)}>{children}</span>
}