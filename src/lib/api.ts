import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Padrão de erro do PRD §9: { erro: { codigo, mensagem, campos? } } */
export function erroResposta(
  codigo: string,
  mensagem: string,
  status: number,
  campos?: Record<string, string>
) {
  return NextResponse.json({ erro: { codigo, mensagem, campos } }, { status });
}

/** Converte um ZodError em resposta 422 com os campos. */
export function erroValidacao(err: ZodError) {
  const campos: Record<string, string> = {};
  for (const issue of err.issues) {
    const chave = issue.path.join(".") || "_";
    if (!campos[chave]) campos[chave] = issue.message;
  }
  return erroResposta("VALIDACAO", "Confira os campos do formulário.", 422, campos);
}

/** Erro genérico 500. */
export function erroInterno(e: unknown) {
  console.error("[api] erro interno:", e);
  return erroResposta(
    "INTERNO",
    "Algo deu errado por aqui. Tente de novo.",
    500
  );
}
