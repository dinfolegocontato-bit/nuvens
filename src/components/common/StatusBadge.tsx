import { Badge, type BadgeProps } from "@/components/ui/badge";

type StatusConhecido =
  | "ATIVO"
  | "FUTURO"
  | "INATIVO"
  | "CONFIRMADA"
  | "PENDENTE"
  | "CANCELADA"
  | "PAGO";

const MAPA: Record<
  StatusConhecido,
  { label: string; variant: BadgeProps["variant"] }
> = {
  ATIVO: { label: "Ativo", variant: "ok" },
  FUTURO: { label: "Futuro", variant: "info" },
  INATIVO: { label: "Inativo", variant: "neutral" },
  CONFIRMADA: { label: "Confirmada", variant: "ok" },
  PENDENTE: { label: "Pendente", variant: "warn" },
  CANCELADA: { label: "Cancelada", variant: "danger" },
  PAGO: { label: "Pago", variant: "ok" },
};

export function StatusBadge({ status }: { status: string }) {
  const info = MAPA[status as StatusConhecido] ?? {
    label: status,
    variant: "neutral" as const,
  };
  return <Badge variant={info.variant}>{info.label}</Badge>;
}
