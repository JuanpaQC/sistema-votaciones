import { cn } from './utils'


type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'ghost'
}


export default function Button({ className, variant = 'primary', ...rest }: Props) {
    const base = 'inline-flex items-center justify-center px-4 py-2 rounded-2xl text-sm font-medium transition'
    const styles = variant === 'primary'
        ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-soft'
        : 'bg-white/5 hover:bg-white/10 text-slate-100 border border-white/10'
    return <button className={cn(base, styles, className)} {...rest} />
}