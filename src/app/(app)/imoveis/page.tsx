import Link from "next/link";
import { Home, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FiltrosPagina } from "@/components/layout/FiltrosPagina";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

export default function ImoveisPage() {
  return (
    <>
      <PageHeader
        titulo="Imóveis"
        filtros={<FiltrosPagina />}
        acoes={
          <Button asChild>
            <Link href="/imoveis">
              <Plus className="h-4 w-4" />
              Adicionar chalé
            </Link>
          </Button>
        }
      />
      <EmptyState
        icon={Home}
        titulo="Nenhum chalé cadastrado"
        texto="Cadastre o primeiro chalé para começar a lançar reservas."
        acao={
          <Button asChild>
            <Link href="/imoveis">Adicionar chalé</Link>
          </Button>
        }
      />
    </>
  );
}
