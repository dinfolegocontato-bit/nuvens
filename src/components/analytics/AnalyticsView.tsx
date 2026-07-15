"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Coins,
  Gauge,
  Moon,
  Tag,
  BarChart3,
  Star,
  Download,
  Clock,
  Trophy,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FiltrosPagina } from "@/components/layout/FiltrosPagina";
import { EmptyState } from "@/components/common/EmptyState";
import { Estrelas } from "@/components/common/Estrelas";
import { KpiCard } from "@/components/kpi/KpiCard";
import { Sparkline } from "@/components/analytics/Sparkline";
import {
  DonutDesempenho,
  BarrasOcupacaoComparada,
  LinhaAntecedencia,
  BarrasDiasSemana,
  ComparativoMensal,
} from "@/components/analytics/GraficosAnalytics";
import { GraficoReceita } from "@/components/dashboard/GraficoReceita";
import { DonutPlataformas } from "@/components/dashboard/DonutPlataformas";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "@/hooks/useAnalytics";
import { formatBRL, formatNumero, formatPct } from "@/lib/formatters";

export function AnalyticsView() {
  const sp = useSearchParams();
  const agora = new Date();
  const mes = Number(sp.get("mes")) || agora.getMonth() + 1;
  const ano = Number(sp.get("ano")) || agora.getFullYear();

  const { data: a, isLoading } = useAnalytics(mes, ano);

  const acoes = (
    <Button asChild variant="outline">
      <a href={`/api/relatorios/reservas?mes=${mes}&ano=${ano}`} download>
        <Download className="h-4 w-4" />
        Exportar relatório
      </a>
    </Button>
  );

  if (isLoading && !a) {
    return (
      <>
        <PageHeader titulo="Analytics" filtros={<FiltrosPagina />} acoes={acoes} />
        <div className="flex flex-wrap gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 min-w-[190px] flex-1 rounded-2xl" />
          ))}
        </div>
      </>
    );
  }
  if (!a) return null;

  // Estado vazio (PRD §10)
  if (a.semDados) {
    return (
      <>
        <PageHeader titulo="Analytics" filtros={<FiltrosPagina />} acoes={acoes} />
        <EmptyState
          icon={BarChart3}
          titulo="Ainda não há dados suficientes"
          texto="Com um mês de reservas lançadas, a análise aparece aqui."
          acao={
            <Button asChild>
              <Link href="/reservas/nova">Nova reserva</Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader titulo="Analytics" filtros={<FiltrosPagina />} acoes={acoes} />

      {/* 6 KPIs com sparkline */}
      <div className="flex flex-wrap gap-5">
        <KpiCard rotulo="Receita total" valor={formatBRL(a.kpis.receitaTotal)} icon={Coins} tom="primary" delta={a.deltas.receitaTotal} sparkline={<Sparkline dados={a.sparklines.receitaTotal} />} />
        <KpiCard rotulo="Ocupação" valor={formatPct(a.kpis.ocupacao)} icon={Gauge} tom="info" delta={a.deltas.ocupacao} sparkline={<Sparkline dados={a.sparklines.ocupacao} cor="var(--info)" />} />
        <KpiCard rotulo="Diárias vendidas" valor={formatNumero(a.kpis.noitesVendidas)} icon={Moon} tom="warn" delta={a.deltas.noitesVendidas} sparkline={<Sparkline dados={a.sparklines.noitesVendidas} cor="var(--warn)" />} />
        <KpiCard rotulo="ADR" valor={formatBRL(a.kpis.adr)} icon={Tag} tom="ok" delta={a.deltas.adr} sparkline={<Sparkline dados={a.sparklines.adr} cor="var(--ok)" />} />
        <KpiCard rotulo="RevPAR" valor={formatBRL(a.kpis.revpar)} icon={BarChart3} tom="ia" delta={a.deltas.revpar} sparkline={<Sparkline dados={a.sparklines.revpar} cor="var(--ia)" />} />
        <KpiCard
          rotulo="Avaliação média"
          valor={a.kpis.avaliacaoMedia !== null ? a.kpis.avaliacaoMedia.toFixed(1) : "—"}
          icon={Star}
          tom="warn"
          rodape={
            <div className="flex items-center gap-2">
              <Estrelas nota={a.kpis.avaliacaoMedia ?? 0} tamanho={14} />
              <span className="text-legenda text-muted-foreground">
                {a.kpis.totalAvaliacoes} avaliaç{a.kpis.totalAvaliacoes === 1 ? "ão" : "ões"}
              </span>
            </div>
          }
        />
      </div>

      {/* Linha 1 */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Receita ao longo do tempo</CardTitle>
            <div className="flex items-center gap-3 text-legenda text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full" style={{ backgroundColor: "var(--primary-text)" }} />
                Este período
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full" style={{ backgroundColor: "var(--text-muted)" }} />
                Anterior
              </span>
            </div>
          </div>
          <GraficoReceita dados={a.receitaAoLongo} />
        </Card>

        <Card>
          <CardTitle className="mb-4">Desempenho por plataforma</CardTitle>
          {a.desempenhoPorPlataforma.length > 0 ? (
            <DonutDesempenho dados={a.desempenhoPorPlataforma} />
          ) : (
            <Vazio />
          )}
        </Card>

        <Card>
          <CardTitle className="mb-4">Taxa de ocupação por imóvel</CardTitle>
          {a.ocupacaoPorImovel.length > 0 ? (
            <BarrasOcupacaoComparada dados={a.ocupacaoPorImovel} />
          ) : (
            <Vazio />
          )}
        </Card>
      </div>

      {/* Linha 2 */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        <Card>
          <CardTitle className="mb-1">Antecedência média</CardTitle>
          <p className="text-kpi-valor text-strong">
            {formatNumero(a.antecedencia.mediaDias, 1)}{" "}
            <span className="text-body font-normal text-muted-foreground">dias</span>
          </p>
          <div className="mt-2">
            <LinhaAntecedencia dados={a.antecedencia.serie} />
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-4">Distribuição por canal</CardTitle>
          {a.distribuicaoPorCanal.length > 0 ? (
            <DonutPlataformas dados={a.distribuicaoPorCanal} />
          ) : (
            <Vazio />
          )}
        </Card>

        <Card>
          <CardTitle className="mb-4">Dias da semana mais reservados</CardTitle>
          <BarrasDiasSemana dados={a.diasSemana} />
        </Card>

        {/* Insights do período (IA — Fase 9) */}
        <Card className="border-ia/30 bg-ia-soft/40">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ia-soft text-ia">
              <Sparkles className="h-5 w-5" />
            </div>
            <CardTitle>Insights do período</CardTitle>
          </div>
          <p className="mt-2 text-legenda text-muted-foreground">
            A análise com IA do período chega na próxima fase.
          </p>
        </Card>
      </div>

      {/* Linha 3 */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Comparativo mensal (últimos 6 meses)</CardTitle>
            <div className="flex items-center gap-3 text-legenda text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full" style={{ backgroundColor: "var(--primary-text)" }} />
                Receita
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full" style={{ backgroundColor: "var(--warn)" }} />
                Ocupação
              </span>
            </div>
          </div>
          <ComparativoMensal dados={a.comparativoMensal} />
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ok-soft text-ok">
              <Trophy className="h-5 w-5" />
            </div>
            <CardTitle>Melhor desempenho</CardTitle>
          </div>
          {a.melhorDesempenho ? (
            <div className="mt-3">
              <p className="text-h3 font-semibold text-strong">{a.melhorDesempenho.imovel}</p>
              <p className="mt-1 text-body text-muted-foreground">
                {formatBRL(a.melhorDesempenho.receita)} de receita ·{" "}
                {formatPct(a.melhorDesempenho.ocupacao)} de ocupação no período.
              </p>
            </div>
          ) : (
            <Vazio />
          )}
        </Card>

        {/* Oportunidade (IA — Fase 9) */}
        <Card className="border-ia/30 bg-ia-soft/40">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ia-soft text-ia">
              <Clock className="h-5 w-5" />
            </div>
            <CardTitle>Oportunidade</CardTitle>
          </div>
          <p className="mt-2 text-legenda text-muted-foreground">
            A sugestão gerada por IA chega na próxima fase.
          </p>
        </Card>
      </div>
    </>
  );
}

function Vazio() {
  return (
    <p className="py-8 text-center text-legenda text-muted-foreground">
      Sem dados no período.
    </p>
  );
}
