import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Moeda em Real brasileiro: R$ 1.234,56 */
export function formatBRL(valor: number | string): string {
  const n = typeof valor === "string" ? Number(valor) : valor;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(n) ? n : 0);
}

/** Número com separador brasileiro */
export function formatNumero(valor: number, casas = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(valor);
}

/** Percentual: 12,3% */
export function formatPct(valor: number, casas = 1): string {
  return `${formatNumero(valor, casas)}%`;
}

/** Data dd/mm/aaaa */
export function formatData(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

/** Data por extenso curta: 14 de jul. de 2026 */
export function formatDataExtenso(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return format(d, "dd 'de' MMM 'de' yyyy", { locale: ptBR });
}

/** Delta com sinal para exibição: +12,3% / -4,0% */
export function formatDelta(valor: number, casas = 1): string {
  const sinal = valor > 0 ? "+" : "";
  return `${sinal}${formatNumero(valor, casas)}%`;
}

const NOMES_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Nome do mês (1..12) */
export function nomeMes(mes: number): string {
  return NOMES_MES[mes - 1] ?? "";
}

/** "Julho, 2025" */
export function rotuloPeriodo(mes: number, ano: number): string {
  return `${nomeMes(mes)}, ${ano}`;
}
