import Link from "next/link";
import { Calendar } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

export default function CalendarioPage() {
  return (
    <>
      <PageHeader titulo="Calendário" />
      <EmptyState
        icon={Calendar}
        titulo="Nenhum chalé no calendário"
        texto="Cadastre um chalé para ver a agenda."
        acao={
          <Button asChild>
            <Link href="/imoveis">Adicionar chalé</Link>
          </Button>
        }
      />
    </>
  );
}
