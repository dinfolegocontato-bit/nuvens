import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import {
  getAnthropic,
  iaConfigurada,
  MODELO_IA,
  textoDaResposta,
  extrairJSON,
} from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { calcularMetricas } from "@/lib/metricas-servico";
import { erroResposta, erroValidacao, erroInterno } from "@/lib/api";
import { paraDataUTC, noites } from "@/lib/metricas";
import { formatPct } from "@/lib/formatters";

const MS_DIA = 24 * 60 * 60 * 1000;
const DIAS_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

const entradaSchema = z.object({
  imovelId: z.string().min(1),
  checkin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkout: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const saidaSchema = z.object({
  min: z.coerce.number().positive(),
  max: z.coerce.number().positive(),
  justificativa: z.string().min(1),
});

const SISTEMA = `Você ajuda a Mariana, dona da pousada Morada nas Nuvens (Visconde de Mauá, RJ),
a definir o valor da diária de uma reserva que ela está lançando.

Você recebe o histórico real de diárias do chalé, o dia da semana do check-in, a ocupação do mês
e a antecedência da reserva. Baseie-se SÓ nesses números.

Responda SOMENTE com um objeto JSON válido, sem cercas de código e sem texto fora do JSON:
{"min": 0, "max": 0, "justificativa": ""}

Regras:
- "min" e "max" são valores em reais (números, sem "R$"), formando uma faixa sugerida. min < max.
- Ancore a faixa no histórico do chalé. Sem histórico, seja conservadora e diga isso.
- "justificativa": UMA frase curta em português do Brasil citando o que pesou (dia da semana, ocupação, antecedência, histórico).`;

// POST /api/ia/sugerir-diaria  { imovelId, checkin, checkout }
export async function POST(req: NextRequest) {
  try {
    if (!iaConfigurada()) {
      return erroResposta(
        "IA_NAO_CONFIGURADA",
        "A IA não está configurada no servidor (ANTHROPIC_API_KEY).",
        503
      );
    }

    const dados = entradaSchema.parse(await req.json());

    const imovel = await prisma.imovel.findUnique({
      where: { id: dados.imovelId },
      select: { nome: true, capacidade: true, quartos: true },
    });
    if (!imovel)
      return erroResposta("NAO_ENCONTRADO", "Chalé não encontrado.", 404);

    // Histórico real de diárias do chalé (não canceladas)
    const historico = await prisma.reserva.findMany({
      where: { imovelId: dados.imovelId, status: { not: "CANCELADA" } },
      orderBy: { checkin: "desc" },
      take: 20,
      select: { checkin: true, valorDiaria: true },
    });

    const ci = paraDataUTC(dados.checkin);
    const mes = ci.getUTCMonth() + 1;
    const ano = ci.getUTCFullYear();
    const metricas = await calcularMetricas(mes, ano);

    const hoje = new Date();
    const hojeUTC = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const antecedenciaDias = Math.max(
      0,
      Math.round((ci.getTime() - hojeUTC) / MS_DIA)
    );

    const diarias = historico.map((h) => Number(h.valorDiaria));
    const contexto = {
      chale: imovel.nome,
      capacidade: imovel.capacidade,
      quartos: imovel.quartos,
      diaDaSemanaDoCheckin: DIAS_SEMANA[ci.getUTCDay()],
      noitesDaReserva: noites(dados.checkin, dados.checkout),
      antecedenciaDias,
      ocupacaoDoMes: formatPct(metricas.atual.ocupacao),
      historicoDiarias:
        diarias.length > 0
          ? {
              quantidade: diarias.length,
              minimo: Math.min(...diarias),
              maximo: Math.max(...diarias),
              media: Number(
                (diarias.reduce((a, b) => a + b, 0) / diarias.length).toFixed(2)
              ),
              ultimas: historico.slice(0, 8).map((h) => ({
                checkin: h.checkin.toISOString().slice(0, 10),
                valorDiaria: Number(h.valorDiaria),
              })),
            }
          : null,
    };

    const msg = await getAnthropic().messages.create({
      model: MODELO_IA,
      max_tokens: 600,
      system: SISTEMA,
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      messages: [
        { role: "user", content: JSON.stringify(contexto, null, 2) },
      ],
    });

    if (msg.stop_reason === "refusal") {
      return erroResposta(
        "IA_RECUSOU",
        "Não deu para sugerir a diária agora. Tente de novo.",
        502
      );
    }

    const sugestao = saidaSchema.parse(extrairJSON(textoDaResposta(msg)));
    // Nunca preenche sozinho: a tela só mostra a faixa; a Mariana clica em "Usar" (PRD §7.3).
    return NextResponse.json(sugestao);
  } catch (e) {
    if (e instanceof ZodError) {
      // Zod da ENTRADA → 422; Zod da SAÍDA da IA → erro de formato
      return erroResposta(
        "IA_FORMATO",
        "Não deu para sugerir a diária agora. Tente de novo.",
        502
      );
    }
    if (e instanceof Error && e.message === "ANTHROPIC_API_KEY_AUSENTE") {
      return erroResposta(
        "IA_NAO_CONFIGURADA",
        "A IA não está configurada no servidor (ANTHROPIC_API_KEY).",
        503
      );
    }
    if (e instanceof Error && e.message === "JSON_INVALIDO") {
      return erroResposta(
        "IA_FORMATO",
        "Não deu para sugerir a diária agora. Tente de novo.",
        502
      );
    }
    return erroInterno(e);
  }
}
