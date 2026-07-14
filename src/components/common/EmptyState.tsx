import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  titulo: string;
  texto: string;
  acao?: React.ReactNode;
  className?: string;
}

/**
 * Estado vazio padrão (PRD §10 — obrigatório em toda tela, pois o app nasce sem dados).
 */
export function EmptyState({
  icon: Icon,
  titulo,
  texto,
  acao,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary-text">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-h3 font-semibold text-strong">{titulo}</h3>
      <p className="mt-1.5 max-w-sm text-body text-muted-foreground">{texto}</p>
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}
