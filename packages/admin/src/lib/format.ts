export const pct = (n: number) => `${(n * 100).toFixed(1)}%`
export const nfmt = (n: number) => new Intl.NumberFormat().format(n)
export const dt = (ts: number) => new Date(ts).toLocaleTimeString()