"use client";

import { useState } from "react";
import { Star, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Estrelas } from "@/components/common/Estrelas";
import { PlataformaBadge } from "@/components/common/PlataformaBadge";
import { FormAvaliacao } from "@/components/avaliacoes/FormAvaliacao";
import { BotaoRespostaIA } from "@/components/ia/BotaoRespostaIA";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvaliacoes } from "@/hooks/useAvaliacoes";
import { formatData, formatNumero } from "@/lib/formatters";

function iniciais(nome: string) {
  return nome.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export function AvaliacoesView() {
  const { data, isLoading } = useAvaliacoes();
  const [modalAberto, setModalAberto] = useState(false);

  const acoes = (
    <Button onClick={() => setModalAberto(true)}>
      <Plus className="h-4 w-4" />
      Registrar avaliação
    </Button>
  );

  if (isLoading && !data) {
    return (
      <>
        <PageHeader titulo="Avaliações" acoes={acoes} />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </>
    );
  }
  if (!data) return null;

  // Estado vazio (PRD §10)
  if (data.avaliacoes.length === 0) {
    return (
      <>
        <PageHeader titulo="Avaliações" acoes={acoes} />
        <EmptyState
          icon={Star}
          titulo="Nenhuma avaliação ainda"
          texto="Registre as avaliações que chegam pelas plataformas."
          acao={<Button onClick={() => setModalAberto(true)}>Registrar avaliação</Button>}
        />
        <FormAvaliacao open={modalAberto} onOpenChange={setModalAberto} />
      </>
    );
  }

  const { resumo } = data;

  return (
    <>
      <PageHeader titulo="Avaliações" acoes={acoes} />

      {/* Resumo */}
      <Card>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col items-center gap-1 sm:w-48">
            <span className="text-[48px] font-bold leading-none text-strong">
              {resumo.media !== null ? resumo.media.toFixed(1) : "—"}
            </span>
            <Estrelas nota={resumo.media ?? 0} tamanho={18} />
            <span className="text-legenda text-muted-foreground">
              {formatNumero(resumo.total)} avaliaç{resumo.total === 1 ? "ão" : "ões"}
            </span>
          </div>

          {/* Distribuição 5→1 */}
          <div className="flex flex-1 flex-col gap-1.5">
            {resumo.distribuicao.map((d) => (
              <div key={d.nota} className="flex items-center gap-3">
                <span className="w-10 shrink-0 text-legenda text-muted-foreground">
                  {d.nota} ★
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-app">
                  <div
                    className="h-full rounded-full bg-warn"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-legenda text-muted-foreground">
                  {d.quantidade}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Lista */}
      <div className="flex flex-col gap-4">
        {data.avaliacoes.map((a) => (
          <Card key={a.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-label font-semibold text-primary-text">
                  {iniciais(a.hospedeNome)}
                </div>
                <div>
                  <p className="font-medium text-strong">{a.hospedeNome}</p>
                  <p className="flex flex-wrap items-center gap-1.5 text-legenda text-muted-foreground">
                    {a.imovelNome} ·
                    <PlataformaBadge plataforma={a.plataforma} />
                    · {formatData(a.data)}
                  </p>
                </div>
              </div>
              <Estrelas nota={a.nota} tamanho={16} />
            </div>

            {a.comentario && <p className="text-body">{a.comentario}</p>}

            {a.respostaEnviada && (
              <div className="rounded-xl border border-ia/30 bg-ia-soft p-3">
                <p className="mb-1 text-legenda font-medium text-ia">Sua resposta</p>
                <p className="text-body text-strong">{a.respostaEnviada}</p>
              </div>
            )}

            <BotaoRespostaIA avaliacao={a} />
          </Card>
        ))}
      </div>

      <FormAvaliacao open={modalAberto} onOpenChange={setModalAberto} />
    </>
  );
}
