import { PageHeader } from "@/components/layout/PageHeader";
import { NovaReservaWizard } from "@/components/reservas/wizard/NovaReservaWizard";

export default function NovaReservaPage() {
  return (
    <>
      <PageHeader titulo="Nova reserva" />
      <NovaReservaWizard />
    </>
  );
}
