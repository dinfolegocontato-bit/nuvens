"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Wallet,
  Coins,
  TrendingDown,
  TrendingUp,
  Percent,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Receipt,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FiltrosPagina } from "@/components/layout/FiltrosPagina";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { KpiCard } from "@/components/kpi/KpiCard";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GraficoEvolucao } from "@/components/financeiro/GraficoEvolucao";
import { DonutCategorias } from "@/components/financeiro/DonutCategorias";
import { FormDespesa } from "@/components/financeiro/FormDespesa";
import { useFinanceiro, useExcluirDespesa } from "@/hooks/useFinanceiro";
import { cn } from "@/lib/utils";
import { formatBRL, formatData, formatPct } from "@/lib/formatters";
import type { DespesaDTO, TransacaoDTO } from "@/lib/tipos";

const ROTULO_PLATAFORMA: Record<string, string> = {
  AIRBNB: "Airbnb",
  BOOKING: "Booking.com",
  DIRETO: "Direto",
};
const COR_PLATAFORMA: Record<string, string> = {
  AIRBNB: "var(--airbnb)",
  BOOKING: "var(--booking)",
  DIRETO: "var(--direto)",
};

export function FinanceiroView() {
  const sp = useSearchParams();
  const agora = new Date();
  const mes = Number(sp.get("mes")) || agora.getMonth() + 1;
  const ano = Number(sp.get("ano")) || agora.getFullYear();

  const { data: f, isLoading } = useFinanceiro(mes, ano);
  const excluir = useExcluirDespesa();

  const [modalAberto, setModalAberto] = useState(sp.get("novo") === "1");
  const [emEdicao, setEmEdicao] = useState<DespesaDTO | null>(null);
  const [aExcluir, setAExcluir] = useState<TransacaoDTO | null>(null);
  const [intervalo, setIntervalo] = useState<"6m" | "ano">("6m");

  useEffect(() => {
    if (sp.get("novo") === "1") setModalAberto(true);
  }, [sp]);

  const categoriasConhecidas = useMemo(
    () => Array.from(new Set((f?.gastosPorCategoria ?? []).map((g) => g.categoria))),
    [f]
  );

  function abrirNovo() {
    setEmEdicao(null);
    setModalAberto(true);
  }

  function editar(t: TransacaoDTO) {
    // transação manual → monta o DTO da despesa para o formulário
    setEmEdicao({
      id: t.id,
      imovelId: null,
      data: t.data,
      descricao: t.descricao,
      categoria: t.categoria,
      fornecedor: t.origem,
      tipo: t.tipo,
      valor: t.valor,
      status: t.status,
    });
    setModalAberto(true);
  }

  if (isLoading && !f) {
    return (
      <>
        <PageHeader titulo="Financeiro" filtros={<FiltrosPagina />} />
        <div className="flex flex-wrap gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 min-w-[190px] flex-1 rounded-2xl" />
          ))}
        </div>
      </>
    );
  }
  if (!f) return null;

  const acoes = (
    <>
      <Button asChild variant="outline">
        <a href={`/api/relatorios/financeiro?mes=${mes}&ano=${ano}`} download>
          <Download className="h-4 w-4" />
          Exportar relatório
        </a>
      </Button>
      <Button onClick={abrirNovo}>
        <Plus className="h-4 w-4" />
        Novo lançamento
      </Button>
    </>
  );

  // Estado vazio (PRD §10)
  if (f.transacoes.length === 0) {
    return (
      <>
        <PageHeader titulo="Financeiro" filtros={<FiltrosPagina />} acoes={acoes} />
        <EmptyState
          icon={Wallet}
          titulo="Sem lançamentos no mês"
          texto="Entradas vêm das reservas confirmadas. Lance aqui as despesas."
          acao={<Button onClick={abrirNovo}>Novo lançamento</Button>}
        />
        <FormDespesa
          despesa={emEdicao}
          categoriasConhecidas={categoriasConhecidas}
          open={modalAberto}
          onOpenChange={setModalAberto}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader titulo="Financeiro" filtros={<FiltrosPagina />} acoes={acoes} />

      {/* 5 KPIs */}
      <div className="flex flex-wrap gap-5">
        <KpiCard rotulo="Receita líquida" valor={formatBRL(f.kpis.receitaLiquida)} icon={Wallet} tom="primary" delta={f.deltas.receitaLiquida} />
        <KpiCard rotulo="Receita bruta" valor={formatBRL(f.kpis.receitaBruta)} icon={Coins} tom="info" delta={f.deltas.receitaBruta} />
        <KpiCard rotulo="Gastos totais" valor={formatBRL(f.kpis.gastos)} icon={TrendingDown} tom="danger" delta={f.deltas.gastos} />
        <KpiCard rotulo="Lucro líquido" valor={formatBRL(f.kpis.lucroLiquido)} icon={TrendingUp} tom="ok" delta={f.deltas.lucroLiquido} />
        <KpiCard rotulo="Margem de lucro" valor={formatPct(f.kpis.margem)} icon={Percent} tom="warn" delta={f.deltas.margem} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="flex flex-col gap-5 xl:col-span-2">
          {/* Evolução do resultado */}
          <Card>
            <div className="mb-2 flex items-center justify-between gap-4">
              <CardTitle>Evolução do resultado</CardTitle>
              <div className="flex items-center gap-1 rounded-xl border border-border p-0.5">
                {(
                  [
                    ["6m", "Últimos 6 meses"],
                    ["ano", "Este ano"],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setIntervalo(v)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-legenda transition-colors",
                      intervalo === v
                        ? "bg-primary-soft font-medium text-primary-text"
                        : "text-muted-foreground hover:bg-app"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <GraficoEvolucao
              dados={intervalo === "6m" ? f.evolucaoSeisMeses : f.evolucaoAno}
            />
          </Card>

          {/* Gastos por categoria */}
          <Card>
            <CardTitle className="mb-4">Gastos por categoria</CardTitle>
            {f.gastosPorCategoria.length > 0 ? (
              <DonutCategorias dados={f.gastosPorCategoria} />
            ) : (
              <p className="py-8 text-center text-legenda text-muted-foreground">
                Nenhum gasto lançado neste mês.
              </p>
            )}
          </Card>

          {/* Transações recentes */}
          <Card className="p-0">
            <div className="px-5 pt-5">
              <CardTitle>Transações recentes</CardTitle>
            </div>
            <Table className="mt-2">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Fornecedor / Origem</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {f.transacoes.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap">{formatData(t.data)}</TableCell>
                    <TableCell>
                      <span className="text-strong">{t.descricao}</span>
                      {t.automatico && (
                        <Badge variant="neutral" className="ml-2">
                          Automático
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{t.categoria}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.origem ?? "—"}</TableCell>
                    <TableCell>
                      <span className={t.tipo === "ENTRADA" ? "text-ok" : "text-danger"}>
                        {t.tipo === "ENTRADA" ? "Entrada" : "Saída"}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "whitespace-nowrap text-right font-medium",
                        t.tipo === "ENTRADA" ? "text-ok" : "text-danger"
                      )}
                    >
                      {t.tipo === "ENTRADA" ? "+" : "−"} {formatBRL(t.valor)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.status === "PAGO" ? "ok" : "warn"}>
                        {t.status === "PAGO" ? "Pago" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!t.automatico && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Ações do lançamento">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => editar(t)}>
                              <Pencil className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-danger focus:bg-danger-soft"
                              onClick={() => setAExcluir(t)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Coluna direita */}
        <div className="flex flex-col gap-5">
          <Card>
            <CardTitle className="mb-3">Fluxo de caixa</CardTitle>
            <div className="flex flex-col gap-2 text-body">
              <Linha label="Saldo inicial" valor={formatBRL(f.fluxoCaixa.saldoInicial)} />
              <Linha label="+ Entradas" valor={formatBRL(f.fluxoCaixa.entradas)} cor="text-ok" />
              <Linha label="− Saídas" valor={formatBRL(f.fluxoCaixa.saidas)} cor="text-danger" />
              <div className="mt-1 flex items-center justify-between border-t border-border pt-3">
                <span className="font-semibold text-strong">Saldo atual</span>
                <span className="text-h3 font-semibold text-strong">
                  {formatBRL(f.fluxoCaixa.saldoAtual)}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-3">Contas a pagar</CardTitle>
            {f.contasAPagar.length > 0 ? (
              <ul className="flex flex-col divide-y divide-border">
                {f.contasAPagar.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-label font-medium text-strong">{c.descricao}</p>
                      <p className="text-legenda text-muted-foreground">
                        vence {formatData(c.data)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-danger">{formatBRL(c.valor)}</span>
                      <Badge variant={c.status === "PAGO" ? "ok" : "warn"}>
                        {c.status === "PAGO" ? "Pago" : "Pendente"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Receipt className="h-6 w-6 text-muted-foreground" />
                <p className="text-legenda text-muted-foreground">Nenhuma conta pendente.</p>
              </div>
            )}
          </Card>

          <Card>
            <CardTitle className="mb-3">Resumo por plataforma</CardTitle>
            {f.resumoPorPlataforma.length > 0 ? (
              <div className="flex flex-col gap-3">
                {f.resumoPorPlataforma.map((p) => (
                  <div key={p.plataforma}>
                    <div className="mb-1 flex items-center justify-between text-label">
                      <span className="text-body">{ROTULO_PLATAFORMA[p.plataforma]}</span>
                      <span className="font-medium text-strong">{formatBRL(p.receita)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-app">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${p.pct}%`,
                          backgroundColor: COR_PLATAFORMA[p.plataforma],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-legenda text-muted-foreground">
                Sem receita no período.
              </p>
            )}
          </Card>
        </div>
      </div>

      <FormDespesa
        despesa={emEdicao}
        categoriasConhecidas={categoriasConhecidas}
        open={modalAberto}
        onOpenChange={setModalAberto}
      />

      <ConfirmDialog
        open={!!aExcluir}
        onOpenChange={(v) => !v && setAExcluir(null)}
        titulo="Excluir lançamento?"
        descricao={aExcluir ? `"${aExcluir.descricao}" será removido.` : ""}
        confirmarLabel="Excluir lançamento"
        destrutivo
        carregando={excluir.isPending}
        onConfirmar={() => {
          if (!aExcluir) return;
          const id = aExcluir.id;
          setAExcluir(null);
          excluir.mutate(id);
        }}
      />
    </>
  );
}

function Linha({
  label,
  valor,
  cor,
}: {
  label: string;
  valor: string;
  cor?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", cor ?? "text-strong")}>{valor}</span>
    </div>
  );
}
