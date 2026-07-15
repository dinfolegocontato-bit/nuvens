"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { AvaliacoesResposta, AvaliacaoDTO } from "@/lib/tipos";
import type { AvaliacaoCreateInput, AvaliacaoUpdateInput } from "@/lib/validators";

export function useAvaliacoes() {
  return useQuery<AvaliacoesResposta>({
    queryKey: ["avaliacoes"],
    queryFn: () => apiFetch<AvaliacoesResposta>("/api/avaliacoes"),
  });
}

function invalidar(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["avaliacoes"] });
  qc.invalidateQueries({ queryKey: ["metricas"] }); // avaliação média entra nos KPIs
  qc.invalidateQueries({ queryKey: ["hospedes"] });
}

export function useCriarAvaliacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: AvaliacaoCreateInput) =>
      apiFetch<AvaliacaoDTO>("/api/avaliacoes", {
        method: "POST",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => {
      invalidar(qc);
      toast.success("Avaliação registrada.");
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Não deu para salvar."),
  });
}

export function useAtualizarAvaliacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: AvaliacaoUpdateInput }) =>
      apiFetch<AvaliacaoDTO>(`/api/avaliacoes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => {
      invalidar(qc);
      toast.success("Resposta salva.");
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Não deu para salvar."),
  });
}

export function useExcluirAvaliacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: true }>(`/api/avaliacoes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidar(qc);
      toast.success("Avaliação excluída.");
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Não deu para excluir."),
  });
}
