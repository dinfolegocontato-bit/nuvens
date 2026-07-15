"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ComposedChart,
  Line,
  LineChart,
} from "recharts";
import { formatBRL, formatPct, formatNumero } from "@/lib/formatters";
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

/** Donut de receita por plataforma, com a receita total no centro (§6.10). */
export function DonutDesempenho({
  dados,
}: {
  dados: { plataforma: PlataformaValor; receita: number; pct: number }[];
}) {
  const total = dados.reduce((s, d) => s + d.receita, 0);
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative h-[150px] w-[150px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dados}
              dataKey="receita"
              nameKey="plataforma"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={2}
              stroke="none"
            >
              {dados.map((d) => (
                <Cell key={d.plataforma} fill={CORES[d.plataforma]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, n: string) => [
                formatBRL(v),
                ROTULOS[n as PlataformaValor] ?? n,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-legenda text-muted-foreground">Receita</span>
          <span className="text-h3 font-semibold text-strong">{formatBRL(total)}</span>
        </div>
      </div>
      <ul className="flex min-w-0 flex-1 flex-col gap-2">
        {dados.map((d) => (
          <li key={d.plataforma} className="flex items-center gap-2 text-label">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CORES[d.plataforma] }} />
            <span className="text-body">{ROTULOS[d.plataforma]}</span>
            <span className="ml-auto text-muted-foreground">{formatPct(d.pct, 0)}</span>
            <span className="w-24 text-right font-medium text-strong">{formatBRL(d.receita)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Barras agrupadas: ocupação por imóvel, mês atual vs anterior (§6.10). */
export function BarrasOcupacaoComparada({
  dados,
}: {
  dados: { imovel: string; atual: number; anterior: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="imovel" tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
        <YAxis tick={{ fontSize: 12, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} width={40} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip formatter={(v: number) => formatPct(v)} cursor={{ fill: "var(--bg-app)" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => (v === "atual" ? "Mês atual" : "Mês anterior")} />
        <Bar dataKey="anterior" fill="var(--text-muted)" radius={[6, 6, 0, 0]} maxBarSize={28} />
        <Bar dataKey="atual" fill="var(--primary-text)" radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Linha da antecedência média por mês (§6.10). */
export function LinhaAntecedencia({
  dados,
}: {
  dados: { rotulo: string; dias: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
        <Tooltip formatter={(v: number) => [`${formatNumero(v, 1)} dias`, "Antecedência"]} />
        <Line type="monotone" dataKey="dias" stroke="var(--info)" strokeWidth={2.5} dot={{ r: 2.5, fill: "var(--info)" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Barras horizontais: dias da semana mais reservados, com % (§6.10). */
export function BarrasDiasSemana({
  dados,
}: {
  dados: { dia: string; quantidade: number; pct: number }[];
}) {
  const max = Math.max(...dados.map((d) => d.pct), 1);
  return (
    <div className="flex flex-col gap-2">
      {dados.map((d) => (
        <div key={d.dia} className="flex items-center gap-3">
          <span className="w-9 shrink-0 text-legenda text-muted-foreground">{d.dia}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-app">
            <div
              className="h-full rounded-full bg-[var(--primary-text)]"
              style={{ width: `${(d.pct / max) * 100}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-legenda text-muted-foreground">
            {formatPct(d.pct, 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Comparativo mensal: barras de receita + linha de ocupação, eixo duplo (§6.10). */
export function ComparativoMensal({
  dados,
}: {
  dados: { rotulo: string; receita: number; ocupacao: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={dados} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="rotulo" tick={{ fontSize: 12, fill: "var(--text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
        <YAxis
          yAxisId="receita"
          tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={(v) => formatBRL(v).replace("R$", "").trim()}
        />
        <YAxis
          yAxisId="ocupacao"
          orientation="right"
          tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          tickLine={false}
          axisLine={false}
          width={44}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          formatter={(v: number, n: string) =>
            n === "receita" ? [formatBRL(v), "Receita"] : [formatPct(v), "Ocupação"]
          }
          cursor={{ fill: "var(--bg-app)" }}
        />
        <Bar yAxisId="receita" dataKey="receita" fill="var(--primary-text)" radius={[6, 6, 0, 0]} maxBarSize={40} />
        <Line yAxisId="ocupacao" type="monotone" dataKey="ocupacao" stroke="var(--warn)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--warn)" }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
