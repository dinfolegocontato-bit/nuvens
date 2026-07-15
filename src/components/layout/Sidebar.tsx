"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mountain, ArrowRight, ArrowUp, ArrowDown, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_PRINCIPAL, ATALHOS_RAPIDOS } from "@/lib/navegacao";
import { useMetricas } from "@/hooks/useMetricas";
import { formatBRL, formatDelta } from "@/lib/formatters";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Badges de pendências por rota. Banco vazio → sem badges (nada mockado). */
type Pendencias = Partial<Record<string, number>>;

/** Sidebar fixa de 256px, sempre visível ≥1024px (PRD §6.1). */
export function Sidebar({ pendencias = {} }: { pendencias?: Pendencias }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <ConteudoSidebar pendencias={pendencias} />
    </aside>
  );
}

/**
 * Abaixo de 1024px a sidebar não cabe: o mesmo menu abre em gaveta.
 * Sem isso não haveria navegação entre 768px e 1023px.
 */
export function MenuMobile({ pendencias = {} }: { pendencias?: Pendencias }) {
  const [aberto, setAberto] = useState(false);
  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Abrir menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-body transition-colors hover:bg-app lg:hidden"
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>
      </DialogTrigger>
      <DialogContent className="left-0 top-0 h-full max-w-[280px] translate-x-0 translate-y-0 rounded-none rounded-r-2xl p-0">
        <DialogTitle className="sr-only">Menu de navegação</DialogTitle>
        <div className="flex h-full flex-col">
          <ConteudoSidebar
            pendencias={pendencias}
            onNavegar={() => setAberto(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConteudoSidebar({
  pendencias = {},
  onNavegar,
}: {
  pendencias?: Pendencias;
  onNavegar?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-text text-white">
          <Mountain className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="text-body font-bold text-strong">
            Morada nas
            <br />
            Nuvens
          </p>
          <p className="text-[12px] text-muted-foreground">
            Visconde de Mauá - RJ
          </p>
        </div>
      </div>

      {/* Navegação principal */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        {NAV_PRINCIPAL.map((item) => {
          const ativo =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          const badge = pendencias[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavegar}
              className={cn(
                "flex h-[42px] items-center gap-3 rounded-xl px-3 text-body transition-colors",
                ativo
                  ? "bg-primary-soft font-medium text-primary-text"
                  : "text-body hover:bg-app"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1">{item.label}</span>
              {badge ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-warn-soft px-1.5 text-[11px] font-semibold text-warn">
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}

        {/* Atalhos rápidos */}
        <div className="my-3 border-t border-border" />
        <p className="px-3 pb-1 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Atalhos rápidos
        </p>
        {ATALHOS_RAPIDOS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavegar}
              className="flex h-[38px] items-center gap-3 rounded-xl px-3 text-body text-muted-foreground transition-colors hover:bg-app hover:text-body"
            >
              <Icon className="h-[16px] w-[16px] shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Rodapé — card de crescimento com o delta real de receita (PRD §6.1) */}
      <div className="p-3">
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-sky-100 to-emerald-50 p-4">
          <p className="text-label font-semibold text-strong">
            Seu negócio merece crescer 🚀
          </p>
          <DeltaReceita />
          <Link
            href="/analytics"
            onClick={onNavegar}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-[12px] font-medium text-primary-text transition-colors hover:bg-white"
          >
            Ver detalhes
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </>
  );
}

/** Delta real de receita líquida do mês corrente vs. o anterior (PRD §6.1). */
function DeltaReceita() {
  const agora = new Date();
  const { data, isLoading } = useMetricas(agora.getMonth() + 1, agora.getFullYear());

  if (isLoading && !data) {
    return <div className="mt-1.5 h-3 w-4/5 animate-pulse rounded bg-white/60" />;
  }

  const delta = data?.deltas.receitaLiquida;
  const receita = data?.atual.receitaLiquida ?? 0;

  // Sem base para comparar → não invento um número
  if (delta === null || delta === undefined) {
    return (
      <p className="mt-1 text-[12px] text-body/70">
        {receita > 0
          ? `${formatBRL(receita)} de receita líquida este mês.`
          : "Lance sua primeira reserva para acompanhar a receita vs. mês anterior."}
      </p>
    );
  }

  const subiu = delta >= 0;
  return (
    <p className="mt-1 flex items-center gap-1 text-[12px] text-body/70">
      {subiu ? (
        <ArrowUp className="h-3 w-3 shrink-0 text-ok" />
      ) : (
        <ArrowDown className="h-3 w-3 shrink-0 text-danger" />
      )}
      <span className={cn("font-medium", subiu ? "text-ok" : "text-danger")}>
        {formatDelta(delta)}
      </span>
      de receita vs. mês anterior.
    </p>
  );
}
