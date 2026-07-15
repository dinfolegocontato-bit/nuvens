"use client";

import { cn } from "@/lib/utils";
import { diasNoMes, paraDataUTC } from "@/lib/metricas";
import { rotuloPeriodo } from "@/lib/formatters";
import type { CalendarioResposta } from "@/lib/tipos";

const MS_DIA = 24 * 60 * 60 * 1000;
const CABECALHO = ["D", "S", "T", "Q", "Q", "S", "S"];

/**
 * Mini calendário do mês (PRD §6.8): marca os dias com reserva e destaca hoje.
 */
export function MiniCalendario({ dados }: { dados: CalendarioResposta }) {
  const { mes, ano } = dados;
  const nDias = diasNoMes(mes, ano);
  const primeiroDiaSemana = new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay();

  // dias ocupados por alguma reserva não cancelada
  const ocupados = new Set<number>();
  for (const r of dados.reservas) {
    if (r.status === "CANCELADA") continue;
    let t = paraDataUTC(r.checkin).getTime();
    const fim = paraDataUTC(r.checkout).getTime();
    const mInicio = Date.UTC(ano, mes - 1, 1);
    const mFim = Date.UTC(ano, mes, 1);
    while (t < fim) {
      if (t >= mInicio && t < mFim) ocupados.add(new Date(t).getUTCDate());
      t += MS_DIA;
    }
  }

  const hoje = new Date();
  const diaHoje =
    hoje.getFullYear() === ano && hoje.getMonth() + 1 === mes ? hoje.getDate() : null;

  return (
    <div>
      <p className="mb-2 text-label font-medium text-strong">{rotuloPeriodo(mes, ano)}</p>
      <div className="grid grid-cols-7 gap-1">
        {CABECALHO.map((d, i) => (
          <span key={i} className="py-1 text-center text-[11px] text-muted-foreground">
            {d}
          </span>
        ))}
        {Array.from({ length: primeiroDiaSemana }, (_, i) => (
          <span key={`vazio-${i}`} />
        ))}
        {Array.from({ length: nDias }, (_, i) => i + 1).map((d) => {
          const temReserva = ocupados.has(d);
          const ehHoje = diaHoje === d;
          return (
            <span
              key={d}
              className={cn(
                "flex h-7 items-center justify-center rounded-md text-[11px]",
                ehHoje && "font-semibold ring-1 ring-primary",
                temReserva
                  ? "bg-primary-soft font-medium text-primary-text"
                  : "text-muted-foreground"
              )}
            >
              {d}
            </span>
          );
        })}
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-legenda text-muted-foreground">
        <span className="h-2.5 w-2.5 rounded-sm bg-primary-soft" />
        dias com reserva
      </p>
    </div>
  );
}
