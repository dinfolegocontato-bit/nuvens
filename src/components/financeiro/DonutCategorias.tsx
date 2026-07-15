"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatBRL, formatPct } from "@/lib/formatters";

// Paleta para categorias livres (as categorias surgem do que a Mariana lança)
const PALETA = [
  "var(--primary-text)",
  "var(--info)",
  "var(--warn)",
  "var(--danger)",
  "var(--ia)",
  "var(--booking)",
  "#0EA5E9",
  "#A3A3A3",
];

export function DonutCategorias({
  dados,
}: {
  dados: { categoria: string; valor: number; pct: number }[];
}) {
  const total = dados.reduce((s, d) => s + d.valor, 0);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative h-[150px] w-[150px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dados}
              dataKey="valor"
              nameKey="categoria"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={2}
              stroke="none"
            >
              {dados.map((_, i) => (
                <Cell key={i} fill={PALETA[i % PALETA.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number, n: string) => [formatBRL(v), n]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-legenda text-muted-foreground">Total</span>
          <span className="text-h3 font-semibold text-strong">{formatBRL(total)}</span>
        </div>
      </div>

      <ul className="flex min-w-0 flex-1 flex-col gap-2">
        {dados.map((d, i) => (
          <li key={d.categoria} className="flex items-center gap-2 text-label">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: PALETA[i % PALETA.length] }}
            />
            <span className="truncate text-body">{d.categoria}</span>
            <span className="ml-auto shrink-0 text-muted-foreground">
              {formatPct(d.pct, 1)}
            </span>
            <span className="w-24 shrink-0 text-right font-medium text-strong">
              {formatBRL(d.valor)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
