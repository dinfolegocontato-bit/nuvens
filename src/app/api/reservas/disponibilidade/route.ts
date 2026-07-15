import { NextRequest, NextResponse } from "next/server";
import { verificarDisponibilidade } from "@/lib/disponibilidade";
import { erroResposta, erroInterno } from "@/lib/api";

// GET /api/reservas/disponibilidade?imovelId=&checkin=&checkout=&ignorar=
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const imovelId = sp.get("imovelId");
    const checkin = sp.get("checkin");
    const checkout = sp.get("checkout");
    const ignorar = sp.get("ignorar") ?? undefined;

    if (!imovelId || !checkin || !checkout) {
      return erroResposta(
        "PARAMS",
        "Informe imóvel, check-in e check-out.",
        400
      );
    }
    if (checkout <= checkin) {
      return NextResponse.json({ livre: false, conflitos: [] });
    }

    const resultado = await verificarDisponibilidade({
      imovelId,
      checkin,
      checkout,
      ignorarReservaId: ignorar,
    });
    return NextResponse.json(resultado);
  } catch (e) {
    return erroInterno(e);
  }
}
