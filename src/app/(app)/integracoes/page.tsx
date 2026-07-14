import { Plug } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";

/**
 * Placeholder de Fase 0. Os cards de canais, IA e "Seus dados" (PRD §6.12)
 * são construídos nas fases seguintes; as taxas de plataforma gravam em CONFIG.
 */
export default function IntegracoesPage() {
  return (
    <>
      <PageHeader titulo="Integrações" />
      <EmptyState
        icon={Plug}
        titulo="Integrações em breve"
        texto="Airbnb, Booking.com e Direto entram aqui como lançamento manual. A sincronização automática (iCal/API) fica para a próxima fase."
      />
    </>
  );
}
