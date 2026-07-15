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

interface Ponto {
  dia: number;
  atual: number;
  anterior: number;
}

function TooltipReceita({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface p-3 text-legenda shadow-lg">
      <p className="mb-1 font-medium text-strong">Dia {label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">
            {p.dataKey === "atual" ? "Este período" : "Mês anterior"}:
          </span>
          <span className="font-medium text-strong">{formatBRL(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function GraficoReceita({ dados }: { dados: Ponto[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={dados} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="dia"
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
        <Tooltip content={<TooltipReceita />} />
        <Line
          type="monotone"
          dataKey="anterior"
          stroke="var(--text-muted)"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="atual"
          stroke="var(--primary-text)"
          strokeWidth={2.5}
          dot={{ r: 2.5, fill: "var(--primary-text)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
