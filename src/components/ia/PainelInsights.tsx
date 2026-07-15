"use client";

import { Sparkles, Lightbulb, AlertCircle, RefreshCw, ArrowRight } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useInsightsIA } from "@/hooks/useIA";
import { ApiError } from "@/lib/api-client";
import type { ImpactoInsight, InsightDTO } from "@/lib/tipos";

const IMPACTO: Record<ImpactoInsight, { label: string; variant: "danger" | "warn" | "neutral" }> = {
  alto: { label: "Impacto alto", variant: "danger" },
  medio: { label: "Impacto médio", variant: "warn" },
  baixo: { label: "Impacto baixo", variant: "neutral" },
};

/**
 * Painel de Insights com IA (PRD §7.1).
 * Estados: vazio (Gerar análise), carregando (skeleton), erro.
 * A tela funciona 100% sem a IA.
 */
export function PainelInsights({
  mes,
  ano,
  titulo = "Insights com IA",
  colunas = 2,
  onInsights,
}: {
  mes: number;
  ano: number;
  titulo?: string;
  /** 1 = coluna estreita (Analytics), 2 = faixa larga (Dashboard) */
  colunas?: 1 | 2;
  /** avisa o pai dos insights gerados (o card "Oportunidade" reusa o de maior impacto) */
  onInsights?: (insights: InsightDTO[]) => void;
}) {
  const insights = useInsightsIA();
  const dados = insights.data?.insights;
  const grade = colunas === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1";

  function gerar() {
    insights.mutate(
      { mes, ano },
      { onSuccess: (r) => onInsights?.(r.insights) }
    );
  }

  const mensagemErro =
    insights.error instanceof ApiError && insights.error.codigo === "IA_NAO_CONFIGURADA"
      ? insights.error.message
      : "Não deu para gerar os insights agora. Tente de novo.";

  return (
    <Card className="border-ia/30 bg-ia-soft/40">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ia-soft text-ia">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>{titulo}</CardTitle>
            <p className="text-legenda text-muted-foreground">
              Análise do período com sugestões de ação.
            </p>
          </div>
        </div>

        {dados && (
          <Button
            variant="outline"
            size="sm"
            onClick={gerar}
            disabled={insights.isPending}
          >
            <RefreshCw className="h-4 w-4" />
            Gerar outra
          </Button>
        )}
      </div>

      {/* Carregando */}
      {insights.isPending && (
        <div className={`grid gap-4 ${grade}`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-2 h-3 w-full" />
              <Skeleton className="mt-1.5 h-3 w-4/5" />
              <Skeleton className="mt-3 h-3 w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Erro */}
      {!insights.isPending && insights.isError && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <AlertCircle className="h-6 w-6 text-danger" />
          <p className="text-body text-danger">{mensagemErro}</p>
          <Button variant="outline" onClick={gerar}>
            Tentar de novo
          </Button>
        </div>
      )}

      {/* Vazio */}
      {!insights.isPending && !insights.isError && !dados && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="max-w-md text-body text-muted-foreground">
            A IA lê os números do período e sugere o que fazer com eles.
          </p>
          <Button onClick={gerar}>
            <Sparkles className="h-4 w-4" />
            Gerar análise
          </Button>
        </div>
      )}

      {/* Resultado */}
      {!insights.isPending && dados && (
        <div className={`grid gap-4 ${grade}`}>
          {dados.map((i, idx) => (
            <div key={idx} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ia-soft text-ia">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <h4 className="text-label font-semibold text-strong">{i.titulo}</h4>
                </div>
                <Badge variant={IMPACTO[i.impacto].variant}>
                  {IMPACTO[i.impacto].label}
                </Badge>
              </div>
              <p className="text-body text-muted-foreground">{i.descricao}</p>
              <p className="mt-auto flex items-start gap-1.5 pt-1 text-label text-primary-text">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {i.acao}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
