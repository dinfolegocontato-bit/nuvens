"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarX,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Trash2,
  Ban,
  Download,
  Moon,
  Wallet,
  LogIn,
  LogOut,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PlataformaBadge } from "@/components/common/PlataformaBadge";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  TimelineCalendario,
  type FiltrosCalendario,
} from "@/components/calendario/TimelineCalendario";
import { FormBloqueio } from "@/components/calendario/FormBloqueio";
import { MiniCalendario } from "@/components/calendario/MiniCalendario";
import { KpiCard } from "@/components/kpi/KpiCard";
import { useCalendario, useExcluirBloqueio } from "@/hooks/useCalendario";
import { useMudarStatusReserva } from "@/hooks/useReservas";
import { useMetricas } from "@/hooks/useMetricas";
import { cn } from "@/lib/utils";
import { formatBRL, formatData, formatNumero, formatPct, rotuloPeriodo } from "@/lib/formatters";
import { mesAnterior } from "@/lib/metricas";
import type { CalendarioResposta } from "@/lib/tipos";

type ReservaCal = CalendarioResposta["reservas"][number];
type BloqueioCal = CalendarioResposta["bloqueios"][number];

const LEGENDA = [
  { label: "Confirmada", cor: "var(--primary-text)" },
  { label: "Check-in hoje", cor: "var(--ok)" },
  { label: "Check-out hoje", cor: "var(--info)" },
  { label: "Pendente", cor: "var(--warn)" },
  { label: "Bloqueada", cor: "#94A3B8" },
  { label: "Manutenção", cor: "var(--danger)" },
];

export function CalendarioView() {
  const router = useRouter();
  const sp = useSearchParams();
  const agora = new Date();
  const mes = Number(sp.get("mes")) || agora.getMonth() + 1;
  const ano = Number(sp.get("ano")) || agora.getFullYear();

  const { data, isLoading } = useCalendario(mes, ano);
  // KPIs do rodapé vêm do servidor (regra 4)
  const { data: m } = useMetricas(mes, ano);
  const excluirBloqueio = useExcluirBloqueio();
  const mudarStatus = useMudarStatusReserva();

  const [visao, setVisao] = useState<"mes" | "semana">("mes");
  const [bloquearAberto, setBloquearAberto] = useState(sp.get("bloquear") === "1");
  const [reservaSel, setReservaSel] = useState<ReservaCal | null>(null);
  const [bloqueioSel, setBloqueioSel] = useState<BloqueioCal | null>(null);
  const [filtros, setFiltros] = useState<FiltrosCalendario>({
    confirmadas: true,
    pendentes: true,
    bloqueios: true,
    manutencao: true,
  });

  // Atalho da sidebar: /calendario?bloquear=1
  useEffect(() => {
    if (sp.get("bloquear") === "1") setBloquearAberto(true);
  }, [sp]);

  function irPara(m: number, a: number) {
    router.push(`/calendario?mes=${m}&ano=${a}`);
  }
  function anterior() {
    const p = mesAnterior(mes, ano);
    irPara(p.mes, p.ano);
  }
  function proximo() {
    const p = mes === 12 ? { mes: 1, ano: ano + 1 } : { mes: mes + 1, ano };
    irPara(p.mes, p.ano);
  }
  function hoje() {
    irPara(agora.getMonth() + 1, agora.getFullYear());
  }

  const temImoveis = !!data && data.imoveis.length > 0;
  const hojeISO = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
  const proximosCheckins = (data?.reservas ?? [])
    .filter((r) => r.status !== "CANCELADA" && r.checkin >= hojeISO)
    .sort((a, b) => a.checkin.localeCompare(b.checkin))
    .slice(0, 5);

  return (
    <>
      <PageHeader
        titulo="Calendário"
        acoes={
          <div className="flex flex-wrap items-center gap-2">
            {/* Seletor Mês / Semana (PRD §6.8) */}
            <div className="flex items-center gap-1 rounded-xl border border-border p-0.5">
              {(
                [
                  ["mes", "Mês"],
                  ["semana", "Semana"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setVisao(v)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-legenda transition-colors",
                    visao === v
                      ? "bg-primary-soft font-medium text-primary-text"
                      : "text-muted-foreground hover:bg-app"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-0.5">
              <Button variant="ghost" size="icon" onClick={anterior} aria-label="Mês anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[110px] text-center text-label font-medium text-strong">
                {rotuloPeriodo(mes, ano)}
              </span>
              <Button variant="ghost" size="icon" onClick={proximo} aria-label="Próximo mês">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={hoje}>
              Hoje
            </Button>
            <Button variant="outline" asChild>
              <a href={`/api/calendario/ics?mes=${mes}&ano=${ano}`} download>
                <Download className="h-4 w-4" />
                Exportar .ics
              </a>
            </Button>
            <Button onClick={() => setBloquearAberto(true)} disabled={!temImoveis}>
              <CalendarX className="h-4 w-4" />
              Bloquear datas
            </Button>
          </div>
        }
      />

      {isLoading && !data && <Skeleton className="h-[320px] w-full rounded-2xl" />}

      {data && !temImoveis && (
        <EmptyState
          icon={Calendar}
          titulo="Nenhum chalé no calendário"
          texto="Cadastre um chalé para ver a agenda."
          acao={
            <Button asChild>
              <Link href="/imoveis">Adicionar chalé</Link>
            </Button>
          }
        />
      )}

      {data && temImoveis && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
          <div className="flex flex-col gap-4 xl:col-span-3">
            {/* Legenda */}
            <div className="flex flex-wrap items-center gap-2">
              {LEGENDA.map((l) => (
                <span
                  key={l.label}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-legenda text-body"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.cor }} />
                  {l.label}
                </span>
              ))}
            </div>

            <Card className="p-0">
              <TimelineCalendario
                dados={data}
                filtros={filtros}
                visao={visao}
                onReserva={setReservaSel}
                onBloqueio={setBloqueioSel}
              />
              {/* Linha tracejada — adicionar imóvel (PRD §6.8) */}
              <Link
                href="/imoveis"
                className="m-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-label font-medium text-primary-text transition-colors hover:bg-app"
              >
                <Plus className="h-4 w-4" />
                Adicionar imóvel
              </Link>
            </Card>
          </div>

          {/* Coluna direita */}
          <div className="flex flex-col gap-5">
            <Card>
              <MiniCalendario dados={data} />
            </Card>

            <Card>
              <CardTitle className="mb-3">Filtros rápidos</CardTitle>
              <div className="flex flex-col gap-2">
                {(
                  [
                    ["confirmadas", "Confirmadas"],
                    ["pendentes", "Pendentes"],
                    ["bloqueios", "Bloqueios"],
                    ["manutencao", "Manutenção"],
                  ] as const
                ).map(([chave, label]) => (
                  <button
                    key={chave}
                    onClick={() => setFiltros((f) => ({ ...f, [chave]: !f[chave] }))}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-3 py-2 text-label transition-colors",
                      filtros[chave]
                        ? "border-primary bg-primary-soft text-primary-text"
                        : "border-border bg-surface text-muted-foreground hover:bg-app"
                    )}
                  >
                    {label}
                    <span
                      className={cn(
                        "h-4 w-4 rounded-md border",
                        filtros[chave] ? "border-primary bg-primary" : "border-border"
                      )}
                    />
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <CardTitle className="mb-3">Próximos check-ins</CardTitle>
              {proximosCheckins.length > 0 ? (
                <ul className="flex flex-col divide-y divide-border">
                  {proximosCheckins.map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-label font-medium text-strong">
                          {r.hospedeNome}
                        </p>
                        <p className="text-legenda text-muted-foreground">
                          {formatData(r.checkin)}
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-center text-legenda text-muted-foreground">
                  Nenhum check-in a caminho.
                </p>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Faixa de 5 KPIs do mês (PRD §6.8) */}
      {data && temImoveis && m && (
        <div className="flex flex-wrap gap-5">
          <Card className="flex min-w-[190px] flex-1 items-center gap-4">
            <DonutOcupacao valor={m.atual.ocupacao} />
            <div>
              <p className="text-kpi-rotulo text-muted-foreground">Ocupação</p>
              <p className="text-kpi-valor text-strong">{formatPct(m.atual.ocupacao)}</p>
            </div>
          </Card>
          <KpiCard
            rotulo="Noites reservadas"
            valor={formatNumero(m.atual.noitesVendidas)}
            icon={Moon}
            tom="info"
          />
          <KpiCard
            rotulo="Receita confirmada"
            valor={formatBRL(m.atual.receitaLiquida)}
            icon={Wallet}
            tom="primary"
          />
          <KpiCard
            rotulo="Check-ins"
            valor={formatNumero(m.reservasResumo.checkins)}
            icon={LogIn}
            tom="ok"
          />
          <KpiCard
            rotulo="Check-outs"
            valor={formatNumero(m.reservasResumo.checkouts)}
            icon={LogOut}
            tom="warn"
          />
        </div>
      )}

      {/* Modal bloquear datas */}
      <FormBloqueio
        imoveis={data?.imoveis ?? []}
        open={bloquearAberto}
        onOpenChange={setBloquearAberto}
      />

      {/* Detalhes da reserva */}
      <Dialog open={!!reservaSel} onOpenChange={(v) => !v && setReservaSel(null)}>
        <DialogContent className="max-w-md">
          {reservaSel && (
            <>
              <DialogHeader>
                <DialogTitle>{reservaSel.hospedeNome}</DialogTitle>
                <DialogDescription>
                  {formatData(reservaSel.checkin)} → {formatData(reservaSel.checkout)} ·{" "}
                  {reservaSel.numeroHospedes} hóspede(s)
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-body">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={reservaSel.status} />
                </div>
                <div className="flex items-center justify-between text-body">
                  <span className="text-muted-foreground">Plataforma</span>
                  <PlataformaBadge plataforma={reservaSel.plataforma} />
                </div>
                <div className="flex items-center justify-between text-body">
                  <span className="text-muted-foreground">Valor total</span>
                  <span className="font-medium text-strong">
                    {formatBRL(reservaSel.valorTotal)}
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" asChild>
                  <Link href="/reservas">Editar em Reservas</Link>
                </Button>
                <Button
                  variant="destructive"
                  disabled={mudarStatus.isPending}
                  onClick={() => {
                    mudarStatus.mutate({ id: reservaSel.id, status: "CANCELADA" });
                    setReservaSel(null);
                  }}
                >
                  <Ban className="h-4 w-4" />
                  Cancelar reserva
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Detalhes do bloqueio */}
      <Dialog open={!!bloqueioSel} onOpenChange={(v) => !v && setBloqueioSel(null)}>
        <DialogContent className="max-w-md">
          {bloqueioSel && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {bloqueioSel.motivo === "MANUTENCAO" ? "Manutenção" : "Bloqueio"}
                </DialogTitle>
                <DialogDescription>
                  {formatData(bloqueioSel.inicio)} → {formatData(bloqueioSel.fim)}
                </DialogDescription>
              </DialogHeader>
              {bloqueioSel.nota && <p className="text-body">{bloqueioSel.nota}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setBloqueioSel(null)}>
                  Fechar
                </Button>
                <Button
                  variant="destructive"
                  disabled={excluirBloqueio.isPending}
                  onClick={() => {
                    excluirBloqueio.mutate(bloqueioSel.id);
                    setBloqueioSel(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Remover bloqueio
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Donut de ocupação para a faixa de KPIs do rodapé (PRD §6.8). */
function DonutOcupacao({ valor }: { valor: number }) {
  const pct = Math.max(0, Math.min(100, valor));
  const raio = 26;
  const circunferencia = 2 * Math.PI * raio;
  return (
    <svg width={64} height={64} viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r={raio} fill="none" stroke="var(--bg-app)" strokeWidth="8" />
      <circle
        cx="32"
        cy="32"
        r={raio}
        fill="none"
        stroke="var(--primary-text)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * circunferencia} ${circunferencia}`}
        transform="rotate(-90 32 32)"
      />
    </svg>
  );
}
