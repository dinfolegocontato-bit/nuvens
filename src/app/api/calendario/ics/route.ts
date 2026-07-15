import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { erroInterno } from "@/lib/api";

/**
 * Exportar calendário (.ics) — PRD §6.8.
 * Gera um iCalendar com as reservas não canceladas e os bloqueios do mês.
 */

/** Escapa texto conforme RFC 5545 (vírgula, ponto e vírgula, barra e quebra de linha). */
function escapar(texto: string): string {
  return texto
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Date → YYYYMMDD (a partir das partes UTC, sem escorregar de fuso). */
function dataICS(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

/** Date → YYYYMMDDTHHMMSSZ */
function carimbo(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/** Dobra linhas com mais de 75 octetos, como manda o RFC 5545. */
function dobrar(linha: string): string {
  if (linha.length <= 75) return linha;
  const partes: string[] = [linha.slice(0, 75)];
  let resto = linha.slice(75);
  while (resto.length > 74) {
    partes.push(" " + resto.slice(0, 74));
    resto = resto.slice(74);
  }
  if (resto) partes.push(" " + resto);
  return partes.join("\r\n");
}

// GET /api/calendario/ics?mes=&ano=
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const agora = new Date();
    const mes = Number(sp.get("mes")) || agora.getMonth() + 1;
    const ano = Number(sp.get("ano")) || agora.getFullYear();

    const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
    const inicioProximo = new Date(Date.UTC(ano, mes, 1));

    const [reservas, bloqueios] = await Promise.all([
      prisma.reserva.findMany({
        where: {
          status: { not: "CANCELADA" },
          checkin: { lt: inicioProximo },
          checkout: { gt: inicioMes },
        },
        include: {
          hospede: { select: { nome: true } },
          imovel: { select: { nome: true } },
        },
        orderBy: { checkin: "asc" },
      }),
      prisma.bloqueio.findMany({
        where: { inicio: { lt: inicioProximo }, fim: { gte: inicioMes } },
        include: { imovel: { select: { nome: true } } },
        orderBy: { inicio: "asc" },
      }),
    ]);

    const stamp = carimbo(new Date());
    const linhas: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Morada nas Nuvens//PMS//PT-BR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${escapar("Morada nas Nuvens")}`,
    ];

    for (const r of reservas) {
      linhas.push(
        "BEGIN:VEVENT",
        `UID:reserva-${r.id}@moradanasnuvens`,
        `DTSTAMP:${stamp}`,
        // DTEND é exclusivo no iCal — bate com a semântica do check-out
        `DTSTART;VALUE=DATE:${dataICS(r.checkin)}`,
        `DTEND;VALUE=DATE:${dataICS(r.checkout)}`,
        dobrar(`SUMMARY:${escapar(`${r.hospede.nome} — ${r.imovel.nome}`)}`),
        dobrar(
          `DESCRIPTION:${escapar(
            [
              `Hóspedes: ${r.numeroHospedes}`,
              `Plataforma: ${r.plataforma}`,
              `Status: ${r.status}`,
              r.codigoExterno ? `Código: ${r.codigoExterno}` : "",
            ]
              .filter(Boolean)
              .join("\n")
          )}`
        ),
        `STATUS:${r.status === "CONFIRMADA" ? "CONFIRMED" : "TENTATIVE"}`,
        "TRANSP:OPAQUE",
        "END:VEVENT"
      );
    }

    for (const b of bloqueios) {
      const rotulo = b.motivo === "MANUTENCAO" ? "Manutenção" : "Bloqueio";
      // bloqueio.fim é inclusivo; no iCal DTEND é exclusivo → soma 1 dia
      const fimExclusivo = new Date(b.fim.getTime() + 24 * 60 * 60 * 1000);
      linhas.push(
        "BEGIN:VEVENT",
        `UID:bloqueio-${b.id}@moradanasnuvens`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${dataICS(b.inicio)}`,
        `DTEND;VALUE=DATE:${dataICS(fimExclusivo)}`,
        dobrar(`SUMMARY:${escapar(`${rotulo} — ${b.imovel.nome}`)}`),
        b.nota ? dobrar(`DESCRIPTION:${escapar(b.nota)}`) : "DESCRIPTION:",
        "STATUS:CONFIRMED",
        "TRANSP:OPAQUE",
        "END:VEVENT"
      );
    }

    linhas.push("END:VCALENDAR");

    const conteudo = linhas.join("\r\n") + "\r\n";
    const nome = `morada-calendario-${String(mes).padStart(2, "0")}-${ano}.ics`;

    return new Response(conteudo, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nome}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return erroInterno(e);
  }
}
