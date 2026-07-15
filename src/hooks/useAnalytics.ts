"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { AnalyticsResposta } from "@/lib/tipos";

export function useAnalytics(mes: number, ano: number) {
  return useQuery<AnalyticsResposta>({
    queryKey: ["analytics", mes, ano],
    queryFn: () => apiFetch<AnalyticsResposta>(`/api/analytics?mes=${mes}&ano=${ano}`),
    placeholderData: (prev) => prev,
  });
}
