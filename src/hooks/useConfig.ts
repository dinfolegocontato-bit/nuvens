"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { ConfigDTO } from "@/lib/tipos";

export function useConfig() {
  return useQuery<ConfigDTO>({
    queryKey: ["config"],
    queryFn: () => apiFetch<ConfigDTO>("/api/config"),
    staleTime: 5 * 60_000,
  });
}

export function taxaPorPlataforma(
  config: ConfigDTO | undefined,
  plataforma: "AIRBNB" | "BOOKING" | "DIRETO"
): number {
  if (!config) return 0;
  if (plataforma === "AIRBNB") return config.taxaAirbnbPct;
  if (plataforma === "BOOKING") return config.taxaBookingPct;
  return config.taxaDiretoPct;
}
