"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { InsightDTO, SugestaoDiaria } from "@/lib/tipos";

/** §7.1 — Insights do período. A IA não grava nada; só devolve JSON pra tela. */
export function useInsightsIA() {
  return useMutation({
    mutationFn: ({ mes, ano }: { mes: number; ano: number }) =>
      apiFetch<{ insights: InsightDTO[] }>("/api/ia/insights", {
        method: "POST",
        body: JSON.stringify({ mes, ano }),
      }),
  });
}

/** §7.2 — Resposta a avaliação. Salvar é ação explícita da Mariana. */
export function useRespostaIA() {
  return useMutation({
    mutationFn: (dados: {
      nota: number;
      comentario?: string | null;
      chale: string;
      hospedeNome: string;
    }) =>
      apiFetch<{ resposta: string }>("/api/ia/resposta-avaliacao", {
        method: "POST",
        body: JSON.stringify({ ...dados, comentario: dados.comentario ?? "" }),
      }),
  });
}

/** §7.3 — Sugestão de diária. Nunca preenche sozinho. */
export function useSugerirDiaria() {
  return useMutation({
    mutationFn: (dados: {
      imovelId: string;
      checkin: string;
      checkout: string;
    }) =>
      apiFetch<SugestaoDiaria>("/api/ia/sugerir-diaria", {
        method: "POST",
        body: JSON.stringify(dados),
      }),
  });
}
