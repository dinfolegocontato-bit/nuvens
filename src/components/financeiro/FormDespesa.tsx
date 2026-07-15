"use client";

import { useEffect, useState } from "react";
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
import { useCriarDespesa, useAtualizarDespesa } from "@/hooks/useFinanceiro";
import { useImoveis } from "@/hooks/useImoveis";
import type { DespesaDTO, StatusDespesaValor } from "@/lib/tipos";

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function FormDespesa({
  despesa,
  categoriasConhecidas,
  open,
  onOpenChange,
}: {
  despesa?: DespesaDTO | null;
  categoriasConhecidas: string[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const editando = !!despesa;
  const criar = useCriarDespesa();
  const atualizar = useAtualizarDespesa();
  const salvando = criar.isPending || atualizar.isPending;
  const { data: imoveis } = useImoveis();

  const [data, setData] = useState(hojeISO());
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [valor, setValor] = useState("");
  const [status, setStatus] = useState<StatusDespesaValor>("PENDENTE");
  const [imovelId, setImovelId] = useState<string>("nenhum");

  useEffect(() => {
    if (!open) return;
    if (despesa) {
      setData(despesa.data);
      setDescricao(despesa.descricao);
      setCategoria(despesa.categoria);
      setFornecedor(despesa.fornecedor ?? "");
      setValor(String(despesa.valor));
      setStatus(despesa.status);
      setImovelId(despesa.imovelId ?? "nenhum");
    } else {
      setData(hojeISO());
      setDescricao("");
      setCategoria("");
      setFornecedor("");
      setValor("");
      setStatus("PENDENTE");
      setImovelId("nenhum");
    }
  }, [open, despesa]);

  const valorNum = Number(String(valor).replace(",", "."));
  const valido = !!data && descricao.trim() && categoria.trim() && valorNum > 0;

  function salvar() {
    const dados = {
      data,
      descricao: descricao.trim(),
      categoria: categoria.trim(),
      fornecedor: fornecedor.trim() || undefined,
      tipo: "SAIDA" as const, // lançamentos manuais são saídas (PRD §6.5)
      valor: valorNum,
      status,
      imovelId: imovelId === "nenhum" ? undefined : imovelId,
    };
    if (editando && despesa) {
      atualizar.mutate({ id: despesa.id, dados }, { onSuccess: () => onOpenChange(false) });
    } else {
      criar.mutate(dados, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
          <DialogDescription>
            Lance aqui as despesas do mês. As entradas vêm das reservas confirmadas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="data">Data</Label>
              <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                inputMode="decimal"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              placeholder="Ex.: Gás de cozinha"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                list="categorias-conhecidas"
                placeholder="Ex.: Manutenção"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              />
              <datalist id="categorias-conhecidas">
                {categoriasConhecidas.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fornecedor">
                Fornecedor <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="fornecedor"
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as StatusDespesaValor)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="PAGO">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>
                Chalé <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Select value={imovelId} onValueChange={setImovelId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum / geral</SelectItem>
                  {(imoveis ?? []).map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={!valido || salvando}>
            {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
            {editando ? "Salvar alterações" : "Criar lançamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
