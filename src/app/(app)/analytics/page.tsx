import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FiltrosPagina } from "@/components/layout/FiltrosPagina";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader titulo="Analytics" filtros={<FiltrosPagina />} />
      <EmptyState
        icon={BarChart3}
        titulo="Ainda não há dados suficientes"
        texto="Com um mês de reservas lançadas, a análise aparece aqui."
        acao={
          <Button asChild>
            <Link href="/reservas/nova">Nova reserva</Link>
          </Button>
        }
      />
    </>
  );
}
