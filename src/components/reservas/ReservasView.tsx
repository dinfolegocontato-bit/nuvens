"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Ban,
  Trash2,
  CircleCheck,
  Clock,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  LogIn,
  LogOut,
  Wallet,
  Home,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FiltrosPagina } from "@/components/layout/FiltrosPagina";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PlataformaBadge } from "@/components/common/PlataformaBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { FormReservaEdit } from "@/components/reservas/FormReservaEdit";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/kpi/KpiCard";
import { DonutPlataformas } from "@/components/dashboard/DonutPlataformas";
import { Sparkline } from "@/components/analytics/Sparkline";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatBRL, formatData, formatNumero } from "@/lib/formatters";
import {
  useReservas,
  useMudarStatusReserva,
  useExcluirReserva,
  type FiltrosReservas,
} from "@/hooks/useReservas";
import { useMetricas } from "@/hooks/useMetricas";
import type { ReservaDTO, StatusReservaValor } from "@/lib/tipos";

const ABAS: { chave: string; label: string; status?: StatusReservaValor }[] = [
  { chave: "todas", label: "Todas as reservas" },
  { chave: "confirmadas", label: "Confirmadas", status: "CONFIRMADA" },
  { chave: "pendentes", label: "Pendentes", status: "PENDENTE" },
  { chave: "canceladas", label: "Canceladas", status: "CANCELADA" },
];

export function ReservasView() {
  const searchParams = useSearchParams();
  const agora = new Date();
  const mes = Number(searchParams.get("mes")) || agora.getMonth() + 1;
  const ano = Number(searchParams.get("ano")) || agora.getFullYear();
  const novoId = searchParams.get("novo");

  const [aba, setAba] = useState("todas");
  const [pagina, setPagina] = useState(1);
  const [emEdicao, setEmEdicao] = useState<ReservaDTO | null>(null);
  const [aCancelar, setACancelar] = useState<ReservaDTO | null>(null);
  const [aExcluir, setAExcluir] = useState<ReservaDTO | null>(null);
  const [destaque, setDestaque] = useState<string | null>(novoId);

  const status = ABAS.find((a) => a.chave === aba)?.status;

  const filtros: FiltrosReservas = useMemo(
    () => ({ mes, ano, status, pagina }),
    [mes, ano, status, pagina]
  );

  const { data, isLoading, isError, refetch } = useReservas(filtros);
  // KPIs e séries vêm do servidor (regra 4 — cliente não calcula métrica)
  const { data: m } = useMetricas(mes, ano);
  const mudarStatus = useMudarStatusReserva();
  const excluir = useExcluirReserva();

  // Destaca a linha recém-criada por 2s (PRD §6.4)
  useEffect(() => {
    if (!novoId) return;
    setDestaque(novoId);
    const t = setTimeout(() => setDestaque(null), 2000);
    return () => clearTimeout(t);
  }, [novoId]);

  // Volta pra página 1 ao trocar de aba
  useEffect(() => setPagina(1), [aba]);

  const reservas = data?.reservas ?? [];
  const total = data?.total ?? 0;
  const totalPaginas = data?.totalPaginas ?? 1;
  const inicio = total === 0 ? 0 : (pagina - 1) * 10 + 1;
  const fim = Math.min(pagina * 10, total);

  return (
    <>
      <PageHeader
        titulo="Reservas"
        filtros={<FiltrosPagina />}
        acoes={
          <Button asChild>
            <Link href="/reservas/nova">
              <Plus className="h-4 w-4" />
              Nova reserva
            </Link>
          </Button>
        }
      />

      {/* 6 KPIs (PRD §6.3) */}
      {m && (
        <div className="flex flex-wrap gap-5">
          <KpiCard rotulo="Total" valor={formatNumero(m.reservasResumo.total)} icon={CalendarCheck} tom="primary" />
          <KpiCard rotulo="Confirmadas" valor={formatNumero(m.reservasResumo.confirmadas)} icon={CircleCheck} tom="ok" />
          <KpiCard rotulo="Check-ins do mês" valor={formatNumero(m.reservasResumo.checkins)} icon={LogIn} tom="info" />
          <KpiCard rotulo="Check-outs do mês" valor={formatNumero(m.reservasResumo.checkouts)} icon={LogOut} tom="warn" />
          <KpiCard rotulo="Canceladas" valor={formatNumero(m.reservasResumo.canceladas)} icon={Ban} tom="danger" />
          <KpiCard rotulo="Receita do período" valor={formatBRL(m.reservasResumo.receitaLiquida)} icon={Wallet} tom="primary" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
      <Card className="p-0 xl:col-span-3">
        {/* Abas */}
        <div className="flex gap-1 overflow-x-auto border-b border-border px-3">
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

        {isLoading && (
          <div className="flex flex-col gap-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-body text-muted-foreground">
              Não deu para carregar as reservas.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Tentar de novo
            </Button>
          </div>
        )}

        {!isLoading && !isError && reservas.length === 0 && (
          <div className="p-4">
            <EmptyState
              icon={CalendarCheck}
              titulo="Nenhuma reserva neste período"
              texto="As reservas que você lançar aparecem aqui."
              acao={
                <Button asChild>
                  <Link href="/reservas/nova">Nova reserva</Link>
                </Button>
              }
            />
          </div>
        )}

        {!isLoading && !isError && reservas.length > 0 && (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Hóspede</TableHead>
                  <TableHead>Chalé</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Check-in / Check-out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor total</TableHead>
                  <TableHead className="text-right">Valor líquido</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservas.map((r) => (
                  <TableRow
                    key={r.id}
                    className={cn(destaque === r.id && "animate-highlight-row")}
                  >
                    <TableCell>
                      <p className="font-medium text-strong">{r.hospede.nome}</p>
                      {r.hospede.email && (
                        <p className="text-legenda text-muted-foreground">
                          {r.hospede.email}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-body text-strong">{r.imovel.nome}</p>
                      <p className="text-legenda text-muted-foreground">
                        {r.imovel.cidade}
                      </p>
                    </TableCell>
                    <TableCell>
                      <PlataformaBadge plataforma={r.plataforma} />
                    </TableCell>
                    <TableCell>
                      <p className="text-body text-strong">
                        {formatData(r.checkin)} → {formatData(r.checkout)}
                      </p>
                      <p className="text-legenda text-muted-foreground">
                        {r.noites} noite(s) · {r.numeroHospedes} hóspede(s)
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right text-strong">
                      {formatBRL(r.valorTotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          r.status === "CANCELADA"
                            ? "text-muted-foreground line-through"
                            : "font-medium text-primary-text"
                        )}
                      >
                        {formatBRL(r.valorLiquido)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <AcoesReserva
                        reserva={r}
                        onEditar={() => setEmEdicao(r)}
                        onCancelar={() => setACancelar(r)}
                        onExcluir={() => setAExcluir(r)}
                        onStatus={(s) =>
                          mudarStatus.mutate({ id: r.id, status: s })
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paginação */}
            <div className="flex items-center justify-between gap-4 border-t border-border px-5 py-3">
              <p className="text-legenda text-muted-foreground">
                Mostrando {inicio} a {fim} de {total} reserva(s)
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-label text-muted-foreground">
                  {pagina} / {totalPaginas}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={pagina >= totalPaginas}
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  aria-label="Próxima página"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

        {/* Coluna direita (PRD §6.3) */}
        <div className="flex flex-col gap-5">
          <Card>
            <CardTitle className="mb-3">Próxima chegada</CardTitle>
            {m?.proximaChegada ? (
              <div className="flex flex-col gap-3">
                {m.proximaChegada.imovelFoto ? (
                  <div className="relative h-28 w-full overflow-hidden rounded-xl">
                    <Image
                      src={m.proximaChegada.imovelFoto}
                      alt={m.proximaChegada.imovelNome}
                      fill
                      sizes="280px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-28 w-full items-center justify-center rounded-xl bg-gradient-to-br from-primary-soft to-sky-100 text-primary-text">
                    <Home className="h-8 w-8" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-strong">{m.proximaChegada.hospedeNome}</p>
                  <p className="text-legenda text-muted-foreground">
                    {m.proximaChegada.imovelNome}
                  </p>
                </div>
                <div className="flex items-center justify-between text-body">
                  <span className="text-muted-foreground">
                    {formatData(m.proximaChegada.checkin)} → {formatData(m.proximaChegada.checkout)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-legenda text-muted-foreground">
                    {m.proximaChegada.noites} noite(s)
                  </span>
                  <span className="font-semibold text-strong">
                    {formatBRL(m.proximaChegada.valorTotal)}
                  </span>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/calendario">Ver detalhes</Link>
                </Button>
              </div>
            ) : (
              <p className="py-6 text-center text-legenda text-muted-foreground">
                Nenhuma chegada prevista.
              </p>
            )}
          </Card>

          <Card>
            <CardTitle className="mb-4">Distribuição por plataforma</CardTitle>
            {m && m.reservasPorPlataforma.length > 0 ? (
              <DonutPlataformas dados={m.reservasPorPlataforma} />
            ) : (
              <p className="py-4 text-center text-legenda text-muted-foreground">
                Sem reservas no período.
              </p>
            )}
          </Card>

          <Card>
            <CardTitle className="mb-1">Reservas por mês</CardTitle>
            {m && (
              <>
                <p className="text-kpi-valor text-strong">
                  {formatNumero(
                    m.reservasPorMes[m.reservasPorMes.length - 1]?.quantidade ?? 0
                  )}
                </p>
                <p className="mb-2 text-legenda text-muted-foreground">
                  {m.reservasPorMes[0]?.rotulo} — {m.reservasPorMes[m.reservasPorMes.length - 1]?.rotulo}
                </p>
                <Sparkline
                  dados={m.reservasPorMes.map((x) => ({ v: x.quantidade }))}
                />
              </>
            )}
          </Card>
        </div>
      </div>

      <FormReservaEdit
        reserva={emEdicao}
        open={!!emEdicao}
        onOpenChange={(v) => !v && setEmEdicao(null)}
      />

      <ConfirmDialog
        open={!!aCancelar}
        onOpenChange={(v) => !v && setACancelar(null)}
        titulo="Cancelar reserva?"
        descricao={
          aCancelar
            ? `A reserva de ${aCancelar.hospede.nome} ficará com receita líquida R$ 0,00 e sai do cálculo de ocupação.`
            : ""
        }
        confirmarLabel="Cancelar reserva"
        cancelarLabel="Voltar"
        destrutivo
        carregando={mudarStatus.isPending}
        onConfirmar={() => {
          if (!aCancelar) return;
          const id = aCancelar.id;
          setACancelar(null);
          mudarStatus.mutate({ id, status: "CANCELADA" });
        }}
      />

      <ConfirmDialog
        open={!!aExcluir}
        onOpenChange={(v) => !v && setAExcluir(null)}
        titulo="Excluir reserva?"
        descricao={
          aExcluir
            ? `A reserva de ${aExcluir.hospede.nome} será removida definitivamente.`
            : ""
        }
        confirmarLabel="Excluir reserva"
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

function AcoesReserva({
  reserva,
  onEditar,
  onCancelar,
  onExcluir,
  onStatus,
}: {
  reserva: ReservaDTO;
  onEditar: () => void;
  onCancelar: () => void;
  onExcluir: () => void;
  onStatus: (s: StatusReservaValor) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Ações da reserva">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEditar}>
          <Pencil className="h-4 w-4" />
          Editar
        </DropdownMenuItem>
        {reserva.status !== "CONFIRMADA" && (
          <DropdownMenuItem onClick={() => onStatus("CONFIRMADA")}>
            <CircleCheck className="h-4 w-4" />
            Marcar como confirmada
          </DropdownMenuItem>
        )}
        {reserva.status !== "PENDENTE" && (
          <DropdownMenuItem onClick={() => onStatus("PENDENTE")}>
            <Clock className="h-4 w-4" />
            Marcar como pendente
          </DropdownMenuItem>
        )}
        {reserva.status !== "CANCELADA" && (
          <DropdownMenuItem
            className="text-danger focus:bg-danger-soft"
            onClick={onCancelar}
          >
            <Ban className="h-4 w-4" />
            Cancelar
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-danger focus:bg-danger-soft"
          onClick={onExcluir}
        >
          <Trash2 className="h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
