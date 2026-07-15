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

export type MotivoBloqueioValor = "BLOQUEIO" | "MANUTENCAO";

export interface BloqueioDTO {
  id: string;
  imovelId: string;
  motivo: MotivoBloqueioValor;
  inicio: string; // yyyy-mm-dd
  fim: string; // yyyy-mm-dd
  nota: string | null;
}

export interface CalendarioResposta {
  mes: number;
  ano: number;
  imoveis: {
    id: string;
    nome: string;
    capacidade: number;
    fotoUrl: string | null;
    status: ImovelStatusValor;
  }[];
  reservas: {
    id: string;
    imovelId: string;
    hospedeNome: string;
    plataforma: PlataformaValor;
    status: StatusReservaValor;
    checkin: string;
    checkout: string;
    numeroHospedes: number;
    valorTotal: number;
  }[];
  bloqueios: BloqueioDTO[];
}

export type TipoDespesaValor = "ENTRADA" | "SAIDA";
export type StatusDespesaValor = "PAGO" | "PENDENTE";

export interface DespesaDTO {
  id: string;
  imovelId: string | null;
  data: string; // yyyy-mm-dd
  descricao: string;
  categoria: string;
  fornecedor: string | null;
  tipo: TipoDespesaValor;
  valor: number;
  status: StatusDespesaValor;
}

/** Linha da tabela "Transações recentes" (§6.5) */
export interface TransacaoDTO {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  origem: string | null;
  tipo: TipoDespesaValor;
  valor: number;
  status: StatusDespesaValor;
  /** true = veio de reserva confirmada (somente leitura) */
  automatico: boolean;
}

export interface PontoEvolucao {
  rotulo: string;
  mes: number;
  ano: number;
  receitaLiquida: number;
  gastos: number;
  lucro: number;
}

export interface FinanceiroResposta {
  mes: number;
  ano: number;
  kpis: {
    receitaLiquida: number;
    receitaBruta: number;
    gastos: number;
    lucroLiquido: number;
    margem: number;
  };
  deltas: {
    receitaLiquida: number | null;
    receitaBruta: number | null;
    gastos: number | null;
    lucroLiquido: number | null;
    margem: number | null;
  };
  evolucaoSeisMeses: PontoEvolucao[];
  evolucaoAno: PontoEvolucao[];
  gastosPorCategoria: { categoria: string; valor: number; pct: number }[];
  fluxoCaixa: {
    saldoInicial: number;
    entradas: number;
    saidas: number;
    saldoAtual: number;
  };
  resumoPorPlataforma: { plataforma: PlataformaValor; receita: number; pct: number }[];
  transacoes: TransacaoDTO[];
  contasAPagar: DespesaDTO[];
}

export interface HospedeLinhaDTO {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  totalReservas: number;
  /** RN06: a partir da 2ª reserva não cancelada */
  recorrente: boolean;
  totalGasto: number;
  status: "ATIVO" | "FUTURO" | "CANCELADO";
  ultimaEstadia: {
    checkin: string;
    checkout: string;
    noites: number;
    imovelNome: string;
    plataforma: PlataformaValor;
  } | null;
}

export interface HospedesResposta {
  kpis: {
    total: number;
    novos: number;
    recorrentes: number;
    avaliacaoMedia: number | null;
    totalAvaliacoes: number;
  };
  hospedes: HospedeLinhaDTO[];
  origemPorPlataforma: { plataforma: PlataformaValor; quantidade: number }[];
  recorrentesTop3: { id: string; nome: string; totalGasto: number }[];
  proximasChegadas: {
    id: string;
    hospedeNome: string;
    imovelNome: string;
    checkin: string;
  }[];
}

export interface AvaliacaoDTO {
  id: string;
  imovelId: string;
  reservaId: string | null;
  hospedeNome: string;
  plataforma: PlataformaValor;
  nota: number;
  data: string; // yyyy-mm-dd
  comentario: string | null;
  respostaEnviada: string | null;
  imovelNome: string;
}

export interface AvaliacoesResposta {
  resumo: {
    media: number | null;
    total: number;
    /** distribuição 5→1 */
    distribuicao: { nota: number; quantidade: number; pct: number }[];
  };
  avaliacoes: AvaliacaoDTO[];
}

export interface AnalyticsResposta {
  mes: number;
  ano: number;
  kpis: {
    receitaTotal: number;
    ocupacao: number;
    noitesVendidas: number;
    adr: number;
    revpar: number;
    avaliacaoMedia: number | null;
    totalAvaliacoes: number;
  };
  deltas: {
    receitaTotal: number | null;
    ocupacao: number | null;
    noitesVendidas: number | null;
    adr: number | null;
    revpar: number | null;
  };
  /** séries curtas (6 meses) para os sparklines dos KPIs */
  sparklines: {
    receitaTotal: { v: number }[];
    ocupacao: { v: number }[];
    noitesVendidas: { v: number }[];
    adr: { v: number }[];
    revpar: { v: number }[];
  };
  receitaAoLongo: { dia: number; atual: number; anterior: number }[];
  desempenhoPorPlataforma: { plataforma: PlataformaValor; receita: number; pct: number }[];
  distribuicaoPorCanal: { plataforma: PlataformaValor; quantidade: number }[];
  ocupacaoPorImovel: { imovel: string; atual: number; anterior: number }[];
  antecedencia: { mediaDias: number; serie: { rotulo: string; dias: number }[] };
  diasSemana: { dia: string; quantidade: number; pct: number }[];
  comparativoMensal: { rotulo: string; receita: number; ocupacao: number }[];
  melhorDesempenho: { imovel: string; receita: number; ocupacao: number } | null;
  /** true quando ainda não há reservas suficientes para analisar */
  semDados: boolean;
}

export type ImpactoInsight = "alto" | "medio" | "baixo";

export interface InsightDTO {
  titulo: string;
  descricao: string;
  acao: string;
  impacto: ImpactoInsight;
}

export interface SugestaoDiaria {
  min: number;
  max: number;
  justificativa: string;
}

export interface ConfigDTO {
  id: string;
  saldoInicialCaixa: number;
  taxaAirbnbPct: number;
  taxaBookingPct: number;
  taxaDiretoPct: number;
  /** true = ANTHROPIC_API_KEY presente no servidor (a chave nunca vem junto) */
  iaConfigurada?: boolean;
}

export interface ListaReservas {
  reservas: ReservaDTO[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}
