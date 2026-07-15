import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Cliente Anthropic — SOMENTE servidor (PRD §1: a chave nunca vai pro cliente).
 * O import de "server-only" quebra o build se este módulo for puxado pro bundle
 * do navegador por engano.
 */

/** Modelo definido no PRD §1. */
export const MODELO_IA = "claude-sonnet-4-6";

export function iaConfigurada(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

let cliente: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY_AUSENTE");
  }
  if (!cliente) {
    cliente = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return cliente;
}

/** Extrai o texto concatenado dos blocos de texto da resposta. */
export function textoDaResposta(msg: Anthropic.Message): string {
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

/**
 * Recorta o primeiro objeto JSON de um texto (o modelo pode embrulhar em ```json).
 * Sonnet 4.6 não suporta structured outputs, então validamos com Zod na saída.
 */
export function extrairJSON(texto: string): unknown {
  const semCerca = texto
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const inicio = semCerca.indexOf("{");
  const fim = semCerca.lastIndexOf("}");
  if (inicio === -1 || fim === -1 || fim <= inicio) {
    throw new Error("JSON_INVALIDO");
  }
  return JSON.parse(semCerca.slice(inicio, fim + 1));
}
