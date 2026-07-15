"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { MetricasResposta } from "@/lib/tipos";

export function useMetricas(mes: number, ano: number) {
  return useQuery<MetricasResposta>({
    queryKey: ["metricas", mes, ano],
    queryFn: () => apiFetch<MetricasResposta>(`/api/metricas?mes=${mes}&ano=${ano}`),
    placeholderData: (prev) => prev,
  });
}
