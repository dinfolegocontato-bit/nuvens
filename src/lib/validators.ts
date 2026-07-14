import { z } from "zod";

// Enums espelhando o schema Prisma (PRD §3)
export const zImovelStatus = z.enum(["ATIVO", "FUTURO", "INATIVO"]);
export const zPlataforma = z.enum(["AIRBNB", "BOOKING", "DIRETO"]);
export const zTipoReserva = z.enum([
  "LAZER",
  "TRABALHO",
  "LONGA_TEMPORADA",
  "GRUPO",
]);
export const zStatusReserva = z.enum(["CONFIRMADA", "PENDENTE", "CANCELADA"]);
export const zMotivoBloqueio = z.enum(["BLOQUEIO", "MANUTENCAO"]);
export const zTipoDespesa = z.enum(["ENTRADA", "SAIDA"]);
export const zStatusDespesa = z.enum(["PAGO", "PENDENTE"]);

// ---------- Imóvel ----------

const urlOpcional = z
  .string()
  .trim()
  .url("Informe uma URL válida.")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const imovelCreateSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do chalé."),
  cidade: z.string().trim().min(1, "Informe a cidade."),
  status: zImovelStatus.default("ATIVO"),
  capacidade: z.coerce
    .number()
    .int("Use um número inteiro.")
    .min(1, "A capacidade deve ser no mínimo 1."),
  quartos: z.coerce.number().int().min(0, "Não pode ser negativo."),
  banheiros: z.coerce.number().int().min(0, "Não pode ser negativo."),
  fotoUrl: urlOpcional,
  plataformas: z.array(zPlataforma).default([]),
});

export const imovelUpdateSchema = imovelCreateSchema.partial();

export type ImovelCreateInput = z.infer<typeof imovelCreateSchema>;
export type ImovelUpdateInput = z.infer<typeof imovelUpdateSchema>;
