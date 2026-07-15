/**
 * Cálculos de negócio — fonte única de verdade (PRD §3 "campos derivados").
 * NUNCA gravados no banco; sempre calculados aqui.
 *
 * Este arquivo cobre, nesta fase, os derivados POR RESERVA (usados no servidor
 * e no resumo ao vivo do wizard). Os AGREGADOS do mês (ocupação, ADR, RevPAR,
 * receita líquida, deltas) e seus testes entram na Fase 3.
 */

export type StatusReservaValor = "CONFIRMADA" | "PENDENTE" | "CANCELADA";

export interface ValoresReserva {
  valorDiaria: number;
  taxaLimpeza?: number;
  taxasServicos?: number;
  desconto?: number;
  taxaPlataformaPct?: number;
  checkin: Date | string;
  checkout: Date | string;
  status?: StatusReservaValor;
}

/** Converte "yyyy-mm-dd" | Date para um Date em UTC (meia-noite), sem escorregar de fuso. */
export function paraDataUTC(d: Date | string): Date {
  if (d instanceof Date) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  const [ano, mes, dia] = d.split("-").map(Number);
  return new Date(Date.UTC(ano, (mes ?? 1) - 1, dia ?? 1));
}

const MS_DIA = 24 * 60 * 60 * 1000;

/** noites = diffDays(checkout, checkin). 0 se datas inválidas. */
export function noites(checkin: Date | string, checkout: Date | string): number {
  const ci = paraDataUTC(checkin).getTime();
  const co = paraDataUTC(checkout).getTime();
  const n = Math.round((co - ci) / MS_DIA);
  return n > 0 ? n : 0;
}

function num(v: number | undefined): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** subtotal = noites × valorDiaria + taxaLimpeza + taxasServicos */
export function subtotalReserva(r: ValoresReserva): number {
  return (
    noites(r.checkin, r.checkout) * num(r.valorDiaria) +
    num(r.taxaLimpeza) +
    num(r.taxasServicos)
  );
}

/** valorTotal = subtotal − desconto */
export function valorTotalReserva(r: ValoresReserva): number {
  return subtotalReserva(r) - num(r.desconto);
}

/** valorLiquido = valorTotal × (1 − taxaPlataformaPct/100). 0 se CANCELADA (RN05). */
export function valorLiquidoReserva(r: ValoresReserva): number {
  if (r.status === "CANCELADA") return 0;
  const total = valorTotalReserva(r);
  return total * (1 - num(r.taxaPlataformaPct) / 100);
}

/** Pacote de derivados por reserva, pronto para a UI/API. */
export function derivadosReserva(r: ValoresReserva) {
  return {
    noites: noites(r.checkin, r.checkout),
    subtotal: subtotalReserva(r),
    valorTotal: valorTotalReserva(r),
    valorLiquido: valorLiquidoReserva(r),
  };
}

/** Duas reservas se sobrepõem? Noites em [checkin, checkout) — checkout é dia de saída, livre. */
export function reservasSobrepoem(
  a: { checkin: Date | string; checkout: Date | string },
  b: { checkin: Date | string; checkout: Date | string }
): boolean {
  const aCi = paraDataUTC(a.checkin).getTime();
  const aCo = paraDataUTC(a.checkout).getTime();
  const bCi = paraDataUTC(b.checkin).getTime();
  const bCo = paraDataUTC(b.checkout).getTime();
  return aCi < bCo && aCo > bCi;
}

/** Reserva conflita com um bloqueio? Bloqueio cobre noites [inicio, fim] (fim inclusive). */
export function reservaConflitaBloqueio(
  reserva: { checkin: Date | string; checkout: Date | string },
  bloqueio: { inicio: Date | string; fim: Date | string }
): boolean {
  const ci = paraDataUTC(reserva.checkin).getTime();
  const co = paraDataUTC(reserva.checkout).getTime();
  const bi = paraDataUTC(bloqueio.inicio).getTime();
  const bf = paraDataUTC(bloqueio.fim).getTime();
  // noites da reserva: [ci, co) ; noites bloqueadas: [bi, bf] → intersecção
  return ci <= bf && co > bi;
}
