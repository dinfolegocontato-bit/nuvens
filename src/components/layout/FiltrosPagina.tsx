"use client";

import { SeletorPeriodo } from "@/components/common/SeletorPeriodo";

/**
 * Linha de filtros da página (PRD §6.1).
 * O SeletorPeriodo é único e controla todas as telas via URL (?mes=&ano= — RN08).
 * Filtros específicos de uma tela entram via `children` (só onde a API os suporta).
 */
export function FiltrosPagina({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <SeletorPeriodo />
      {children}
    </>
  );
}
