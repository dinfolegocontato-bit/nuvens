import Link from "next/link";
import { CalendarCheck, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FiltrosPagina } from "@/components/layout/FiltrosPagina";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

export default function ReservasPage() {
  return (
    <>
      <PageHeader
        titulo="Reservas"
        filtros={<FiltrosPagina />}
        acoes={
          <Button asChild>
            <Link href="/reservas/nova">
              <Plus className="h-4 w-4" />
              Nova reserva
            </Link>
          </Button>
        }
      />
      <EmptyState
        icon={CalendarCheck}
        titulo="Nenhuma reserva neste período"
        texto="As reservas que você lançar aparecem aqui."
        acao={
          <Button asChild>
            <Link href="/reservas/nova">Nova reserva</Link>
          </Button>
        }
      />
    </>
  );
}
