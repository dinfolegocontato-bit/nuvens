import { NextRequest, NextResponse } from "next/server";
import { calcularMetricas } from "@/lib/metricas-servico";
import { erroInterno } from "@/lib/api";

// GET /api/metricas?mes=&ano=
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const agora = new Date();
    const mes = Number(sp.get("mes")) || agora.getMonth() + 1;
    const ano = Number(sp.get("ano")) || agora.getFullYear();

    if (mes < 1 || mes > 12) {
      return NextResponse.json(
        { erro: { codigo: "PARAMS", mensagem: "Mês inválido." } },
        { status: 400 }
      );
    }

    const metricas = await calcularMetricas(mes, ano);
    return NextResponse.json(metricas);
  } catch (e) {
    return erroInterno(e);
  }
}
