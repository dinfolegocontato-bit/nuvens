-- CreateEnum
CREATE TYPE "ImovelStatus" AS ENUM ('ATIVO', 'FUTURO', 'INATIVO');

-- CreateEnum
CREATE TYPE "Plataforma" AS ENUM ('AIRBNB', 'BOOKING', 'DIRETO');

-- CreateEnum
CREATE TYPE "TipoReserva" AS ENUM ('LAZER', 'TRABALHO', 'LONGA_TEMPORADA', 'GRUPO');

-- CreateEnum
CREATE TYPE "StatusReserva" AS ENUM ('CONFIRMADA', 'PENDENTE', 'CANCELADA');

-- CreateEnum
CREATE TYPE "MotivoBloqueio" AS ENUM ('BLOQUEIO', 'MANUTENCAO');

-- CreateEnum
CREATE TYPE "TipoDespesa" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "StatusDespesa" AS ENUM ('PAGO', 'PENDENTE');

-- CreateTable
CREATE TABLE "imoveis" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "status" "ImovelStatus" NOT NULL DEFAULT 'ATIVO',
    "capacidade" INTEGER NOT NULL,
    "quartos" INTEGER NOT NULL,
    "banheiros" INTEGER NOT NULL,
    "fotoUrl" TEXT,
    "plataformas" "Plataforma"[],
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imoveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospedes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "documento" TEXT,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hospedes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "imovelId" TEXT NOT NULL,
    "hospedeId" TEXT NOT NULL,
    "plataforma" "Plataforma" NOT NULL,
    "tipo" "TipoReserva" NOT NULL,
    "status" "StatusReserva" NOT NULL DEFAULT 'CONFIRMADA',
    "codigoExterno" TEXT,
    "checkin" DATE NOT NULL,
    "checkout" DATE NOT NULL,
    "numeroHospedes" INTEGER NOT NULL,
    "valorDiaria" DECIMAL(10,2) NOT NULL,
    "taxaLimpeza" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxasServicos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "desconto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxaPlataformaPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloqueios" (
    "id" TEXT NOT NULL,
    "imovelId" TEXT NOT NULL,
    "motivo" "MotivoBloqueio" NOT NULL DEFAULT 'BLOQUEIO',
    "inicio" DATE NOT NULL,
    "fim" DATE NOT NULL,
    "nota" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloqueios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "despesas" (
    "id" TEXT NOT NULL,
    "imovelId" TEXT,
    "data" DATE NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "fornecedor" TEXT,
    "tipo" "TipoDespesa" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" "StatusDespesa" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "despesas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL,
    "imovelId" TEXT NOT NULL,
    "reservaId" TEXT,
    "hospedeNome" TEXT NOT NULL,
    "plataforma" "Plataforma" NOT NULL,
    "nota" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "comentario" TEXT,
    "respostaEnviada" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "saldoInicialCaixa" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxaAirbnbPct" DECIMAL(5,2) NOT NULL DEFAULT 15,
    "taxaBookingPct" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "taxaDiretoPct" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hospedes_email_key" ON "hospedes"("email");

-- CreateIndex
CREATE INDEX "reservas_imovelId_idx" ON "reservas"("imovelId");

-- CreateIndex
CREATE INDEX "reservas_hospedeId_idx" ON "reservas"("hospedeId");

-- CreateIndex
CREATE INDEX "reservas_checkin_checkout_idx" ON "reservas"("checkin", "checkout");

-- CreateIndex
CREATE INDEX "bloqueios_imovelId_idx" ON "bloqueios"("imovelId");

-- CreateIndex
CREATE INDEX "despesas_imovelId_idx" ON "despesas"("imovelId");

-- CreateIndex
CREATE INDEX "despesas_data_idx" ON "despesas"("data");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacoes_reservaId_key" ON "avaliacoes"("reservaId");

-- CreateIndex
CREATE INDEX "avaliacoes_imovelId_idx" ON "avaliacoes"("imovelId");

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "imoveis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_hospedeId_fkey" FOREIGN KEY ("hospedeId") REFERENCES "hospedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueios" ADD CONSTRAINT "bloqueios_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "imoveis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesas" ADD CONSTRAINT "despesas_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "imoveis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "imoveis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "reservas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
