export type PlataformaValor = "AIRBNB" | "BOOKING" | "DIRETO";
export type ImovelStatusValor = "ATIVO" | "FUTURO" | "INATIVO";

export type TipoReservaValor = "LAZER" | "TRABALHO" | "LONGA_TEMPORADA" | "GRUPO";
export type StatusReservaValor = "CONFIRMADA" | "PENDENTE" | "CANCELADA";

export interface ImovelDTO {
  id: string;
  nome: string;
  cidade: string;
  status: ImovelStatusValor;
  capacidade: number;
  quartos: number;
  banheiros: number;
  fotoUrl: string | null;
  plataformas: PlataformaValor[];
  criadoEm: string;
  _count?: { reservas: number };
}

export interface HospedeDTO {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  documento: string | null;
  observacoes: string | null;
}

export interface ReservaDTO {
  id: string;
  imovelId: string;
  hospedeId: string;
  plataforma: PlataformaValor;
  tipo: TipoReservaValor;
  status: StatusReservaValor;
  codigoExterno: string | null;
  checkin: string; // yyyy-mm-dd
  checkout: string; // yyyy-mm-dd
  numeroHospedes: number;
  valorDiaria: number;
  taxaLimpeza: number;
  taxasServicos: number;
  desconto: number;
  taxaPlataformaPct: number;
  observacoes: string | null;
  criadoEm: string;
  hospede: { id: string; nome: string; email: string | null };
  imovel: { id: string; nome: string; cidade: string; fotoUrl: string | null };
  // derivados (lib/metricas.ts)
  noites: number;
  valorTotal: number;
  valorLiquido: number;
}

import type { MetricasMes } from "@/lib/metricas";

export interface MetricasResposta {
  mes: number;
  ano: number;
  atual: MetricasMes;
  anterior: MetricasMes;
  deltas: {
    receitaLiquida: number | null;
    receitaBruta: number | null;
    ocupacao: number | null;
    noitesVendidas: number | null;
    adr: number | null;
    revpar: number | null;
    lucroLiquido: number | null;
    gastos: number | null;
    margem: number | null;
  };
  avaliacao: { media: number | null; total: number };
  // Séries e listas para os gráficos do Dashboard (§6.2)
  series: {
    receitaDiaria: { dia: number; atual: number; anterior: number }[];
  };
  reservasPorPlataforma: { plataforma: PlataformaValor; quantidade: number }[];
  ocupacaoPorChale: { imovel: string; ocupacao: number }[];
  proximasChegadas: {
    id: string;
    hospedeNome: string;
    imovelNome: string;
    imovelFoto: string | null;
    checkin: string;
    noites: number;
  }[];
  contasAPagar: {
    id: string;
    descricao: string;
    valor: number;
    data: string;
    status: string;
  }[];
}

export interface ConfigDTO {
  id: string;
  saldoInicialCaixa: number;
  taxaAirbnbPct: number;
  taxaBookingPct: number;
  taxaDiretoPct: number;
}

export interface ListaReservas {
  reservas: ReservaDTO[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}
