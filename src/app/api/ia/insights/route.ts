import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getAnthropic,
  iaConfigurada,
  MODELO_IA,
  textoDaResposta,
  extrairJSON,
} from "@/lib/anthropic";
import { calcularMetricas } from "@/lib/metricas-servico";
import { calcularFinanceiro } from "@/lib/financeiro-servico";
import { erroResposta, erroInterno } from "@/lib/api";
import { nomeMes, formatBRL, formatPct } from "@/lib/formatters";

const insightSchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().min(1),
  acao: z.string().min(1),
  impacto: z.enum(["alto", "medio", "baixo"]),
});
const respostaSchema = z.object({
  insights: z.array(insightSchema).min(1).max(6),
});

const SISTEMA = `Você é a analista de negócios da pousada Morada nas Nuvens, em Visconde de Mauá (RJ).
Fala com a Mariana, a proprietária, em português do Brasil, de forma direta e prática.
Você recebe apenas números agregados do período — nunca invente dados que não estejam ali.

Responda SOMENTE com um objeto JSON válido, sem cercas de código e sem texto fora do JSON, no formato:
{"insights":[{"titulo":"","descricao":"","acao":"","impacto":"alto|medio|baixo"}]}

Regras:
- Gere de 3 a 4 insights.
- Cite números reais do resumo (valores em R$, percentuais, quantidades).
- "titulo": no máximo 6 palavras.
- "descricao": 1 a 2 frases explicando o que os números mostram.
- "acao": uma sugestão concreta e executável pela Mariana.
- "impacto": o quanto agir nisso muda o resultado do mês.`;

// POST /api/ia/insights  { mes, ano }
export async function POST(req: NextRequest) {
  try {
    if (!iaConfigurada()) {
      return erroResposta(
        "IA_NAO_CONFIGURADA",
        "A IA não está configurada no servidor (ANTHROPIC_API_KEY).",
        503
      );
    }

    const body = await req.json().catch(() => ({}));
    const agora = new Date();
    const mes = Number(body?.mes) || agora.getMonth() + 1;
    const ano = Number(body?.ano) || agora.getFullYear();

    const [m, f] = await Promise.all([
      calcularMetricas(mes, ano),
      calcularFinanceiro(mes, ano),
    ]);

    // Resumo AGREGADO (PRD §7.1 — nunca as tabelas cruas)
    const resumo = {
      periodo: `${nomeMes(mes)} de ${ano}`,
      imoveisAtivos: m.atual.imoveisAtivos,
      diasNoMes: m.atual.diasMes,
      receitaBruta: formatBRL(m.atual.receitaBruta),
      receitaLiquida: formatBRL(m.atual.receitaLiquida),
      gastos: formatBRL(m.atual.gastos),
      lucroLiquido: formatBRL(m.atual.lucroLiquido),
      margem: formatPct(m.atual.margem),
      ocupacao: formatPct(m.atual.ocupacao),
      adr: formatBRL(m.atual.adr),
      revpar: formatBRL(m.atual.revpar),
      noitesVendidas: m.atual.noitesVendidas,
      notaMedia: m.avaliacao.media,
      totalAvaliacoes: m.avaliacao.total,
      gastosPorCategoria: f.gastosPorCategoria.map((g) => ({
        categoria: g.categoria,
        valor: formatBRL(g.valor),
        pct: formatPct(g.pct),
      })),
      reservasPorPlataforma: m.reservasPorPlataforma,
      ocupacaoPorChale: m.ocupacaoPorChale.map((o) => ({
        chale: o.imovel,
        ocupacao: formatPct(o.ocupacao),
      })),
      mesAnterior: {
        receitaLiquida: formatBRL(m.anterior.receitaLiquida),
        gastos: formatBRL(m.anterior.gastos),
        lucroLiquido: formatBRL(m.anterior.lucroLiquido),
        ocupacao: formatPct(m.anterior.ocupacao),
        adr: formatBRL(m.anterior.adr),
        noitesVendidas: m.anterior.noitesVendidas,
      },
      variacaoVsMesAnterior: m.deltas,
    };

    const msg = await getAnthropic().messages.create({
      model: MODELO_IA,
      max_tokens: 2000,
      system: SISTEMA,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      messages: [
        {
          role: "user",
          content: `Resumo do período:\n${JSON.stringify(resumo, null, 2)}`,
        },
      ],
    });

    if (msg.stop_reason === "refusal") {
      return erroResposta(
        "IA_RECUSOU",
        "Não deu para gerar os insights agora. Tente de novo.",
        502
      );
    }

    const dados = respostaSchema.parse(extrairJSON(textoDaResposta(msg)));
    // A IA não escreve no banco (PRD §7) — só devolve o JSON para a tela.
    return NextResponse.json(dados);
  } catch (e) {
    if (e instanceof Error && e.message === "ANTHROPIC_API_KEY_AUSENTE") {
      return erroResposta(
        "IA_NAO_CONFIGURADA",
        "A IA não está configurada no servidor (ANTHROPIC_API_KEY).",
        503
      );
    }
    // JSON inválido / schema fora do formato → estado de erro do PRD §7.1
    if (
      e instanceof z.ZodError ||
      (e instanceof Error && (e.message === "JSON_INVALIDO" || e instanceof SyntaxError))
    ) {
      console.error("[ia/insights] resposta fora do formato:", e);
      return erroResposta(
        "IA_FORMATO",
        "Não deu para gerar os insights agora. Tente de novo.",
        502
      );
    }
    return erroInterno(e);
  }
}
