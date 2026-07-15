"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api-client";
import type {
  ListaReservas,
  ReservaDTO,
  StatusReservaValor,
  HospedeDTO,
} from "@/lib/tipos";
import type { ReservaCreateInput, ReservaUpdateInput } from "@/lib/validators";

export interface FiltrosReservas {
  mes: number;
  ano: number;
  status?: StatusReservaValor;
  imovelId?: string;
  plataforma?: string;
  q?: string;
  pagina: number;
}

function queryString(f: FiltrosReservas): string {
  const p = new URLSearchParams();
  p.set("mes", String(f.mes));
  p.set("ano", String(f.ano));
  p.set("pagina", String(f.pagina));
  if (f.status) p.set("status", f.status);
  if (f.imovelId) p.set("imovelId", f.imovelId);
  if (f.plataforma) p.set("plataforma", f.plataforma);
  if (f.q) p.set("q", f.q);
  return p.toString();
}

export function useReservas(filtros: FiltrosReservas) {
  return useQuery<ListaReservas>({
    queryKey: ["reservas", filtros],
    queryFn: () => apiFetch<ListaReservas>(`/api/reservas?${queryString(filtros)}`),
    placeholderData: (prev) => prev,
  });
}

/** RN06 — busca hóspede por e-mail (para o passo 2 do wizard). */
export async function buscarHospedePorEmail(
  email: string
): Promise<HospedeDTO | null> {
  const r = await apiFetch<{ hospede: HospedeDTO | null }>(
    `/api/hospedes?email=${encodeURIComponent(email)}`
  );
  return r.hospede;
}

export function useCriarReserva() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: ReservaCreateInput) =>
      apiFetch<ReservaDTO>("/api/reservas", {
        method: "POST",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservas"] });
      qc.invalidateQueries({ queryKey: ["metricas"] });
      qc.invalidateQueries({ queryKey: ["calendario"] });
      toast.success("Reserva criada.");
    },
    // Erros (inclusive 409 de conflito) são tratados na tela para exibir inline.
  });
}

export function useAtualizarReserva() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: ReservaUpdateInput }) =>
      apiFetch<ReservaDTO>(`/api/reservas/${id}`, {
        method: "PATCH",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservas"] });
      qc.invalidateQueries({ queryKey: ["metricas"] });
      qc.invalidateQueries({ queryKey: ["calendario"] });
      toast.success("Reserva atualizada.");
    },
  });
}

export function useMudarStatusReserva() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusReservaValor }) =>
      apiFetch<ReservaDTO>(`/api/reservas/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["reservas"] });
      qc.invalidateQueries({ queryKey: ["metricas"] });
      qc.invalidateQueries({ queryKey: ["calendario"] });
      const msg =
        vars.status === "CANCELADA"
          ? "Reserva cancelada."
          : vars.status === "CONFIRMADA"
            ? "Reserva confirmada."
            : "Reserva marcada como pendente.";
      toast.success(msg);
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Não deu para atualizar."),
  });
}

export function useExcluirReserva() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: true }>(`/api/reservas/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservas"] });
      qc.invalidateQueries({ queryKey: ["metricas"] });
      qc.invalidateQueries({ queryKey: ["calendario"] });
      toast.success("Reserva excluída.");
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Não deu para excluir."),
  });
}
