"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { PlataformaValor } from "@/lib/tipos";

const CORES: Record<PlataformaValor, string> = {
  AIRBNB: "var(--airbnb)",
  BOOKING: "var(--booking)",
  DIRETO: "var(--direto)",
};
const ROTULOS: Record<PlataformaValor, string> = {
  AIRBNB: "Airbnb",
  BOOKING: "Booking.com",
  DIRETO: "Direto",
};

export function DonutPlataformas({
  dados,
}: {
  dados: { plataforma: PlataformaValor; quantidade: number }[];
}) {
  const total = dados.reduce((s, d) => s + d.quantidade, 0);

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-[140px] w-[140px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dados}
              dataKey="quantidade"
              nameKey="plataforma"
              innerRadius={44}
              outerRadius={66}
              paddingAngle={2}
              stroke="none"
            >
              {dados.map((d) => (
                <Cell key={d.plataforma} fill={CORES[d.plataforma]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, n: string) => [
                `${v} reserva(s)`,
                ROTULOS[n as PlataformaValor] ?? n,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-h3 font-semibold text-strong">{total}</span>
          <span className="text-legenda text-muted-foreground">reservas</span>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {dados.map((d) => (
          <li key={d.plataforma} className="flex items-center gap-2 text-label">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CORES[d.plataforma] }} />
            <span className="text-body">{ROTULOS[d.plataforma]}</span>
            <span className="ml-auto font-medium text-strong">{d.quantidade}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
