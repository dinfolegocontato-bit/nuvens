import { derivadosReserva } from "@/lib/metricas";
import type {
  PlataformaValor,
  TipoReservaValor,
  StatusReservaValor,
} from "@/lib/tipos";

export interface FormReserva {
  imovelId: string;
  plataforma: PlataformaValor | "";
  tipo: TipoReservaValor | "";
  status: StatusReservaValor;
  codigoExterno: string;
  hospede: {
    nome: string;
    email: string;
    telefone: string;
    documento: string;
    observacoes: string;
  };
  checkin: string;
  checkout: string;
  numeroHospedes: string;
  valorDiaria: string;
  taxaLimpeza: string;
  taxasServicos: string;
  desconto: string;
  observacoes: string;
}

export const FORM_INICIAL: FormReserva = {
  imovelId: "",
  plataforma: "",
  tipo: "",
  status: "CONFIRMADA",
  codigoExterno: "",
  hospede: { nome: "", email: "", telefone: "", documento: "", observacoes: "" },
  checkin: "",
  checkout: "",
  numeroHospedes: "2",
  valorDiaria: "",
  taxaLimpeza: "",
  taxasServicos: "",
  desconto: "",
  observacoes: "",
};

function n(v: string): number {
  const x = Number(String(v).replace(",", "."));
  return Number.isFinite(x) ? x : 0;
}

/** Derivados ao vivo do formulário (mesma lógica de lib/metricas.ts). */
export function derivadosDoForm(form: FormReserva, taxaPlataformaPct: number) {
  return derivadosReserva({
    valorDiaria: n(form.valorDiaria),
    taxaLimpeza: n(form.taxaLimpeza),
    taxasServicos: n(form.taxasServicos),
    desconto: n(form.desconto),
    taxaPlataformaPct,
    checkin: form.checkin || "1970-01-01",
    checkout: form.checkout || "1970-01-01",
    status: form.status,
  });
}

/** Monta o payload para POST /api/reservas. */
export function formParaPayload(form: FormReserva) {
  return {
    imovelId: form.imovelId,
    plataforma: form.plataforma as PlataformaValor,
    tipo: form.tipo as TipoReservaValor,
    status: form.status,
    codigoExterno: form.codigoExterno || undefined,
    hospede: {
      nome: form.hospede.nome,
      email: form.hospede.email || undefined,
      telefone: form.hospede.telefone || undefined,
      documento: form.hospede.documento || undefined,
      observacoes: form.hospede.observacoes || undefined,
    },
    checkin: form.checkin,
    checkout: form.checkout,
    numeroHospedes: Number(form.numeroHospedes) || 1,
    valorDiaria: n(form.valorDiaria),
    taxaLimpeza: n(form.taxaLimpeza),
    taxasServicos: n(form.taxasServicos),
    desconto: n(form.desconto),
    observacoes: form.observacoes || undefined,
  };
}

export const TIPOS_RESERVA: { valor: TipoReservaValor; label: string }[] = [
  { valor: "LAZER", label: "Lazer" },
  { valor: "TRABALHO", label: "Trabalho" },
  { valor: "LONGA_TEMPORADA", label: "Longa temporada" },
  { valor: "GRUPO", label: "Grupo" },
];
