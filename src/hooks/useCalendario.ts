"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { CalendarioResposta, BloqueioDTO } from "@/lib/tipos";
import type { BloqueioCreateInput } from "@/lib/validators";

export function useCalendario(mes: number, ano: number) {
  return useQuery<CalendarioResposta>({
    queryKey: ["calendario", mes, ano],
    queryFn: () =>
      apiFetch<CalendarioResposta>(`/api/calendario?mes=${mes}&ano=${ano}`),
    placeholderData: (prev) => prev,
  });
}

export function useCriarBloqueio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: BloqueioCreateInput) =>
      apiFetch<BloqueioDTO>("/api/bloqueios", {
        method: "POST",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendario"] });
      toast.success("Datas bloqueadas.");
    },
    // erro (409 com reserva) tratado inline no formulário
  });
}

export function useExcluirBloqueio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: true }>(`/api/bloqueios/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendario"] });
      toast.success("Bloqueio removido.");
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Não deu para remover."),
  });
}
