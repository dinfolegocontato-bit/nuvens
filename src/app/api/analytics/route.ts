import { NextRequest, NextResponse } from "next/server";
import { calcularAnalytics } from "@/lib/analytics-servico";
import { erroResposta, erroInterno } from "@/lib/api";

// GET /api/analytics?mes=&ano=
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const agora = new Date();
    const mes = Number(sp.get("mes")) || agora.getMonth() + 1;
    const ano = Number(sp.get("ano")) || agora.getFullYear();

    if (mes < 1 || mes > 12) return erroResposta("PARAMS", "Mês inválido.", 400);

    return NextResponse.json(await calcularAnalytics(mes, ano));
  } catch (e) {
    return erroInterno(e);
  }
}
