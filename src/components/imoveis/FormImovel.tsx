"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { imovelCreateSchema, type ImovelCreateInput } from "@/lib/validators";
import type { ImovelDTO, PlataformaValor } from "@/lib/tipos";
import { useCriarImovel, useAtualizarImovel } from "@/hooks/useImoveis";

const PLATAFORMAS: { valor: PlataformaValor; label: string; cor: string }[] = [
  { valor: "AIRBNB", label: "Airbnb", cor: "var(--airbnb)" },
  { valor: "BOOKING", label: "Booking.com", cor: "var(--booking)" },
  { valor: "DIRETO", label: "Direto", cor: "var(--direto)" },
];

const PADRAO: ImovelCreateInput = {
  nome: "",
  cidade: "Visconde de Mauá",
  status: "ATIVO",
  capacidade: 2,
  quartos: 1,
  banheiros: 1,
  fotoUrl: undefined,
  plataformas: [],
};

export function FormImovel({
  imovel,
  open,
  onOpenChange,
}: {
  imovel?: ImovelDTO | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const editando = !!imovel;
  const criar = useCriarImovel();
  const atualizar = useAtualizarImovel();
  const salvando = criar.isPending || atualizar.isPending;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ImovelCreateInput>({
    resolver: zodResolver(imovelCreateSchema),
    defaultValues: PADRAO,
  });

  useEffect(() => {
    if (!open) return;
    if (imovel) {
      reset({
        nome: imovel.nome,
        cidade: imovel.cidade,
        status: imovel.status,
        capacidade: imovel.capacidade,
        quartos: imovel.quartos,
        banheiros: imovel.banheiros,
        fotoUrl: imovel.fotoUrl ?? undefined,
        plataformas: imovel.plataformas,
      });
    } else {
      reset(PADRAO);
    }
  }, [open, imovel, reset]);

  async function onSubmit(dados: ImovelCreateInput) {
    if (editando && imovel) {
      atualizar.mutate(
        { id: imovel.id, dados },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      criar.mutate(dados, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editando ? "Editar chalé" : "Cadastrar chalé"}
          </DialogTitle>
          <DialogDescription>
            {editando
              ? "Atualize as informações do chalé."
              : "Cadastre um chalé existente ou planeje um futuro."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <Campo label="Nome do chalé" erro={errors.nome?.message}>
            <Input placeholder="Chalé da Serra" {...register("nome")} />
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Cidade" erro={errors.cidade?.message}>
              <Input {...register("cidade")} />
            </Campo>
            <Campo label="Status" erro={errors.status?.message}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATIVO">Ativo</SelectItem>
                      <SelectItem value="FUTURO">Futuro</SelectItem>
                      <SelectItem value="INATIVO">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Campo>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Campo label="Capacidade" erro={errors.capacidade?.message}>
              <Input type="number" min={1} {...register("capacidade")} />
            </Campo>
            <Campo label="Quartos" erro={errors.quartos?.message}>
              <Input type="number" min={0} {...register("quartos")} />
            </Campo>
            <Campo label="Banheiros" erro={errors.banheiros?.message}>
              <Input type="number" min={0} {...register("banheiros")} />
            </Campo>
          </div>

          <Campo label="Foto (URL)" erro={errors.fotoUrl?.message} opcional>
            <Input
              placeholder="https://..."
              {...register("fotoUrl")}
            />
          </Campo>

          <Campo label="Plataformas" erro={errors.plataformas?.message} opcional>
            <Controller
              control={control}
              name="plataformas"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {PLATAFORMAS.map((p) => {
                    const ativo = field.value?.includes(p.valor);
                    return (
                      <button
                        key={p.valor}
                        type="button"
                        onClick={() =>
                          field.onChange(
                            ativo
                              ? field.value.filter((v) => v !== p.valor)
                              : [...(field.value ?? []), p.valor]
                          )
                        }
                        className={cn(
                          "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-label transition-colors",
                          ativo
                            ? "border-primary bg-primary-soft text-primary-text"
                            : "border-border bg-surface text-body hover:bg-app"
                        )}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: p.cor }}
                        />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </Campo>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
              {editando ? "Salvar alterações" : "Cadastrar chalé"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Campo({
  label,
  erro,
  opcional,
  children,
}: {
  label: string;
  erro?: string;
  opcional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        {label}
        {opcional && (
          <span className="ml-1 font-normal text-muted-foreground">
            (opcional)
          </span>
        )}
      </Label>
      {children}
      {erro && (
        <p className="text-legenda text-danger" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
