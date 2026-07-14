"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Home,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  BedDouble,
  Bath,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FiltrosPagina } from "@/components/layout/FiltrosPagina";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PlataformaDot } from "@/components/common/PlataformaBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { FormImovel } from "@/components/imoveis/FormImovel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useImoveis, useExcluirImovel } from "@/hooks/useImoveis";
import type { ImovelDTO } from "@/lib/tipos";

export function ImoveisView() {
  const { data: imoveis, isLoading, isError, refetch } = useImoveis();
  const excluir = useExcluirImovel();

  const [formAberto, setFormAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<ImovelDTO | null>(null);
  const [aExcluir, setAExcluir] = useState<ImovelDTO | null>(null);

  function abrirNovo() {
    setEmEdicao(null);
    setFormAberto(true);
  }
  function abrirEdicao(i: ImovelDTO) {
    setEmEdicao(i);
    setFormAberto(true);
  }

  const temImoveis = !!imoveis && imoveis.length > 0;

  return (
    <>
      <PageHeader
        titulo="Imóveis"
        filtros={<FiltrosPagina />}
        acoes={
          <Button onClick={abrirNovo}>
            <Plus className="h-4 w-4" />
            Adicionar chalé
          </Button>
        }
      />

      {isLoading && <SkeletonTabela />}

      {isError && (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-body text-muted-foreground">
            Não deu para carregar os chalés agora.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </Card>
      )}

      {!isLoading && !isError && !temImoveis && (
        <EmptyState
          icon={Home}
          titulo="Nenhum chalé cadastrado"
          texto="Cadastre o primeiro chalé para começar a lançar reservas."
          acao={<Button onClick={abrirNovo}>Adicionar chalé</Button>}
        />
      )}

      {!isLoading && !isError && temImoveis && (
        <Card className="p-0">
          <div className="px-5 pt-5">
            <h3 className="text-h3 font-semibold text-strong">Meus chalés</h3>
          </div>
          <Table className="mt-2">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Chalé</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plataformas</TableHead>
                <TableHead className="text-center">Capacidade</TableHead>
                <TableHead className="text-center">Quartos</TableHead>
                <TableHead className="text-center">Banheiros</TableHead>
                <TableHead>Taxa de ocupação</TableHead>
                <TableHead>Receita do mês</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {imoveis!.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Miniatura imovel={i} />
                      <div className="min-w-0">
                        <p className="font-medium text-strong">{i.nome}</p>
                        <p className="text-legenda text-muted-foreground">
                          {i.cidade}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={i.status} />
                  </TableCell>
                  <TableCell>
                    {i.plataformas.length ? (
                      <span className="flex items-center gap-1.5">
                        {i.plataformas.map((p) => (
                          <PlataformaDot key={p} plataforma={p} />
                        ))}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 text-body">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {i.capacidade}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 text-body">
                      <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
                      {i.quartos}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 text-body">
                      <Bath className="h-3.5 w-3.5 text-muted-foreground" />
                      {i.banheiros}
                    </span>
                  </TableCell>
                  {/* Métricas vêm de /api/metricas (Fase 3) — vazio enquanto não há reservas */}
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Ações do chalé"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => abrirEdicao(i)}>
                          <Pencil className="h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-danger focus:bg-danger-soft"
                          onClick={() => setAExcluir(i)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Linha tracejada — adicionar novo chalé (PRD §6.6) */}
          <button
            type="button"
            onClick={abrirNovo}
            className="m-3 flex w-[calc(100%-1.5rem)] flex-col items-center gap-0.5 rounded-xl border border-dashed border-border py-4 text-center transition-colors hover:bg-app"
          >
            <span className="inline-flex items-center gap-2 font-medium text-primary-text">
              <Plus className="h-4 w-4" />
              Adicionar novo chalé
            </span>
            <span className="text-legenda text-muted-foreground">
              Cadastre um chalé existente ou planeje um futuro.
            </span>
          </button>
        </Card>
      )}

      <FormImovel
        imovel={emEdicao}
        open={formAberto}
        onOpenChange={setFormAberto}
      />

      <ConfirmDialog
        open={!!aExcluir}
        onOpenChange={(v) => !v && setAExcluir(null)}
        titulo="Excluir chalé?"
        descricao={
          aExcluir
            ? `"${aExcluir.nome}" será removido. Essa ação não pode ser desfeita.`
            : ""
        }
        confirmarLabel="Excluir chalé"
        destrutivo
        carregando={excluir.isPending}
        onConfirmar={() => {
          if (!aExcluir) return;
          const id = aExcluir.id;
          setAExcluir(null);
          excluir.mutate(id);
        }}
      />
    </>
  );
}

function Miniatura({ imovel }: { imovel: ImovelDTO }) {
  if (imovel.fotoUrl) {
    return (
      <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md">
        <Image
          src={imovel.fotoUrl}
          alt={imovel.nome}
          fill
          sizes="56px"
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary-soft to-sky-100 text-primary-text">
      <Home className="h-4 w-4" />
    </div>
  );
}

function SkeletonTabela() {
  return (
    <Card className="flex flex-col gap-3">
      <Skeleton className="h-6 w-32" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-14" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </Card>
  );
}
