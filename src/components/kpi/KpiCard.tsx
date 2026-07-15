import type { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDelta } from "@/lib/formatters";

type Tom = "primary" | "info" | "warn" | "ia" | "ok" | "danger" | "booking";

const TONS: Record<Tom, string> = {
  primary: "bg-primary-soft text-primary-text",
  info: "bg-info-soft text-info",
  warn: "bg-warn-soft text-warn",
  ia: "bg-ia-soft text-ia",
  ok: "bg-ok-soft text-ok",
  danger: "bg-danger-soft text-danger",
  booking: "bg-info-soft text-booking",
};

export function KpiCard({
  rotulo,
  valor,
  icon: Icon,
  tom = "primary",
  delta,
  rodape,
}: {
  rotulo: string;
  valor: string;
  icon: LucideIcon;
  tom?: Tom;
  /** delta % vs mês anterior; null = sem base para comparar; undefined = não mostrar */
  delta?: number | null;
  /** conteúdo alternativo ao delta (ex.: estrelas + Nº de avaliações) */
  rodape?: React.ReactNode;
}) {
  const mostraDelta = delta !== undefined && rodape === undefined;
  const positivo = (delta ?? 0) >= 0;

  return (
    <Card className="flex min-w-[190px] flex-1 flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", TONS[tom])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div>
        <p className="text-kpi-rotulo text-muted-foreground">{rotulo}</p>
        <p className="mt-0.5 text-kpi-valor text-strong">{valor}</p>
      </div>

      {rodape !== undefined && <div>{rodape}</div>}

      {mostraDelta && (
        <div className="flex items-center gap-1.5 text-legenda">
          {delta === null ? (
            <span className="text-muted-foreground">sem base anterior</span>
          ) : (
            <>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium",
                  positivo ? "text-ok" : "text-danger"
                )}
              >
                {positivo ? (
                  <ArrowUp className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5" />
                )}
                {formatDelta(delta)}
              </span>
              <span className="text-muted-foreground">vs mês anterior</span>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
