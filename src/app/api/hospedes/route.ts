import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { erroInterno } from "@/lib/api";

// GET /api/hospedes            → lista básica
// GET /api/hospedes?email=...  → busca por e-mail (RN06): retorna o hóspede ou null
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    if (email) {
      const hospede = await prisma.hospede.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      return NextResponse.json({ hospede: hospede ?? null });
    }

    const hospedes = await prisma.hospede.findMany({
      orderBy: { nome: "asc" },
      include: { _count: { select: { reservas: true } } },
    });
    return NextResponse.json(hospedes);
  } catch (e) {
    return erroInterno(e);
  }
}
