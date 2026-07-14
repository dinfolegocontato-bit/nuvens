import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { CalendarPlus } from "lucide-react";

/**
 * Placeholder de Fase 0. O wizard de 5 passos (PRD §6.4) é construído na Fase 2.
 */
export default function NovaReservaPage() {
  return (
    <>
      <PageHeader titulo="Nova reserva" />
      <EmptyState
        icon={CalendarPlus}
        titulo="Assistente de nova reserva"
        texto="O passo a passo para lançar uma reserva é construído na próxima fase."
      />
    </>
  );
}
