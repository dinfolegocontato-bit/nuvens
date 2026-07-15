"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Wallet,
  Gauge,
  Moon,
  Tag,
  TrendingUp,
  Star,
  Home,
  CalendarClock,
  Receipt,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FiltrosPagina } from "@/components/layout/FiltrosPagina";
import { EmptyState } from "@/components/common/EmptyState";
import { Estrelas } from "@/components/common/Estrelas";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/kpi/KpiCard";
import { GraficoReceita } from "@/components/dashboard/GraficoReceita";
import { DonutPlataformas } from "@/components/dashboard/DonutPlataformas";
import { BarrasOcupacao } from "@/components/dashboard/BarrasOcupacao";
import { PainelInsights } from "@/components/ia/PainelInsights";
import { useMetricas } from "@/hooks/useMetricas";
import { useImoveis } from "@/hooks/useImoveis";
import { formatBRL, formatData, formatNumero, formatPct } from "@/lib/formatters";
import type { MetricasResposta } from "@/lib/tipos";

function iniciais(nome: string) {
  return nome.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}
function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function amanhaISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DashboardView() {
  const sp = useSearchParams();
  const agora = new Date();
  const mes = Number(sp.get("mes")) || agora.getMonth() + 1;
  const ano = Number(sp.get("ano")) || agora.getFullYear();

  const { data: imoveis, isLoading: carregandoImoveis } = useImoveis();
  const { data: m, isLoading } = useMetricas(mes, ano);

  if (carregandoImoveis || (isLoading && !m)) {
    return (
      <>
        <PageHeader titulo="Visão geral" filtros={<FiltrosPagina />} />
        <div className="flex flex-wrap gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 min-w-[190px] flex-1 rounded-2xl" />
          ))}
        </div>
      </>
    );
  }

  // Estado vazio (PRD §10): sem chalés cadastrados
  if (imoveis && imoveis.length === 0) {
    return (
      <>
        <PageHeader titulo="Visão geral" filtros={<FiltrosPagina />} />
        <EmptyState
          icon={Home}
          titulo="Vamos começar pela primeira reserva"
          texto="Cadastre um chalé e lance sua primeira reserva. Os números aparecem aqui."
          acao={
            <Button asChild>
              <Link href="/imoveis">Cadastrar chalé</Link>
            </Button>
          }
        />
      </>
    );
  }

  if (!m) return null;

  return (
    <>
      <PageHeader titulo="Visão geral" filtros={<FiltrosPagina />} />

      {/* Faixa de 6 KPIs */}
      <div className="flex flex-wrap gap-5">
        <KpiCard rotulo="Receita líquida" valor={formatBRL(m.atual.receitaLiquida)} icon={Wallet} tom="primary" delta={m.deltas.receitaLiquida} />
        <KpiCard rotulo="Taxa de ocupação" valor={formatPct(m.atual.ocupacao)} icon={Gauge} tom="info" delta={m.deltas.ocupacao} />
        <KpiCard rotulo="Diárias vendidas" valor={formatNumero(m.atual.noitesVendidas)} icon={Moon} tom="warn" delta={m.deltas.noitesVendidas} />
        <KpiCard rotulo="ADR" valor={formatBRL(m.atual.adr)} icon={Tag} tom="ok" delta={m.deltas.adr} />
        <KpiCard rotulo="Lucro líquido" valor={formatBRL(m.atual.lucroLiquido)} icon={TrendingUp} tom="primary" delta={m.deltas.lucroLiquido} />
        <KpiCard
          rotulo="Avaliação média"
          valor={m.avaliacao.media !== null ? m.avaliacao.media.toFixed(1) : "—"}
          icon={Star}
          tom="warn"
          rodape={
            <div className="flex items-center gap-2">
              <Estrelas nota={m.avaliacao.media ?? 0} tamanho={14} />
              <span className="text-legenda text-muted-foreground">
                {m.avaliacao.total} avaliaç{m.avaliacao.total === 1 ? "ão" : "ões"}
              </span>
            </div>
          }
        />
      </div>

      {/* Receita ao longo do mês + Próximas chegadas */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Receita ao longo do mês</CardTitle>
            <div className="flex items-center gap-4 text-legenda text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full" style={{ backgroundColor: "var(--primary-text)" }} />
                Este período
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full" style={{ backgroundColor: "var(--text-muted)" }} />
                Mês anterior
              </span>
            </div>
          </div>
          <GraficoReceita dados={m.series.receitaDiaria} />
        </Card>

        <Card>
          <CardTitle className="mb-4">Próximas chegadas</CardTitle>
          <ProximasChegadas chegadas={m.proximasChegadas} />
        </Card>
      </div>

      {/* Donut + Barras + Contas a pagar */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card>
          <CardTitle className="mb-4">Reservas por plataforma</CardTitle>
          {m.reservasPorPlataforma.length > 0 ? (
            <DonutPlataformas dados={m.reservasPorPlataforma} />
          ) : (
            <VazioCard texto="Nenhuma reserva no período." />
          )}
        </Card>

        <Card>
          <CardTitle className="mb-4">Ocupação por chalé</CardTitle>
          {m.ocupacaoPorChale.length > 0 ? (
            <BarrasOcupacao dados={m.ocupacaoPorChale} />
          ) : (
            <VazioCard texto="Cadastre um chalé para ver a ocupação." />
          )}
        </Card>

        <Card>
          <CardTitle className="mb-4">Contas a pagar</CardTitle>
          {m.contasAPagar.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {m.contasAPagar.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-label font-medium text-strong">{c.descricao}</p>
                    <p className="text-legenda text-muted-foreground">
                      vence {formatData(c.data)}
                    </p>
                  </div>
                  <span className="font-medium text-danger">{formatBRL(c.valor)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <VazioCard icon={Receipt} texto="Nenhuma conta pendente." />
          )}
        </Card>
      </div>

      {/* Painel de Insights com IA (PRD §6.2 rodapé / §7.1) */}
      <PainelInsights mes={mes} ano={ano} />
    </>
  );
}

function ProximasChegadas({
  chegadas,
}: {
  chegadas: MetricasResposta["proximasChegadas"];
}) {
  if (chegadas.length === 0) {
    return <VazioCard icon={CalendarClock} texto="Nenhuma chegada prevista." />;
  }
  const hoje = hojeISO();
  const amanha = amanhaISO();

  return (
    <ul className="flex flex-col gap-1">
      {chegadas.map((c) => (
        <li key={c.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-app">
          {c.imovelFoto ? (
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full">
              <Image src={c.imovelFoto} alt="" fill sizes="36px" className="object-cover" />
            </div>
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-legenda font-semibold text-primary-text">
              {iniciais(c.hospedeNome)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-label font-medium text-strong">{c.hospedeNome}</p>
            <p className="truncate text-legenda text-muted-foreground">
              {c.imovelNome} · {c.noites} noite(s)
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-legenda text-muted-foreground">{formatData(c.checkin)}</span>
            {c.checkin === hoje && <Badge variant="ok">Hoje</Badge>}
            {c.checkin === amanha && <Badge variant="info">Amanhã</Badge>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function VazioCard({
  texto,
  icon: Icon,
}: {
  texto: string;
  icon?: typeof Home;
}) {
  return (
    <div className="flex h-[160px] flex-col items-center justify-center gap-2 text-center">
      {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
      <p className="text-legenda text-muted-foreground">{texto}</p>
    </div>
  );
}
