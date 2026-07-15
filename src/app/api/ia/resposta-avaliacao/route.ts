import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import {
  getAnthropic,
  iaConfigurada,
  MODELO_IA,
  textoDaResposta,
} from "@/lib/anthropic";
import { erroResposta, erroValidacao, erroInterno } from "@/lib/api";

const entradaSchema = z.object({
  nota: z.coerce.number().int().min(1).max(5),
  comentario: z.string().trim().optional().or(z.literal("")),
  chale: z.string().trim().min(1),
  hospedeNome: z.string().trim().min(1),
});

const SISTEMA = `Você escreve como a Mariana, anfitriã da pousada Morada nas Nuvens, em Visconde de Mauá (RJ),
respondendo publicamente a uma avaliação de hóspede.

Regras:
- Português do Brasil, tom pessoal e caloroso — como quem cuida do lugar, não como empresa.
- No máximo 4 frases.
- Chame o hóspede pelo primeiro nome e agradeça.
- Se houver crítica, reconheça de forma específica e diga o que será feito. Nada de desculpa genérica.
- Não invente fatos, promoções, brindes nem detalhes que não estejam na avaliação.
- Responda apenas com o texto da resposta, sem aspas e sem comentários seus.`;

// POST /api/ia/resposta-avaliacao  { nota, comentario, chale, hospedeNome }
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

    const msg = await getAnthropic().messages.create({
      model: MODELO_IA,
      max_tokens: 600,
      system: SISTEMA,
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      messages: [
        {
          role: "user",
          content: [
            `Avaliação recebida:`,
            `- Hóspede: ${dados.hospedeNome}`,
            `- Chalé: ${dados.chale}`,
            `- Nota: ${dados.nota} de 5`,
            `- Comentário: ${dados.comentario?.trim() || "(sem comentário)"}`,
            ``,
            `Escreva a resposta da anfitriã.`,
          ].join("\n"),
        },
      ],
    });

    if (msg.stop_reason === "refusal") {
      return erroResposta(
        "IA_RECUSOU",
        "Não deu para escrever a resposta agora. Tente de novo.",
        502
      );
    }

    const resposta = textoDaResposta(msg);
    if (!resposta) {
      return erroResposta(
        "IA_VAZIA",
        "Não deu para escrever a resposta agora. Tente de novo.",
        502
      );
    }

    // A IA não grava no banco: salvar é uma ação explícita da Mariana (PATCH /api/avaliacoes/[id]).
    return NextResponse.json({ resposta });
  } catch (e) {
    if (e instanceof ZodError) return erroValidacao(e);
    if (e instanceof Error && e.message === "ANTHROPIC_API_KEY_AUSENTE") {
      return erroResposta(
        "IA_NAO_CONFIGURADA",
        "A IA não está configurada no servidor (ANTHROPIC_API_KEY).",
        503
      );
    }
    return erroInterno(e);
  }
}
