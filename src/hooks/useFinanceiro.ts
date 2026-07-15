"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { FinanceiroResposta, DespesaDTO } from "@/lib/tipos";
import type { DespesaCreateInput, DespesaUpdateInput } from "@/lib/validators";

export function useFinanceiro(mes: number, ano: number) {
  return useQuery<FinanceiroResposta>({
    queryKey: ["financeiro", mes, ano],
    queryFn: () => apiFetch<FinanceiroResposta>(`/api/financeiro?mes=${mes}&ano=${ano}`),
    placeholderData: (prev) => prev,
  });
}

function invalidarTudo(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["financeiro"] });
  qc.invalidateQueries({ queryKey: ["metricas"] });
  qc.invalidateQueries({ queryKey: ["despesas"] });
}

export function useCriarDespesa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: DespesaCreateInput) =>
      apiFetch<DespesaDTO>("/api/despesas", {
        method: "POST",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => {
      invalidarTudo(qc);
      toast.success("Lançamento criado.");
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Não deu para salvar."),
  });
}

export function useAtualizarDespesa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: DespesaUpdateInput }) =>
      apiFetch<DespesaDTO>(`/api/despesas/${id}`, {
        method: "PATCH",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => {
      invalidarTudo(qc);
      toast.success("Lançamento atualizado.");
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Não deu para salvar."),
  });
}

export function useExcluirDespesa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: true }>(`/api/despesas/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidarTudo(qc);
      toast.success("Lançamento excluído.");
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Não deu para excluir."),
  });
}
