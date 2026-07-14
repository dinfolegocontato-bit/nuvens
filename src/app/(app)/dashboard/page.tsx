import Link from "next/link";
import { Home } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FiltrosPagina } from "@/components/layout/FiltrosPagina";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <>
      <PageHeader titulo="Visão geral" filtros={<FiltrosPagina />} />
      <EmptyState
        icon={Home}
        titulo="Vamos começar pela primeira reserva"
        texto="Cadastre um chalé e lance sua primeira reserva. Os números aparecem aqui."
        acao={
          <Button asChild>
            <Link href="/imoveis">Cadastrar chalé</Link>
          </Button>
        }
      />
    </>
  );
}
