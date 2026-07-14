import { FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";

/**
 * Placeholder de Fase 0. Os quatro cards de CSV (PRD §6.11) são construídos na Fase 8.
 */
export default function RelatoriosPage() {
  return (
    <>
      <PageHeader titulo="Relatórios" />
      <EmptyState
        icon={FileText}
        titulo="Relatórios em breve"
        texto="Aqui você vai baixar em CSV as reservas, o resultado financeiro, a base de hóspedes e as avaliações do período."
      />
    </>
  );
}
