"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatBRL } from "@/lib/formatters";
import type { PontoEvolucao } from "@/lib/tipos";

const SERIES = [
  { chave: "receitaLiquida", label: "Receita líquida", cor: "var(--primary-text)" },
  { chave: "gastos", label: "Gastos", cor: "var(--danger)" },
  { chave: "lucro", label: "Lucro", cor: "var(--info)" },
] as const;

function TooltipEvolucao({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface p-3 text-legenda shadow-lg">
      <p className="mb-1 font-medium text-strong">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">
            {SERIES.find((s) => s.chave === p.dataKey)?.label}:
          </span>
          <span className="font-medium text-strong">{formatBRL(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function GraficoEvolucao({ dados }: { dados: PontoEvolucao[] }) {
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-legenda text-muted-foreground">
        {SERIES.map((s) => (
          <span key={s.chave} className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full" style={{ backgroundColor: s.cor }} />
            {s.label}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={dados} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="rotulo"
            tick={{ fontSize: 12, fill: "var(--text-muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--text-muted)" }}
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(v) => formatBRL(v).replace("R$", "").trim()}
          />
          <Tooltip content={<TooltipEvolucao />} />
          {SERIES.map((s) => (
            <Line
              key={s.chave}
              type="monotone"
              dataKey={s.chave}
              stroke={s.cor}
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: s.cor }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
