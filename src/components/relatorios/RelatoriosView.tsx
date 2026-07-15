"use client";

import { useSearchParams } from "next/navigation";
import { CalendarCheck, Wallet, Users, Star, Download } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { rotuloPeriodo } from "@/lib/formatters";

interface RelatorioCard {
  tipo: string;
  titulo: string;
  descricao: string;
  icon: LucideIcon;
  tom: string;
  /** true = o conteúdo não depende do mês selecionado */
  cumulativo?: boolean;
}

const RELATORIOS: RelatorioCard[] = [
  {
    tipo: "reservas",
    titulo: "Reservas do período",
    descricao:
      "Todas as reservas que tocam o mês, com noites, valores, taxa da plataforma e status.",
    icon: CalendarCheck,
    tom: "bg-primary-soft text-primary-text",
  },
  {
    tipo: "financeiro",
    titulo: "Resultado financeiro",
    descricao:
      "Transações do mês (entradas e saídas) e o resumo de receita, gastos, lucro e saldo.",
    icon: Wallet,
    tom: "bg-info-soft text-info",
  },
  {
    tipo: "hospedes",
    titulo: "Base de hóspedes",
    descricao:
      "Seus hóspedes com contato, nº de reservas, total gasto e última estadia.",
    icon: Users,
    tom: "bg-ok-soft text-ok",
    cumulativo: true,
  },
  {
    tipo: "avaliacoes",
    titulo: "Avaliações",
    descricao:
      "Todas as avaliações registradas, com nota, comentário e a resposta enviada.",
    icon: Star,
    tom: "bg-warn-soft text-warn",
    cumulativo: true,
  },
];

export function RelatoriosView() {
  const sp = useSearchParams();
  const agora = new Date();
  const mes = Number(sp.get("mes")) || agora.getMonth() + 1;
  const ano = Number(sp.get("ano")) || agora.getFullYear();

  return (
    <>
      <PageHeader titulo="Relatórios" />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {RELATORIOS.map((r) => {
          const Icon = r.icon;
          return (
            <Card key={r.tipo} className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${r.tom}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle>{r.titulo}</CardTitle>
                  <p className="mt-1 text-body text-muted-foreground">{r.descricao}</p>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
                <span className="text-legenda text-muted-foreground">
                  {r.cumulativo ? "Base completa" : rotuloPeriodo(mes, ano)}
                </span>
                <Button asChild variant="outline">
                  <a
                    href={`/api/relatorios/${r.tipo}?mes=${mes}&ano=${ano}`}
                    download
                  >
                    <Download className="h-4 w-4" />
                    Baixar CSV
                  </a>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
