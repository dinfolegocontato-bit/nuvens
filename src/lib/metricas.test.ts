import { describe, it, expect } from "vitest";
import {
  noites,
  noitesNoMes,
  diasNoMes,
  subtotalReserva,
  valorTotalReserva,
  valorLiquidoReserva,
  reservasSobrepoem,
  reservaConflitaBloqueio,
  metricasDoMes,
  delta,
  mesAnterior,
  type ReservaCalc,
} from "./metricas";

describe("noites e dias", () => {
  it("conta noites entre check-in e check-out", () => {
    expect(noites("2026-07-20", "2026-07-25")).toBe(5);
    expect(noites("2026-07-20", "2026-07-21")).toBe(1);
  });

  it("é 0 quando as datas são inválidas", () => {
    expect(noites("2026-07-25", "2026-07-20")).toBe(0);
    expect(noites("2026-07-20", "2026-07-20")).toBe(0);
  });

  it("dias do mês respeita meses de 30/31 e fevereiro", () => {
    expect(diasNoMes(7, 2026)).toBe(31);
    expect(diasNoMes(4, 2026)).toBe(30);
    expect(diasNoMes(2, 2024)).toBe(29); // bissexto
    expect(diasNoMes(2, 2026)).toBe(28);
  });
});

describe("recorte de reserva no mês", () => {
  it("conta todas as noites quando a reserva está inteira no mês", () => {
    expect(noitesNoMes("2026-07-05", "2026-07-10", 7, 2026)).toBe(5);
  });

  it("recorta as noites de uma reserva que atravessa a virada do mês", () => {
    // 30/07 → 03/08: noites 30, 31 (julho) e 01, 02 (agosto)
    expect(noitesNoMes("2026-07-30", "2026-08-03", 7, 2026)).toBe(2);
    expect(noitesNoMes("2026-07-30", "2026-08-03", 8, 2026)).toBe(2);
  });

  it("é 0 quando a reserva não toca o mês", () => {
    expect(noitesNoMes("2026-07-05", "2026-07-10", 8, 2026)).toBe(0);
  });
});

describe("valores por reserva", () => {
  const base = {
    valorDiaria: 200,
    taxaLimpeza: 100,
    taxasServicos: 0,
    desconto: 0,
    taxaPlataformaPct: 15,
    checkin: "2026-07-05",
    checkout: "2026-07-10", // 5 noites
  };

  it("subtotal = noites × diária + limpeza + serviços", () => {
    expect(subtotalReserva(base)).toBe(1100); // 5*200 + 100
  });

  it("valorTotal = subtotal − desconto", () => {
    expect(valorTotalReserva({ ...base, desconto: 100 })).toBe(1000);
  });

  it("valorLiquido aplica a taxa da plataforma", () => {
    expect(valorLiquidoReserva(base)).toBeCloseTo(935, 5); // 1100 * 0.85
  });

  it("valorLiquido é 0 quando CANCELADA (RN05)", () => {
    expect(valorLiquidoReserva({ ...base, status: "CANCELADA" })).toBe(0);
  });
});

describe("sobreposição e bloqueio", () => {
  it("detecta reservas sobrepostas (noites [checkin, checkout))", () => {
    expect(
      reservasSobrepoem(
        { checkin: "2026-07-20", checkout: "2026-07-25" },
        { checkin: "2026-07-23", checkout: "2026-07-27" }
      )
    ).toBe(true);
  });

  it("check-out no mesmo dia do check-in seguinte NÃO sobrepõe", () => {
    expect(
      reservasSobrepoem(
        { checkin: "2026-07-20", checkout: "2026-07-25" },
        { checkin: "2026-07-25", checkout: "2026-07-28" }
      )
    ).toBe(false);
  });

  it("detecta conflito com bloqueio (fim inclusive)", () => {
    expect(
      reservaConflitaBloqueio(
        { checkin: "2026-07-20", checkout: "2026-07-25" },
        { inicio: "2026-07-24", fim: "2026-07-26" }
      )
    ).toBe(true);
  });
});

describe("metricasDoMes", () => {
  const r = (over: Partial<ReservaCalc>): ReservaCalc => ({
    valorDiaria: 200,
    taxaLimpeza: 100,
    taxasServicos: 0,
    desconto: 0,
    taxaPlataformaPct: 15,
    status: "CONFIRMADA",
    checkin: "2026-07-05",
    checkout: "2026-07-10",
    ...over,
  });

  it("calcula ocupação, ADR, RevPAR e receita líquida (caso simples)", () => {
    const m = metricasDoMes({
      mes: 7,
      ano: 2026,
      imoveisAtivos: 1,
      saldoInicialCaixa: 0,
      despesas: [],
      reservas: [r({})], // 5 noites, total 1100, líquido 935
    });

    expect(m.noitesVendidas).toBe(5);
    expect(m.receitaBruta).toBeCloseTo(1100, 5);
    expect(m.receitaLiquida).toBeCloseTo(935, 5);
    expect(m.ocupacao).toBeCloseTo((5 / 31) * 100, 5); // ~16,13%
    expect(m.adr).toBeCloseTo(220, 5); // 1100 / 5
    expect(m.revpar).toBeCloseTo(1100 / 31, 5); // ~35,48
    expect(m.lucroLiquido).toBeCloseTo(935, 5);
    expect(m.margem).toBeCloseTo(100, 5);
    expect(m.saldoCaixa).toBeCloseTo(935, 5);
  });

  it("rateia receita de reserva que atravessa o mês (proporcional às noites)", () => {
    // 30/07 → 03/08: 4 noites (2 em julho, 2 em agosto), diária 100, total 400, taxa 0
    const reserva = r({
      checkin: "2026-07-30",
      checkout: "2026-08-03",
      valorDiaria: 100,
      taxaLimpeza: 0,
      taxaPlataformaPct: 0,
    });

    const jul = metricasDoMes({
      mes: 7, ano: 2026, imoveisAtivos: 1, saldoInicialCaixa: 0,
      despesas: [], reservas: [reserva],
    });
    const ago = metricasDoMes({
      mes: 8, ano: 2026, imoveisAtivos: 1, saldoInicialCaixa: 0,
      despesas: [], reservas: [reserva],
    });

    expect(jul.noitesVendidas).toBe(2);
    expect(jul.receitaBruta).toBeCloseTo(200, 5); // 400 × (2/4)
    expect(ago.noitesVendidas).toBe(2);
    expect(ago.receitaBruta).toBeCloseTo(200, 5);
  });

  it("ignora reserva CANCELADA em noites e receita (RN05)", () => {
    const m = metricasDoMes({
      mes: 7, ano: 2026, imoveisAtivos: 1, saldoInicialCaixa: 0,
      despesas: [],
      reservas: [r({}), r({ status: "CANCELADA", checkin: "2026-07-12", checkout: "2026-07-15" })],
    });
    // só a reserva confirmada entra
    expect(m.noitesVendidas).toBe(5);
    expect(m.receitaBruta).toBeCloseTo(1100, 5);
    expect(m.receitaLiquida).toBeCloseTo(935, 5);
  });

  it("desconta os gastos (despesas SAIDA) no lucro e no saldo", () => {
    const m = metricasDoMes({
      mes: 7, ano: 2026, imoveisAtivos: 1, saldoInicialCaixa: 1000,
      despesas: [
        { data: "2026-07-08", tipo: "SAIDA", valor: 300 },
        { data: "2026-08-01", tipo: "SAIDA", valor: 999 }, // fora do mês
        { data: "2026-07-09", tipo: "ENTRADA", valor: 50 }, // não é gasto
      ],
      reservas: [r({})],
    });
    expect(m.gastos).toBe(300);
    expect(m.lucroLiquido).toBeCloseTo(635, 5); // 935 - 300
    expect(m.saldoCaixa).toBeCloseTo(1635, 5); // 1000 + 935 - 300
  });

  it("ocupação e RevPAR consideram os imóveis ATIVOS × dias do mês", () => {
    const m = metricasDoMes({
      mes: 7, ano: 2026, imoveisAtivos: 2, saldoInicialCaixa: 0,
      despesas: [], reservas: [r({})],
    });
    expect(m.ocupacao).toBeCloseTo((5 / (2 * 31)) * 100, 5);
    expect(m.revpar).toBeCloseTo(1100 / (2 * 31), 5);
  });
});

describe("delta e mês anterior", () => {
  it("delta percentual vs mês anterior", () => {
    expect(delta(120, 100)).toBeCloseTo(20, 5);
    expect(delta(80, 100)).toBeCloseTo(-20, 5);
  });

  it("delta é null quando o mês anterior é 0 (não dá para comparar)", () => {
    expect(delta(500, 0)).toBeNull();
  });

  it("mês anterior vira o ano em janeiro", () => {
    expect(mesAnterior(1, 2026)).toEqual({ mes: 12, ano: 2025 });
    expect(mesAnterior(7, 2026)).toEqual({ mes: 6, ano: 2026 });
  });
});
