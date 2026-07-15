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

// ---------- Hóspede ----------

const emailOpcional = z
  .string()
  .trim()
  .email("Informe um e-mail válido.")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const hospedeCreateSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do hóspede."),
  email: emailOpcional,
  telefone: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  documento: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  observacoes: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
});

export type HospedeCreateInput = z.infer<typeof hospedeCreateSchema>;

// ---------- Reserva ----------

const dataISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

const dinheiro = z.coerce.number().min(0, "Não pode ser negativo.");

export const reservaCreateSchema = z
  .object({
    imovelId: z.string().min(1, "Escolha o chalé."),
    plataforma: zPlataforma,
    tipo: zTipoReserva,
    status: zStatusReserva.default("CONFIRMADA"),
    codigoExterno: z
      .string()
      .trim()
      .optional()
      .or(z.literal("").transform(() => undefined)),
    // Hóspede (RN06: identificado por e-mail; vincula ou cria)
    hospede: hospedeCreateSchema,
    checkin: dataISO,
    checkout: dataISO,
    numeroHospedes: z.coerce
      .number()
      .int()
      .min(1, "Pelo menos 1 hóspede."),
    valorDiaria: z.coerce.number().min(0.01, "Informe o valor da diária."),
    taxaLimpeza: dinheiro.default(0),
    taxasServicos: dinheiro.default(0),
    desconto: dinheiro.default(0),
    observacoes: z
      .string()
      .trim()
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  .refine((d) => d.checkout > d.checkin, {
    // RN03: checkout > checkin
    message: "O check-out precisa ser depois do check-in.",
    path: ["checkout"],
  });

export type ReservaCreateInput = z.infer<typeof reservaCreateSchema>;

// Edição: campos parciais (sem trocar o hóspede nesta fase)
export const reservaUpdateSchema = z
  .object({
    plataforma: zPlataforma.optional(),
    tipo: zTipoReserva.optional(),
    status: zStatusReserva.optional(),
    codigoExterno: z.string().trim().nullish(),
    checkin: dataISO.optional(),
    checkout: dataISO.optional(),
    numeroHospedes: z.coerce.number().int().min(1).optional(),
    valorDiaria: z.coerce.number().min(0.01).optional(),
    taxaLimpeza: dinheiro.optional(),
    taxasServicos: dinheiro.optional(),
    desconto: dinheiro.optional(),
    observacoes: z.string().trim().nullish(),
  })
  .refine(
    (d) => !d.checkin || !d.checkout || d.checkout > d.checkin,
    { message: "O check-out precisa ser depois do check-in.", path: ["checkout"] }
  );

export type ReservaUpdateInput = z.infer<typeof reservaUpdateSchema>;

// ---------- Bloqueio ----------

export const bloqueioCreateSchema = z
  .object({
    imovelId: z.string().min(1, "Escolha o chalé."),
    motivo: zMotivoBloqueio.default("BLOQUEIO"),
    inicio: dataISO,
    fim: dataISO,
    nota: z
      .string()
      .trim()
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  .refine((d) => d.fim >= d.inicio, {
    message: "A data final não pode ser antes da inicial.",
    path: ["fim"],
  });

export type BloqueioCreateInput = z.infer<typeof bloqueioCreateSchema>;
