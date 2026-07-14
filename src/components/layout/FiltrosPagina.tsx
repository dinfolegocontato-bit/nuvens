import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { nomeMes } from "@/lib/formatters";

function Pilula({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-label text-body transition-colors hover:bg-app"
    >
      {children}
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

/**
 * Linha de filtros da página (PRD §6.1). Visual/estrutural nesta fase;
 * a interação com o período (?mes=&ano=) é ligada na Fase 3.
 */
export function FiltrosPagina() {
  const agora = new Date();
  const periodo = `${nomeMes(agora.getMonth() + 1)} / ${agora.getFullYear()}`;
  return (
    <>
      <Pilula>{periodo}</Pilula>
      <Pilula>Todos os imóveis</Pilula>
      <Pilula>Todas as plataformas</Pilula>
      <Pilula>Status</Pilula>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-label text-body transition-colors hover:bg-app"
      >
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        Filtros
      </button>
    </>
  );
}
