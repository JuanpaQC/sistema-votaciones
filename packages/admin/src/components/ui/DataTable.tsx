import type { ReactNode } from "react";

export default function DataTable({
  columns,
  rows,
}: {
  columns: {
    key: string;
    label: string;
    width?: string;
    render?: (v: any, row: any) => ReactNode;
  }[];
  rows: any[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-neutral-800/60">
      <table className="min-w-full text-sm">
        <thead className="bg-white/5">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className="text-left px-3 py-2 font-medium text-slate-300"
                style={{ width: c.width }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className="border-t border-white/5 hover:bg-white/[0.04]"
            >
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2 text-slate-200">
                  {c.render ? c.render(r[c.key], r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
