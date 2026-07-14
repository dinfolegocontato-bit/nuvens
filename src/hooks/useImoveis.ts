"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { ImovelDTO } from "@/lib/tipos";
import type { ImovelCreateInput, ImovelUpdateInput } from "@/lib/validators";

const CHAVE = ["imoveis"] as const;

export function useImoveis() {
  return useQuery<ImovelDTO[]>({
    queryKey: CHAVE,
    queryFn: () => apiFetch<ImovelDTO[]>("/api/imoveis"),
  });
}

export function useCriarImovel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: ImovelCreateInput) =>
      apiFetch<ImovelDTO>("/api/imoveis", {
        method: "POST",
        body: JSON.stringify(dados),
      }),
    onSuccess: (novo) => {
      qc.setQueryData<ImovelDTO[]>(CHAVE, (old) => [...(old ?? []), novo]);
      qc.invalidateQueries({ queryKey: CHAVE });
      toast.success("Chalé cadastrado.");
    },
    onError: (e) => {
      toast.error(e instanceof ApiError ? e.message : "Não deu para salvar.");
    },
  });
}

export function useAtualizarImovel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: ImovelUpdateInput }) =>
      apiFetch<ImovelDTO>(`/api/imoveis/${id}`, {
        method: "PATCH",
        body: JSON.stringify(dados),
      }),
    // Otimista com rollback (PRD regra 6)
    onMutate: async ({ id, dados }) => {
      await qc.cancelQueries({ queryKey: CHAVE });
      const anterior = qc.getQueryData<ImovelDTO[]>(CHAVE);
      qc.setQueryData<ImovelDTO[]>(CHAVE, (old) =>
        (old ?? []).map((i) => (i.id === id ? { ...i, ...dados } : i))
      );
      return { anterior };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.anterior) qc.setQueryData(CHAVE, ctx.anterior);
      toast.error(e instanceof ApiError ? e.message : "Não deu para salvar.");
    },
    onSuccess: () => toast.success("Chalé atualizado."),
    onSettled: () => qc.invalidateQueries({ queryKey: CHAVE }),
  });
}

export function useExcluirImovel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: true }>(`/api/imoveis/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: CHAVE });
      const anterior = qc.getQueryData<ImovelDTO[]>(CHAVE);
      qc.setQueryData<ImovelDTO[]>(CHAVE, (old) =>
        (old ?? []).filter((i) => i.id !== id)
      );
      return { anterior };
    },
    onError: (e, _id, ctx) => {
      if (ctx?.anterior) qc.setQueryData(CHAVE, ctx.anterior);
      // RN07: mensagem específica vem do servidor
      toast.error(e instanceof ApiError ? e.message : "Não deu para excluir.");
    },
    onSuccess: () => toast.success("Chalé excluído."),
    onSettled: () => qc.invalidateQueries({ queryKey: CHAVE }),
  });
}
