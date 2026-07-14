import Link from "next/link";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FiltrosPagina } from "@/components/layout/FiltrosPagina";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

export default function HospedesPage() {
  return (
    <>
      <PageHeader titulo="Hóspedes" filtros={<FiltrosPagina />} />
      <EmptyState
        icon={Users}
        titulo="Nenhum hóspede ainda"
        texto="Os hóspedes entram na base conforme você cria reservas."
        acao={
          <Button asChild>
            <Link href="/reservas/nova">Nova reserva</Link>
          </Button>
        }
      />
    </>
  );
}
