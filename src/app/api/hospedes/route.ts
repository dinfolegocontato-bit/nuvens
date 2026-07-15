import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { calcularHospedes } from "@/lib/hospedes-servico";
import { hospedeCreateSchema } from "@/lib/validators";
import { erroValidacao, erroInterno } from "@/lib/api";

// GET /api/hospedes            → base de hóspedes com agregados (§6.7)
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

    return NextResponse.json(await calcularHospedes());
  } catch (e) {
    return erroInterno(e);
  }
}

// POST /api/hospedes — cria hóspede avulso
export async function POST(req: NextRequest) {
  try {
    const dados = hospedeCreateSchema.parse(await req.json());
    const hospede = await prisma.hospede.create({
      data: {
        nome: dados.nome,
        email: dados.email?.toLowerCase() ?? null,
        telefone: dados.telefone ?? null,
        documento: dados.documento ?? null,
        observacoes: dados.observacoes ?? null,
      },
    });
    return NextResponse.json(hospede, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) return erroValidacao(e);
    return erroInterno(e);
  }
}
