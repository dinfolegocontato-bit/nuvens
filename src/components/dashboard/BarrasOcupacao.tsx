"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatPct } from "@/lib/formatters";

export function BarrasOcupacao({
  dados,
}: {
  dados: { imovel: string; ocupacao: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="imovel"
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          tickLine={false}
          axisLine={false}
          width={40}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          formatter={(v: number) => [formatPct(v), "Ocupação"]}
          cursor={{ fill: "var(--bg-app)" }}
        />
        <Bar dataKey="ocupacao" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {dados.map((_, i) => (
            <Cell key={i} fill="var(--primary-text)" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
