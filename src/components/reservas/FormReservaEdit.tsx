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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import { useAtualizarReserva } from "@/hooks/useReservas";
import { TIPOS_RESERVA } from "@/components/reservas/wizard/estado";
import type { ReservaDTO } from "@/lib/tipos";

const PLATAFORMAS = [
  { valor: "AIRBNB", label: "Airbnb" },
  { valor: "BOOKING", label: "Booking.com" },
  { valor: "DIRETO", label: "Direto" },
] as const;

export function FormReservaEdit({
  reserva,
  open,
  onOpenChange,
}: {
  reserva: ReservaDTO | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const atualizar = useAtualizarReserva();
  const [form, setForm] = useState<ReservaDTO | null>(reserva);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setForm(reserva);
    setErro(null);
  }, [reserva, open]);

  if (!form) return null;

  function set<K extends keyof ReservaDTO>(campo: K, valor: ReservaDTO[K]) {
    setForm((f) => (f ? { ...f, [campo]: valor } : f));
  }

  function salvar() {
    if (!form) return;
    setErro(null);
    atualizar.mutate(
      {
        id: form.id,
        dados: {
          plataforma: form.plataforma,
          tipo: form.tipo,
          status: form.status,
          codigoExterno: form.codigoExterno,
          checkin: form.checkin,
          checkout: form.checkout,
          numeroHospedes: form.numeroHospedes,
          valorDiaria: form.valorDiaria,
          taxaLimpeza: form.taxaLimpeza,
          taxasServicos: form.taxasServicos,
          desconto: form.desconto,
          observacoes: form.observacoes,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (e) =>
          setErro(
            e instanceof ApiError ? e.message : "Não deu para salvar a reserva."
          ),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar reserva</DialogTitle>
          <DialogDescription>
            {form.hospede.nome} · {form.imovel.nome}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {erro && (
            <div className="flex items-center gap-2 rounded-xl bg-danger-soft px-3 py-2 text-label text-danger">
              <AlertCircle className="h-4 w-4" />
              {erro}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Plataforma</Label>
              <Select value={form.plataforma} onValueChange={(v) => set("plataforma", v as ReservaDTO["plataforma"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATAFORMAS.map((p) => (
                    <SelectItem key={p.valor} value={p.valor}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => set("tipo", v as ReservaDTO["tipo"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_RESERVA.map((t) => (
                    <SelectItem key={t.valor} value={t.valor}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as ReservaDTO["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONFIRMADA">Confirmada</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Nº de hóspedes</Label>
              <Input
                type="number"
                min={1}
                value={form.numeroHospedes}
                onChange={(e) => set("numeroHospedes", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Check-in</Label>
              <Input type="date" value={form.checkin} onChange={(e) => set("checkin", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Check-out</Label>
              <Input
                type="date"
                value={form.checkout}
                min={form.checkin}
                onChange={(e) => set("checkout", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Valor da diária (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.valorDiaria}
                onChange={(e) => set("valorDiaria", Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Taxa de limpeza (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.taxaLimpeza}
                onChange={(e) => set("taxaLimpeza", Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Taxas / serviços (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.taxasServicos}
                onChange={(e) => set("taxasServicos", Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Desconto (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.desconto}
                onChange={(e) => set("desconto", Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={atualizar.isPending}>
            {atualizar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
