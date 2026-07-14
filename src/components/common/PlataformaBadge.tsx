import { cn } from "@/lib/utils";

export type Plataforma = "AIRBNB" | "BOOKING" | "DIRETO";

const MAPA: Record<Plataforma, { label: string; cor: string }> = {
  AIRBNB: { label: "Airbnb", cor: "var(--airbnb)" },
  BOOKING: { label: "Booking.com", cor: "var(--booking)" },
  DIRETO: { label: "Direto", cor: "var(--direto)" },
};

/** Badge de plataforma com bolinha colorida (PRD §6.3). */
export function PlataformaBadge({
  plataforma,
  className,
}: {
  plataforma: string;
  className?: string;
}) {
  const info = MAPA[plataforma as Plataforma] ?? {
    label: plataforma,
    cor: "var(--text-muted)",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-0.5 text-legenda font-medium text-body",
        className
      )}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: info.cor }}
      />
      {info.label}
    </span>
  );
}

/** Só a bolinha (para listas compactas). */
export function PlataformaDot({ plataforma }: { plataforma: string }) {
  const info = MAPA[plataforma as Plataforma];
  return (
    <span
      title={info?.label ?? plataforma}
      className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-white"
      style={{ backgroundColor: info?.cor ?? "var(--text-muted)" }}
    />
  );
}
