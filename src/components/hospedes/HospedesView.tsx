"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Users, UserPlus, Repeat, Star, Search, MoreHorizontal, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FiltrosPagina } from "@/components/layout/FiltrosPagina";
import { EmptyState } from "@/components/common/EmptyState";
import { Estrelas } from "@/components/common/Estrelas";
import { PlataformaBadge } from "@/components/common/PlataformaBadge";
import { KpiCard } from "@/components/kpi/KpiCard";
import { DonutPlataformas } from "@/components/dashboard/DonutPlataformas";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { useHospedes } from "@/hooks/useHospedes";
import { formatBRL, formatData, formatNumero } from "@/lib/formatters";

function iniciais(nome: string) {
  return nome.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

const STATUS_LABEL: Record<string, { label: string; variant: "ok" | "info" | "danger" }> = {
  ATIVO: { label: "Ativo", variant: "ok" },
  FUTURO: { label: "Futuro", variant: "info" },
  CANCELADO: { label: "Cancelado", variant: "danger" },
};

export function HospedesView() {
  const { data, isLoading } = useHospedes();
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const lista = data?.hospedes ?? [];
    const q = busca.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter(
      (h) =>
        h.nome.toLowerCase().includes(q) ||
        (h.email ?? "").toLowerCase().includes(q) ||
        (h.telefone ?? "").toLowerCase().includes(q)
    );
  }, [data, busca]);

  if (isLoading && !data) {
    return (
      <>
        <PageHeader titulo="Hóspedes" filtros={<FiltrosPagina />} />
        <div className="flex flex-wrap gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 min-w-[190px] flex-1 rounded-2xl" />
          ))}
        </div>
      </>
    );
  }
  if (!data) return null;

  // Estado vazio (PRD §10)
  if (data.hospedes.length === 0) {
    return (
      <>
        <PageHeader titulo="Hóspedes" filtros={<FiltrosPagina />} />
        <EmptyState
          icon={Users}
          titulo="Nenhum hóspede ainda"
          texto="Os hóspedes entram na base conforme você cria reservas."
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
      <PageHeader titulo="Hóspedes" filtros={<FiltrosPagina />} />

      {/* 4 KPIs */}
      <div className="flex flex-wrap gap-5">
        <KpiCard rotulo="Total de hóspedes" valor={formatNumero(data.kpis.total)} icon={Users} tom="primary" />
        <KpiCard rotulo="Novos" valor={formatNumero(data.kpis.novos)} icon={UserPlus} tom="info" />
        <KpiCard rotulo="Recorrentes" valor={formatNumero(data.kpis.recorrentes)} icon={Repeat} tom="ok" />
        <KpiCard
          rotulo="Avaliação média"
          valor={data.kpis.avaliacaoMedia !== null ? data.kpis.avaliacaoMedia.toFixed(1) : "—"}
          icon={Star}
          tom="warn"
          rodape={
            <div className="flex items-center gap-2">
              <Estrelas nota={data.kpis.avaliacaoMedia ?? 0} tamanho={14} />
              <span className="text-legenda text-muted-foreground">
                {data.kpis.totalAvaliacoes} avaliaç{data.kpis.totalAvaliacoes === 1 ? "ão" : "ões"}
              </span>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        {/* Tabela */}
        <Card className="p-0 xl:col-span-3">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Hóspede</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="text-center">Reservas</TableHead>
                <TableHead>Última estadia</TableHead>
                <TableHead>Chalé</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead className="text-right">Total gasto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-legenda font-semibold text-primary-text">
                        {iniciais(h.nome)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-strong">{h.nome}</p>
                        <Badge variant={h.recorrente ? "default" : "neutral"}>
                          {h.recorrente ? "Recorrente" : "Novo"}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-body">{h.email ?? "—"}</p>
                    <p className="text-legenda text-muted-foreground">{h.telefone ?? "—"}</p>
                  </TableCell>
                  <TableCell className="text-center text-strong">{h.totalReservas}</TableCell>
                  <TableCell>
                    {h.ultimaEstadia ? (
                      <>
                        <p className="whitespace-nowrap text-body text-strong">
                          {formatData(h.ultimaEstadia.checkin)} → {formatData(h.ultimaEstadia.checkout)}
                        </p>
                        <p className="text-legenda text-muted-foreground">
                          {h.ultimaEstadia.noites} noite(s)
                        </p>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-body">
                    {h.ultimaEstadia?.imovelNome ?? "—"}
                  </TableCell>
                  <TableCell>
                    {h.ultimaEstadia ? (
                      <PlataformaBadge plataforma={h.ultimaEstadia.plataforma} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right font-medium text-strong">
                    {formatBRL(h.totalGasto)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_LABEL[h.status].variant}>
                      {STATUS_LABEL[h.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Ações do hóspede">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/reservas?q=${encodeURIComponent(h.email ?? h.nome)}`}>
                            <CalendarDays className="h-4 w-4" />
                            Ver reservas
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    Nenhum hóspede encontrado para “{busca}”.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Coluna direita */}
        <div className="flex flex-col gap-5">
          <Card>
            <CardTitle className="mb-3">Buscar hóspede</CardTitle>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Nome, e-mail ou telefone"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                aria-label="Buscar hóspede"
              />
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-4">Origem dos hóspedes</CardTitle>
            {data.origemPorPlataforma.length > 0 ? (
              <DonutPlataformas dados={data.origemPorPlataforma} />
            ) : (
              <p className="py-4 text-center text-legenda text-muted-foreground">
                Sem dados de origem ainda.
              </p>
            )}
          </Card>

          <Card>
            <CardTitle className="mb-3">Hóspedes recorrentes</CardTitle>
            {data.recorrentesTop3.length > 0 ? (
              <ul className="flex flex-col divide-y divide-border">
                {data.recorrentesTop3.map((h) => (
                  <li key={h.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-legenda font-semibold text-primary-text">
                        {iniciais(h.nome)}
                      </div>
                      <span className="text-label text-strong">{h.nome}</span>
                    </div>
                    <span className="font-medium text-strong">{formatBRL(h.totalGasto)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-legenda text-muted-foreground">
                Nenhum hóspede recorrente ainda.
              </p>
            )}
          </Card>

          <Card>
            <CardTitle className="mb-3">Próximas chegadas</CardTitle>
            {data.proximasChegadas.length > 0 ? (
              <ul className="flex flex-col divide-y divide-border">
                {data.proximasChegadas.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-label font-medium text-strong">
                        {c.hospedeNome}
                      </p>
                      <p className="truncate text-legenda text-muted-foreground">
                        {c.imovelNome}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-legenda text-muted-foreground">
                      {formatData(c.checkin)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-legenda text-muted-foreground">
                Nenhuma chegada prevista.
              </p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
