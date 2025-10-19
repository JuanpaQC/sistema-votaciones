import { motion } from "framer-motion";

export default function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <motion.div
      layout
      className="rounded-2xl p-4 bg-neutral-800/60 border border-white/5 shadow-soft"
    >
      <div className="text-sm text-slate-400">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </motion.div>
  );
}
