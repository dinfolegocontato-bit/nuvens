"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Home,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  BedDouble,
  Bath,
  Users,
  Building2,
  Gauge,
  Wallet,
  Star,
  Wrench,
  CalendarRange,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FiltrosPagina } from "@/components/layout/FiltrosPagina";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PlataformaDot } from "@/components/common/PlataformaBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Estrelas } from "@/components/common/Estrelas";
import { FormImovel } from "@/components/imoveis/FormImovel";
import { KpiCard } from "@/components/kpi/KpiCard";
import { TimelineCalendario } from "@/components/calendario/TimelineCalendario";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
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
import { useImoveis, useExcluirImovel } from "@/hooks/useImoveis";
import { useMetricas } from "@/hooks/useMetricas";
import { useCalendario } from "@/hooks/useCalendario";
import { cn } from "@/lib/utils";
import { formatBRL, formatData, formatNumero, formatPct } from "@/lib/formatters";
import type { ImovelDTO } from "@/lib/tipos";

const ABAS = [
  { chave: "visao", label: "Visão geral" },
  { chave: "disponibilidade", label: "Calendário de disponibilidade" },
  { chave: "manutencao", label: "Manutenção" },
] as const;

export function ImoveisView() {
  const sp = useSearchParams();
  const agora = new Date();
  const mes = Number(sp.get("mes")) || agora.getMonth() + 1;
  const ano = Number(sp.get("ano")) || agora.getFullYear();

  const { data: imoveis, isLoading, isError, refetch } = useImoveis();
  // KPIs e ocupação/receita por chalé vêm do servidor (regra 4)
  const { data: m } = useMetricas(mes, ano);
  const excluir = useExcluirImovel();

  const [formAberto, setFormAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<ImovelDTO | null>(null);
  const [statusInicial, setStatusInicial] = useState<"ATIVO" | "FUTURO">("ATIVO");
  const [aExcluir, setAExcluir] = useState<ImovelDTO | null>(null);
  const [aba, setAba] = useState<string>("visao");

  function abrirNovo(status: "ATIVO" | "FUTURO" = "ATIVO") {
    setEmEdicao(null);
    setStatusInicial(status);
    setFormAberto(true);
  }
  function abrirEdicao(i: ImovelDTO) {
    setEmEdicao(i);
    setFormAberto(true);
  }

  const temImoveis = !!imoveis && imoveis.length > 0;
  const desempenho = (id: string) => m?.ocupacaoPorChale.find((o) => o.id === id);

  return (
    <>
      <PageHeader
        titulo="Imóveis"
        filtros={<FiltrosPagina />}
        acoes={
          <Button onClick={() => abrirNovo("ATIVO")}>
            <Plus className="h-4 w-4" />
            Adicionar chalé
          </Button>
        }
      />

      {isLoading && <SkeletonTabela />}

      {isError && (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-body text-muted-foreground">
            Não deu para carregar os chalés agora.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </Card>
      )}

      {!isLoading && !isError && !temImoveis && (
        <EmptyState
          icon={Home}
          titulo="Nenhum chalé cadastrado"
          texto="Cadastre o primeiro chalé para começar a lançar reservas."
          acao={<Button onClick={() => abrirNovo("ATIVO")}>Adicionar chalé</Button>}
        />
      )}

      {!isLoading && !isError && temImoveis && (
        <>
          {/* 5 KPIs (PRD §6.6) */}
          {m && (
            <div className="flex flex-wrap gap-5">
              <KpiCard
                rotulo="Total de chalés"
                valor={formatNumero(m.imoveisResumo.total)}
                icon={Building2}
                tom="primary"
                rodape={
                  <p className="text-legenda text-muted-foreground">
                    {m.imoveisResumo.ativos} ativo(s) · {m.imoveisResumo.futuros} futuro(s)
                  </p>
                }
              />
              <KpiCard
                rotulo="Gerando reservas"
                valor={formatNumero(m.imoveisResumo.gerandoReservas)}
                icon={CalendarRange}
                tom="info"
              />
              <KpiCard
                rotulo="Ocupação média"
                valor={formatPct(m.atual.ocupacao)}
                icon={Gauge}
                tom="warn"
                delta={m.deltas.ocupacao}
              />
              <KpiCard
                rotulo="Receita do mês"
                valor={formatBRL(m.atual.receitaLiquida)}
                icon={Wallet}
                tom="ok"
                delta={m.deltas.receitaLiquida}
              />
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
          )}

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
            <div className="flex flex-col gap-4 xl:col-span-3">
              {/* Abas (PRD §6.6) */}
              <div className="flex gap-1 overflow-x-auto border-b border-border">
                {ABAS.map((a) => (
                  <button
                    key={a.chave}
                    onClick={() => setAba(a.chave)}
                    className={cn(
                      "whitespace-nowrap border-b-2 px-3 py-3 text-label transition-colors",
                      aba === a.chave
                        ? "border-primary font-medium text-primary-text"
                        : "border-transparent text-muted-foreground hover:text-body"
                    )}
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              {aba === "visao" && (
                <Card className="p-0">
                  <div className="px-5 pt-5">
                    <CardTitle>Meus chalés</CardTitle>
                  </div>
                  <Table className="mt-2">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Chalé</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Plataformas</TableHead>
                        <TableHead className="text-center">Capacidade</TableHead>
                        <TableHead className="text-center">Quartos</TableHead>
                        <TableHead className="text-center">Banheiros</TableHead>
                        <TableHead>Taxa de ocupação</TableHead>
                        <TableHead className="text-right">Receita do mês</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {imoveis!.map((i) => {
                        const d = desempenho(i.id);
                        return (
                          <TableRow key={i.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Miniatura imovel={i} />
                                <div className="min-w-0">
                                  <p className="font-medium text-strong">{i.nome}</p>
                                  <p className="text-legenda text-muted-foreground">
                                    {i.cidade}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={i.status} />
                            </TableCell>
                            <TableCell>
                              {i.plataformas.length ? (
                                <span className="flex items-center gap-1.5">
                                  {i.plataformas.map((p) => (
                                    <PlataformaDot key={p} plataforma={p} />
                                  ))}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center gap-1 text-body">
                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                {i.capacidade}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center gap-1 text-body">
                                <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
                                {i.quartos}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center gap-1 text-body">
                                <Bath className="h-3.5 w-3.5 text-muted-foreground" />
                                {i.banheiros}
                              </span>
                            </TableCell>
                            {/* Taxa de ocupação: número + barra de progresso (§6.6) */}
                            <TableCell>
                              {d ? (
                                <div className="min-w-[110px]">
                                  <p className="mb-1 text-body text-strong">
                                    {formatPct(d.ocupacao)}
                                  </p>
                                  <div className="h-2 overflow-hidden rounded-full bg-app">
                                    <div
                                      className="h-full rounded-full bg-[var(--primary-text)]"
                                      style={{ width: `${Math.min(100, d.ocupacao)}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-right font-medium text-strong">
                              {d ? formatBRL(d.receita) : "—"}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Ações do chalé"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => abrirEdicao(i)}>
                                    <Pencil className="h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-danger focus:bg-danger-soft"
                                    onClick={() => setAExcluir(i)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Linha tracejada — adicionar novo chalé (PRD §6.6) */}
                  <button
                    type="button"
                    onClick={() => abrirNovo("ATIVO")}
                    className="m-3 flex w-[calc(100%-1.5rem)] flex-col items-center gap-0.5 rounded-xl border border-dashed border-border py-4 text-center transition-colors hover:bg-app"
                  >
                    <span className="inline-flex items-center gap-2 font-medium text-primary-text">
                      <Plus className="h-4 w-4" />
                      Adicionar novo chalé
                    </span>
                    <span className="text-legenda text-muted-foreground">
                      Cadastre um chalé existente ou planeje um futuro.
                    </span>
                  </button>
                </Card>
              )}

              {aba === "disponibilidade" && <AbaDisponibilidade mes={mes} ano={ano} />}

              {aba === "manutencao" && (
                <Card>
                  <CardTitle className="mb-3">Manutenções</CardTitle>
                  {m && m.proximasManutencoes.length > 0 ? (
                    <ul className="flex flex-col divide-y divide-border">
                      {m.proximasManutencoes.map((x) => (
                        <li key={x.id} className="flex items-start justify-between gap-3 py-3">
                          <div className="flex items-start gap-2">
                            <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                            <div>
                              <p className="text-label font-medium text-strong">
                                {x.imovelNome}
                              </p>
                              {x.nota && (
                                <p className="text-legenda text-muted-foreground">{x.nota}</p>
                              )}
                            </div>
                          </div>
                          <span className="whitespace-nowrap text-legenda text-muted-foreground">
                            {formatData(x.inicio)} → {formatData(x.fim)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-6 text-center text-legenda text-muted-foreground">
                      Nenhuma manutenção agendada. Marque uma no Calendário → Bloquear datas.
                    </p>
                  )}
                </Card>
              )}
            </div>

            {/* Coluna direita (PRD §6.6) */}
            <div className="flex flex-col gap-5">
              <Card className="bg-gradient-to-br from-sky-100 to-emerald-50">
                <div className="flex h-16 items-center justify-center">
                  <Building2 className="h-10 w-10 text-primary-text/60" />
                </div>
                <CardTitle className="mt-2">Adicionar futuro chalé</CardTitle>
                <p className="mt-1 text-legenda text-body/70">
                  Planeje um chalé que ainda vai existir. Ele aparece no calendário como
                  linha vazia até virar ativo.
                </p>
                <Button
                  variant="outline"
                  className="mt-3 w-full bg-surface"
                  onClick={() => abrirNovo("FUTURO")}
                >
                  Criar novo projeto
                </Button>
              </Card>

              <Card>
                <CardTitle className="mb-3">Próximas manutenções</CardTitle>
                {m && m.proximasManutencoes.length > 0 ? (
                  <ul className="flex flex-col divide-y divide-border">
                    {m.proximasManutencoes.map((x) => (
                      <li key={x.id} className="py-2.5">
                        <p className="text-label font-medium text-strong">{x.imovelNome}</p>
                        <p className="text-legenda text-muted-foreground">
                          {formatData(x.inicio)} → {formatData(x.fim)}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-4 text-center text-legenda text-muted-foreground">
                    Nenhuma manutenção agendada.
                  </p>
                )}
              </Card>
            </div>
          </div>
        </>
      )}

      <FormImovel
        imovel={emEdicao}
        statusInicial={statusInicial}
        open={formAberto}
        onOpenChange={setFormAberto}
      />

      <ConfirmDialog
        open={!!aExcluir}
        onOpenChange={(v) => !v && setAExcluir(null)}
        titulo="Excluir chalé?"
        descricao={
          aExcluir
            ? `"${aExcluir.nome}" será removido. Essa ação não pode ser desfeita.`
            : ""
        }
        confirmarLabel="Excluir chalé"
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

/** Aba "Calendário de disponibilidade" — reusa a timeline do Calendário (§6.6). */
function AbaDisponibilidade({ mes, ano }: { mes: number; ano: number }) {
  const { data, isLoading } = useCalendario(mes, ano);
  if (isLoading && !data) return <Skeleton className="h-[260px] w-full rounded-2xl" />;
  if (!data || data.imoveis.length === 0) {
    return (
      <Card>
        <p className="py-8 text-center text-legenda text-muted-foreground">
          Nenhum chalé no calendário.
        </p>
      </Card>
    );
  }
  return (
    <Card className="p-0">
      <TimelineCalendario
        dados={data}
        filtros={{ confirmadas: true, pendentes: true, bloqueios: true, manutencao: true }}
        onReserva={() => {}}
        onBloqueio={() => {}}
      />
    </Card>
  );
}

function Miniatura({ imovel }: { imovel: ImovelDTO }) {
  if (imovel.fotoUrl) {
    return (
      <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md">
        <Image
          src={imovel.fotoUrl}
          alt={imovel.nome}
          fill
          sizes="56px"
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary-soft to-sky-100 text-primary-text">
      <Home className="h-4 w-4" />
    </div>
  );
}

function SkeletonTabela() {
  return (
    <Card className="flex flex-col gap-3">
      <Skeleton className="h-6 w-32" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-14" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </Card>
  );
}
