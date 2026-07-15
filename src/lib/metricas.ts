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

/* ============================================================
   Agregados do mês (PRD §3) — puros e testáveis.
   ============================================================ */

/** Nº de dias do mês (1..12). */
export function diasNoMes(mes: number, ano: number): number {
  const inicio = Date.UTC(ano, mes - 1, 1);
  const fim = Date.UTC(ano, mes, 1);
  return Math.round((fim - inicio) / MS_DIA);
}

/**
 * Noites de uma reserva que caem DENTRO do mês (recorte no mês).
 * Reserva ocupa [checkin, checkout); mês é [dia 1, dia 1 do mês seguinte).
 */
export function noitesNoMes(
  checkin: Date | string,
  checkout: Date | string,
  mes: number,
  ano: number
): number {
  const ci = paraDataUTC(checkin).getTime();
  const co = paraDataUTC(checkout).getTime();
  const mInicio = Date.UTC(ano, mes - 1, 1);
  const mFim = Date.UTC(ano, mes, 1);
  const ini = Math.max(ci, mInicio);
  const fim = Math.min(co, mFim);
  const n = Math.round((fim - ini) / MS_DIA);
  return n > 0 ? n : 0;
}

export interface ReservaCalc extends ValoresReserva {
  status: StatusReservaValor;
}

export interface DespesaCalc {
  data: Date | string;
  tipo: "ENTRADA" | "SAIDA";
  valor: number;
}

export interface MetricasMes {
  mes: number;
  ano: number;
  diasMes: number;
  imoveisAtivos: number;
  noitesVendidas: number;
  ocupacao: number;
  adr: number;
  revpar: number;
  receitaBruta: number;
  receitaLiquida: number;
  gastos: number;
  lucroLiquido: number;
  margem: number;
  saldoCaixa: number;
}

/** verifica se uma data cai no mês/ano. */
function dataNoMes(d: Date | string, mes: number, ano: number): boolean {
  const t = paraDataUTC(d);
  return t.getUTCFullYear() === ano && t.getUTCMonth() === mes - 1;
}

/**
 * Todos os KPIs financeiros do mês (PRD §3).
 * A receita de reservas que atravessam o mês é RATEADA pela fração de noites no mês.
 * Reservas CANCELADAS ficam de fora de noites e receita (RN05).
 */
export function metricasDoMes(params: {
  mes: number;
  ano: number;
  reservas: ReservaCalc[];
  despesas: DespesaCalc[];
  imoveisAtivos: number;
  saldoInicialCaixa: number;
}): MetricasMes {
  const { mes, ano, reservas, despesas, imoveisAtivos, saldoInicialCaixa } = params;

  let noitesVendidas = 0;
  let receitaBruta = 0;
  let receitaLiquida = 0;

  for (const r of reservas) {
    if (r.status === "CANCELADA") continue; // RN05
    const nMes = noitesNoMes(r.checkin, r.checkout, mes, ano);
    if (nMes <= 0) continue;
    const nTot = noites(r.checkin, r.checkout);
    const fracao = nTot > 0 ? nMes / nTot : 0;

    noitesVendidas += nMes;
    receitaBruta += valorTotalReserva(r) * fracao;
    receitaLiquida += valorLiquidoReserva(r) * fracao;
  }

  const gastos = despesas
    .filter((d) => d.tipo === "SAIDA" && dataNoMes(d.data, mes, ano))
    .reduce((s, d) => s + (Number(d.valor) || 0), 0);

  const dias = diasNoMes(mes, ano);
  const capacidade = imoveisAtivos * dias;

  const ocupacao = capacidade > 0 ? (noitesVendidas / capacidade) * 100 : 0;
  const adr = noitesVendidas > 0 ? receitaBruta / noitesVendidas : 0;
  const revpar = capacidade > 0 ? receitaBruta / capacidade : 0;
  const lucroLiquido = receitaLiquida - gastos;
  const margem = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0;
  const saldoCaixa = saldoInicialCaixa + receitaLiquida - gastos;

  return {
    mes,
    ano,
    diasMes: dias,
    imoveisAtivos,
    noitesVendidas,
    ocupacao,
    adr,
    revpar,
    receitaBruta,
    receitaLiquida,
    gastos,
    lucroLiquido,
    margem,
    saldoCaixa,
  };
}

/** delta % vs mês anterior: (atual − anterior) / anterior × 100. null se não dá para comparar. */
export function delta(atual: number, anterior: number): number | null {
  if (!Number.isFinite(anterior) || anterior === 0) return null;
  return ((atual - anterior) / anterior) * 100;
}

/** mês/ano anterior a um mês/ano. */
export function mesAnterior(mes: number, ano: number): { mes: number; ano: number } {
  return mes === 1 ? { mes: 12, ano: ano - 1 } : { mes: mes - 1, ano };
}
