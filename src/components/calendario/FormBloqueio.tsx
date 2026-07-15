"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import { useCriarBloqueio } from "@/hooks/useCalendario";
import type { CalendarioResposta, MotivoBloqueioValor } from "@/lib/tipos";

export function FormBloqueio({
  imoveis,
  open,
  onOpenChange,
}: {
  imoveis: CalendarioResposta["imoveis"];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const criar = useCriarBloqueio();
  const [imovelId, setImovelId] = useState("");
  const [motivo, setMotivo] = useState<MotivoBloqueioValor>("BLOQUEIO");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [nota, setNota] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setImovelId(imoveis[0]?.id ?? "");
    setMotivo("BLOQUEIO");
    setInicio("");
    setFim("");
    setNota("");
    setErro(null);
  }, [open, imoveis]);

  const datasOk = !!inicio && !!fim && fim >= inicio;
  const valido = !!imovelId && datasOk;

  function salvar() {
    setErro(null);
    criar.mutate(
      { imovelId, motivo, inicio, fim, nota: nota || undefined },
      {
        onSuccess: () => onOpenChange(false),
        onError: (e) =>
          setErro(
            e instanceof ApiError ? e.message : "Não deu para bloquear as datas."
          ),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bloquear datas</DialogTitle>
          <DialogDescription>
            Feche a agenda do chalé para uso pessoal ou manutenção.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {erro && (
            <div className="flex items-center gap-2 rounded-xl bg-danger-soft px-3 py-2 text-label text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {erro}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Chalé</Label>
            <Select value={imovelId} onValueChange={setImovelId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha o chalé" />
              </SelectTrigger>
              <SelectContent>
                {imoveis.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Motivo</Label>
            <Select value={motivo} onValueChange={(v) => setMotivo(v as MotivoBloqueioValor)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BLOQUEIO">Bloqueio</SelectItem>
                <SelectItem value="MANUTENCAO">Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Início</Label>
              <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Fim</Label>
              <Input
                type="date"
                value={fim}
                min={inicio || undefined}
                onChange={(e) => setFim(e.target.value)}
              />
              {inicio && fim && fim < inicio && (
                <p className="text-legenda text-danger">
                  A data final não pode ser antes da inicial.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              Nota <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              placeholder="Ex.: pintura da varanda"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={!valido || criar.isPending}>
            {criar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Bloquear datas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
