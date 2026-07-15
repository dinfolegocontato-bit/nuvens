"use client";

import { usePathname } from "next/navigation";
import { Search, Bell, CircleCheck } from "lucide-react";
import { subtituloDe } from "@/lib/navegacao";
import { UserMenu } from "@/components/layout/UserMenu";
import { MenuMobile } from "@/components/layout/Sidebar";

function saudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function Topbar({
  nome = "Mariana",
  pendencias = 0,
}: {
  nome?: string;
  pendencias?: number;
}) {
  const pathname = usePathname();
  const subtitulo = subtituloDe(pathname);

  return (
    <div className="flex flex-col gap-4 pb-6 lg:flex-row lg:items-start lg:justify-between">
      {/* Saudação + subtítulo (com o menu em gaveta abaixo de 1024px) */}
      <div className="flex items-start gap-3">
        <MenuMobile />
        <div>
          <h1 className="text-h1 font-bold text-strong">
            {saudacao()}, {nome}! 👋
          </h1>
          {subtitulo && (
            <p className="mt-1 text-body text-muted-foreground">{subtitulo}</p>
          )}
        </div>
      </div>

      {/* Ações à direita */}
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1.5 text-[12px] text-muted-foreground xl:flex">
          <CircleCheck className="h-4 w-4 text-ok" />
          Dados salvos automaticamente
        </span>

        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar..."
            aria-label="Buscar"
            className="h-10 w-[260px] rounded-xl border border-border bg-surface pl-9 pr-12 text-body text-strong placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border bg-app px-1.5 py-0.5 text-[11px] text-muted-foreground">
            ⌘K
          </kbd>
        </div>

        <button
          type="button"
          aria-label="Notificações"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-body transition-colors hover:bg-app"
        >
          <Bell className="h-[18px] w-[18px]" />
          {pendencias > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-semibold text-white">
              {pendencias}
            </span>
          )}
        </button>

        <UserMenu nome="Mariana Ferraz" />
      </div>
    </div>
  );
}
