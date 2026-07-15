"use client";

import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

/** Sparkline de 40px para o rodapé do KpiCard (PRD §6.1). */
export function Sparkline({
  dados,
  cor = "var(--primary-text)",
}: {
  dados: { v: number }[];
  cor?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={dados} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Line
          type="monotone"
          dataKey="v"
          stroke={cor}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
