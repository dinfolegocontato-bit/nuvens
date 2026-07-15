"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { nomeMes } from "@/lib/formatters";
import { useState } from "react";

/** Mês/ano do período atual, lidos da URL (RN08). Caem no mês corrente. */
export function usePeriodo() {
  const sp = useSearchParams();
  const agora = new Date();
  const mes = Number(sp.get("mes")) || agora.getMonth() + 1;
  const ano = Number(sp.get("ano")) || agora.getFullYear();
  return { mes, ano };
}

/**
 * Seletor de período único que controla todas as telas (PRD §6.1, RN08).
 * O estado vive na URL (?mes=&ano=), então o link é compartilhável.
 */
export function SeletorPeriodo() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { mes, ano } = usePeriodo();
  const [aberto, setAberto] = useState(false);
  const [anoVisivel, setAnoVisivel] = useState(ano);

  const agora = new Date();
  const mesAtual = agora.getMonth() + 1;
  const anoAtual = agora.getFullYear();

  function selecionar(m: number, a: number) {
    // Preserva os outros parâmetros da URL (ex.: ?novo=1)
    const params = new URLSearchParams(sp.toString());
    params.set("mes", String(m));
    params.set("ano", String(a));
    router.push(`${pathname}?${params.toString()}`);
    setAberto(false);
  }

  return (
    <DropdownMenu
      open={aberto}
      onOpenChange={(v) => {
        setAberto(v);
        if (v) setAnoVisivel(ano);
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-label text-body transition-colors hover:bg-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {nomeMes(mes)} / {ano}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[260px] p-3">
        {/* Navegação de ano */}
        <div className="mb-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ano anterior"
            onClick={() => setAnoVisivel((a) => a - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-label font-semibold text-strong">{anoVisivel}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Próximo ano"
            onClick={() => setAnoVisivel((a) => a + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Grade de meses */}
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
            const selecionado = m === mes && anoVisivel === ano;
            const ehAtual = m === mesAtual && anoVisivel === anoAtual;
            return (
              <button
                key={m}
                type="button"
                onClick={() => selecionar(m, anoVisivel)}
                className={cn(
                  "rounded-lg px-2 py-2 text-legenda transition-colors",
                  selecionado
                    ? "bg-primary font-medium text-white"
                    : ehAtual
                      ? "bg-primary-soft font-medium text-primary-text"
                      : "text-body hover:bg-app"
                )}
              >
                {nomeMes(m).slice(0, 3)}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => selecionar(mesAtual, anoAtual)}
          className="mt-2 w-full rounded-lg border border-border py-1.5 text-legenda text-body transition-colors hover:bg-app"
        >
          Mês atual
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
