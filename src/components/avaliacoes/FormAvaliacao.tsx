"use client";

import { useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useCriarAvaliacao } from "@/hooks/useAvaliacoes";
import { useImoveis } from "@/hooks/useImoveis";
import type { PlataformaValor } from "@/lib/tipos";

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function FormAvaliacao({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const criar = useCriarAvaliacao();
  const { data: imoveis } = useImoveis();

  const [imovelId, setImovelId] = useState("");
  const [hospedeNome, setHospedeNome] = useState("");
  const [plataforma, setPlataforma] = useState<PlataformaValor>("AIRBNB");
  const [nota, setNota] = useState(5);
  const [data, setData] = useState(hojeISO());
  const [comentario, setComentario] = useState("");

  useEffect(() => {
    if (!open) return;
    setImovelId(imoveis?.[0]?.id ?? "");
    setHospedeNome("");
    setPlataforma("AIRBNB");
    setNota(5);
    setData(hojeISO());
    setComentario("");
  }, [open, imoveis]);

  const valido = !!imovelId && hospedeNome.trim() && nota >= 1 && nota <= 5 && !!data;

  function salvar() {
    criar.mutate(
      {
        imovelId,
        hospedeNome: hospedeNome.trim(),
        plataforma,
        nota,
        data,
        comentario: comentario.trim() || undefined,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar avaliação</DialogTitle>
          <DialogDescription>
            Lance aqui as avaliações que chegam pelas plataformas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Chalé</Label>
            <Select value={imovelId} onValueChange={setImovelId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha o chalé" />
              </SelectTrigger>
              <SelectContent>
                {(imoveis ?? []).map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hospede">Hóspede</Label>
              <Input
                id="hospede"
                placeholder="Nome de quem avaliou"
                value={hospedeNome}
                onChange={(e) => setHospedeNome(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Plataforma</Label>
              <Select value={plataforma} onValueChange={(v) => setPlataforma(v as PlataformaValor)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AIRBNB">Airbnb</SelectItem>
                  <SelectItem value="BOOKING">Booking.com</SelectItem>
                  <SelectItem value="DIRETO">Direto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Nota</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNota(n)}
                    aria-label={`${n} estrela(s)`}
                    className="p-0.5"
                  >
                    <Star
                      className={cn(
                        "h-6 w-6 transition-colors",
                        n <= nota ? "fill-warn text-warn" : "fill-transparent text-border"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="data-aval">Data</Label>
              <Input
                id="data-aval"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comentario">
              Comentário <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="comentario"
              placeholder="O que o hóspede escreveu..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={!valido || criar.isPending}>
            {criar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Registrar avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
