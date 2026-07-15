"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { HospedesResposta } from "@/lib/tipos";

export function useHospedes() {
  return useQuery<HospedesResposta>({
    queryKey: ["hospedes"],
    queryFn: () => apiFetch<HospedesResposta>("/api/hospedes"),
  });
}
