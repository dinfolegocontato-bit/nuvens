"use client";

import Image from "next/image";
import { Home, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { diasNoMes, paraDataUTC } from "@/lib/metricas";
import { PlataformaDot } from "@/components/common/PlataformaBadge";
import type { CalendarioResposta } from "@/lib/tipos";

const MS_DIA = 24 * 60 * 60 * 1000;
const LARGURA_DIA = 40; // px por dia
const LARGURA_IMOVEL = 200; // coluna fixa da esquerda (PRD §6.8)

export interface FiltrosCalendario {
  confirmadas: boolean;
  pendentes: boolean;
  bloqueios: boolean;
  manutencao: boolean;
}

/**
 * Converte um intervalo [iniTs, fimExTs) em colunas do grid do mês.
 * Retorna colunas 1-based relativas aos dias (a coluna do rótulo é somada depois).
 */
function posicaoNoMes(
  iniTs: number,
  fimExTs: number,
  mes: number,
  ano: number,
  nDias: number
) {
  const mesInicio = Date.UTC(ano, mes - 1, 1);
  const mesFimEx = Date.UTC(ano, mes, 1);

  const start = iniTs <= mesInicio ? 1 : new Date(iniTs).getUTCDate();
  const endEx = fimExTs >= mesFimEx ? nDias + 1 : new Date(fimExTs).getUTCDate();

  return {
    start,
    endEx,
    continuaEsquerda: iniTs < mesInicio,
    continuaDireita: fimExTs > mesFimEx,
    visivel: endEx > start,
  };
}

export function TimelineCalendario({
  dados,
  filtros,
  visao = "mes",
  onReserva,
  onBloqueio,
}: {
  dados: CalendarioResposta;
  filtros: FiltrosCalendario;
  /** "mes" = todos os dias; "semana" = a semana de hoje (ou a 1ª do mês) */
  visao?: "mes" | "semana";
  onReserva: (r: CalendarioResposta["reservas"][number]) => void;
  onBloqueio: (b: CalendarioResposta["bloqueios"][number]) => void;
}) {
  const { mes, ano, imoveis } = dados;
  const nDias = diasNoMes(mes, ano);
  const todosOsDias = Array.from({ length: nDias }, (_, i) => i + 1);

  // Visão Semana: recorta 7 dias a partir do domingo da semana de hoje
  // (ou do dia 1, se o mês exibido não é o corrente).
  const agora = new Date();
  const mesCorrente =
    agora.getFullYear() === ano && agora.getMonth() + 1 === mes;
  let primeiroDia = 1;
  if (visao === "semana") {
    if (mesCorrente) {
      const diaSemana = new Date(Date.UTC(ano, mes - 1, agora.getDate())).getUTCDay();
      primeiroDia = Math.max(1, agora.getDate() - diaSemana);
    }
  }
  const dias =
    visao === "semana"
      ? todosOsDias.slice(primeiroDia - 1, primeiroDia - 1 + 7)
      : todosOsDias;

  const hoje = new Date();
  const diaHoje =
    hoje.getFullYear() === ano && hoje.getMonth() + 1 === mes
      ? hoje.getDate()
      : null;

  const template = `${LARGURA_IMOVEL}px repeat(${dias.length}, minmax(${LARGURA_DIA}px, 1fr))`;
  const minWidth = LARGURA_IMOVEL + dias.length * LARGURA_DIA;

  // Janela visível em números de dia (fim exclusivo)
  const janelaIni = dias[0] ?? 1;
  const janelaFimEx = (dias[dias.length - 1] ?? nDias) + 1;

  /**
   * Recorta o intervalo à janela visível e devolve as colunas do grid.
   * Coluna 1 é o rótulo do imóvel, então o dia D vira a coluna (D - janelaIni + 2).
   */
  function colunasVisiveis(p: ReturnType<typeof posicaoNoMes>) {
    const s = Math.max(p.start, janelaIni);
    const e = Math.min(p.endEx, janelaFimEx);
    if (e <= s) return null; // barra fora da janela (ex.: outra semana)
    return {
      gridColumn: `${s - janelaIni + 2} / ${e - janelaIni + 2}`,
      continuaEsquerda: p.continuaEsquerda || p.start < janelaIni,
      continuaDireita: p.continuaDireita || p.endEx > janelaFimEx,
    };
  }

  const ehFimDeSemana = (d: number) => {
    const wd = new Date(Date.UTC(ano, mes - 1, d)).getUTCDay();
    return wd === 0 || wd === 6;
  };

  // Reservas canceladas não ocupam datas → não aparecem na timeline
  const reservas = dados.reservas.filter((r) => {
    if (r.status === "CANCELADA") return false;
    if (r.status === "CONFIRMADA") return filtros.confirmadas;
    if (r.status === "PENDENTE") return filtros.pendentes;
    return true;
  });
  const bloqueios = dados.bloqueios.filter((b) =>
    b.motivo === "MANUTENCAO" ? filtros.manutencao : filtros.bloqueios
  );

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth }}>
        {/* Cabeçalho de dias */}
        <div className="grid border-b border-border" style={{ gridTemplateColumns: template }}>
          <div className="sticky left-0 z-20 bg-surface px-3 py-2 text-legenda font-medium text-muted-foreground">
            Chalés
          </div>
          {dias.map((d) => (
            <div
              key={d}
              className={cn(
                "border-l border-border py-2 text-center text-legenda",
                ehFimDeSemana(d) && "bg-slate-50",
                diaHoje === d && "bg-primary-soft font-semibold text-primary-text"
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Linhas por imóvel */}
        {imoveis.map((im) => (
          <div
            key={im.id}
            className="grid border-b border-border"
            style={{ gridTemplateColumns: template }}
          >
            {/* Coluna fixa do imóvel */}
            <div
              className="sticky left-0 z-20 flex items-center gap-2 bg-surface px-3 py-2"
              style={{ gridColumn: 1, gridRow: 1 }}
            >
              {im.fotoUrl ? (
                <div className="relative h-8 w-10 shrink-0 overflow-hidden rounded-md">
                  <Image src={im.fotoUrl} alt="" fill sizes="40px" className="object-cover" />
                </div>
              ) : (
                <div className="flex h-8 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary-soft to-sky-100 text-primary-text">
                  <Home className="h-3.5 w-3.5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-label font-medium text-strong">{im.nome}</p>
                <p className="flex items-center gap-1 text-legenda text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {im.capacidade}
                  {im.status === "FUTURO" && " · futuro"}
                </p>
              </div>
            </div>

            {/* Fundo dos dias */}
            {dias.map((d) => (
              <div
                key={d}
                className={cn(
                  "min-h-[52px] border-l border-border",
                  ehFimDeSemana(d) && "bg-slate-50",
                  diaHoje === d && "bg-primary-soft/40"
                )}
                style={{ gridColumn: d - janelaIni + 2, gridRow: 1 }}
              />
            ))}

            {/* Barras de reserva */}
            {reservas
              .filter((r) => r.imovelId === im.id)
              .map((r) => {
                const p = posicaoNoMes(
                  paraDataUTC(r.checkin).getTime(),
                  paraDataUTC(r.checkout).getTime(), // checkout é exclusivo (dia de saída)
                  mes,
                  ano,
                  nDias
                );
                if (!p.visivel) return null;
                const c = colunasVisiveis(p);
                if (!c) return null;
                const confirmada = r.status === "CONFIRMADA";
                return (
                  <button
                    key={r.id}
                    onClick={() => onReserva(r)}
                    title={`${r.hospedeNome} · ${r.checkin} → ${r.checkout}`}
                    className={cn(
                      "z-10 mx-0.5 flex h-7 items-center gap-1.5 self-center overflow-hidden px-2 text-legenda font-medium text-white transition-opacity hover:opacity-90",
                      confirmada ? "bg-[var(--primary-text)]" : "bg-[var(--warn)]",
                      c.continuaEsquerda ? "rounded-l-none" : "rounded-l-full",
                      c.continuaDireita ? "rounded-r-none" : "rounded-r-full"
                    )}
                    style={{ gridColumn: c.gridColumn, gridRow: 1 }}
                  >
                    <PlataformaDot plataforma={r.plataforma} />
                    <span className="truncate">{r.hospedeNome}</span>
                  </button>
                );
              })}

            {/* Barras de bloqueio / manutenção */}
            {bloqueios
              .filter((b) => b.imovelId === im.id)
              .map((b) => {
                const p = posicaoNoMes(
                  paraDataUTC(b.inicio).getTime(),
                  paraDataUTC(b.fim).getTime() + MS_DIA, // fim é inclusive
                  mes,
                  ano,
                  nDias
                );
                if (!p.visivel) return null;
                const c = colunasVisiveis(p);
                if (!c) return null;
                const manutencao = b.motivo === "MANUTENCAO";
                const cor = manutencao ? "var(--danger)" : "#94A3B8";
                return (
                  <button
                    key={b.id}
                    onClick={() => onBloqueio(b)}
                    title={b.nota ?? (manutencao ? "Manutenção" : "Bloqueio")}
                    className={cn(
                      "z-10 mx-0.5 flex h-7 items-center overflow-hidden px-2 text-legenda font-medium text-white",
                      c.continuaEsquerda ? "rounded-l-none" : "rounded-l-full",
                      c.continuaDireita ? "rounded-r-none" : "rounded-r-full"
                    )}
                    style={{
                      gridColumn: c.gridColumn,
                      gridRow: 1,
                      alignSelf: "center",
                      backgroundImage: `repeating-linear-gradient(45deg, ${cor}, ${cor} 6px, rgba(255,255,255,.35) 6px, rgba(255,255,255,.35) 12px)`,
                    }}
                  >
                    <span className="truncate drop-shadow">
                      {manutencao ? "Manutenção" : "Bloqueado"}
                    </span>
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
