"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api-client";
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

/** Edita as taxas dos canais e o saldo inicial (PRD §6.12). */
export function useAtualizarConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: Partial<Omit<ConfigDTO, "id" | "iaConfigurada">>) =>
      apiFetch<ConfigDTO>("/api/config", {
        method: "PATCH",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["config"] });
      // taxas novas não reescrevem o histórico (PRD §3), mas o saldo inicial entra no caixa
      qc.invalidateQueries({ queryKey: ["financeiro"] });
      qc.invalidateQueries({ queryKey: ["metricas"] });
      toast.success("Configuração salva.");
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Não deu para salvar."),
  });
}

function invalidarTudo(qc: ReturnType<typeof useQueryClient>) {
  for (const k of [
    "imoveis", "reservas", "hospedes", "avaliacoes",
    "metricas", "financeiro", "analytics", "calendario", "despesas", "config",
  ]) {
    qc.invalidateQueries({ queryKey: [k] });
  }
}

/** Restaurar backup (JSON) — substitui os dados atuais. */
export function useRestaurarBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (backup: unknown) =>
      apiFetch<{ ok: true }>("/api/backup", {
        method: "POST",
        body: JSON.stringify(backup),
      }),
    onSuccess: () => {
      invalidarTudo(qc);
      toast.success("Backup restaurado.");
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Não deu para restaurar o backup."),
  });
}

/** "Começar do zero" — apaga todos os dados (a tela exige dupla confirmação). */
export function useComecarDoZero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ ok: true }>("/api/backup", { method: "DELETE" }),
    onSuccess: () => {
      invalidarTudo(qc);
      toast.success("Tudo apagado. O sistema começou do zero.");
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Não deu para apagar os dados."),
  });
}
