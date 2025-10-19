export function Card({ children }: { children: React.ReactNode }) {
    return <div className="rounded-2xl border border-white/5 bg-neutral-800/60 shadow-soft">{children}</div>
}
export function CardBody({ children }: { children: React.ReactNode }) {
    return <div className="p-4">{children}</div>
}
export function CardMedia({ children }: { children: React.ReactNode }) {
    return <div className="h-40 w-full overflow-hidden rounded-t-2xl bg-white/5">{children}</div>
}