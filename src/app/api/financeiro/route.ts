import { NextRequest, NextResponse } from "next/server";
import { calcularFinanceiro } from "@/lib/financeiro-servico";
import { erroResposta, erroInterno } from "@/lib/api";

// GET /api/financeiro?mes=&ano=
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const agora = new Date();
    const mes = Number(sp.get("mes")) || agora.getMonth() + 1;
    const ano = Number(sp.get("ano")) || agora.getFullYear();

    if (mes < 1 || mes > 12)
      return erroResposta("PARAMS", "Mês inválido.", 400);

    return NextResponse.json(await calcularFinanceiro(mes, ano));
  } catch (e) {
    return erroInterno(e);
  }
}
