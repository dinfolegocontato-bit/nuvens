import { Star } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

export default function AvaliacoesPage() {
  return (
    <>
      <PageHeader titulo="Avaliações" />
      <EmptyState
        icon={Star}
        titulo="Nenhuma avaliação ainda"
        texto="Registre as avaliações que chegam pelas plataformas."
        acao={<Button disabled>Registrar avaliação</Button>}
      />
    </>
  );
}
