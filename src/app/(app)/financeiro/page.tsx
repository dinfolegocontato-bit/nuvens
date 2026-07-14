import Link from "next/link";
import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FiltrosPagina } from "@/components/layout/FiltrosPagina";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

export default function FinanceiroPage() {
  return (
    <>
      <PageHeader titulo="Financeiro" filtros={<FiltrosPagina />} />
      <EmptyState
        icon={Wallet}
        titulo="Sem lançamentos no mês"
        texto="Entradas vêm das reservas confirmadas. Lance aqui as despesas."
        acao={
          <Button asChild>
            <Link href="/financeiro">Novo lançamento</Link>
          </Button>
        }
      />
    </>
  );
}
