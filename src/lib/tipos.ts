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
