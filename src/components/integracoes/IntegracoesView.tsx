"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Download,
  Upload,
  Trash2,
  Loader2,
  Check,
  Database,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  useConfig,
  useAtualizarConfig,
  useRestaurarBackup,
  useComecarDoZero,
} from "@/hooks/useConfig";
import type { ConfigDTO } from "@/lib/tipos";

type ChaveTaxa = "taxaAirbnbPct" | "taxaBookingPct" | "taxaDiretoPct";

const CANAIS: { chave: ChaveTaxa; nome: string; cor: string }[] = [
  { chave: "taxaAirbnbPct", nome: "Airbnb", cor: "var(--airbnb)" },
  { chave: "taxaBookingPct", nome: "Booking.com", cor: "var(--booking)" },
  { chave: "taxaDiretoPct", nome: "Direto", cor: "var(--direto)" },
];

const ONDE_A_IA_ATUA = [
  "Insights do período no Dashboard e no Analytics",
  "Resposta às avaliações dos hóspedes",
  "Sugestão de diária no lançamento da reserva",
];

export function IntegracoesView() {
  const { data: config, isLoading } = useConfig();
  const atualizar = useAtualizarConfig();
  const restaurar = useRestaurarBackup();
  const zerar = useComecarDoZero();

  const [taxas, setTaxas] = useState<Record<ChaveTaxa, string>>({
    taxaAirbnbPct: "",
    taxaBookingPct: "",
    taxaDiretoPct: "",
  });
  const [saldo, setSaldo] = useState("");
  // Dupla confirmação do "Começar do zero" (PRD §6.12)
  const [zerar1, setZerar1] = useState(false);
  const [zerar2, setZerar2] = useState(false);
  const inputArquivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!config) return;
    setTaxas({
      taxaAirbnbPct: String(config.taxaAirbnbPct),
      taxaBookingPct: String(config.taxaBookingPct),
      taxaDiretoPct: String(config.taxaDiretoPct),
    });
    setSaldo(String(config.saldoInicialCaixa));
  }, [config]);

  function salvarTaxa(chave: ChaveTaxa) {
    const valor = Number(String(taxas[chave]).replace(",", "."));
    if (!Number.isFinite(valor) || valor < 0 || valor > 100) {
      toast.error("A taxa precisa estar entre 0 e 100.");
      return;
    }
    atualizar.mutate({ [chave]: valor } as Partial<ConfigDTO>);
  }

  async function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    try {
      const backup = JSON.parse(await arquivo.text());
      restaurar.mutate(backup);
    } catch {
      toast.error("Esse arquivo não é um backup válido.");
    }
  }

  if (isLoading && !config) {
    return (
      <>
        <PageHeader titulo="Integrações" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader titulo="Integrações" />

      {/* Canais — taxa editável grava em CONFIG (PRD §6.12) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {CANAIS.map((c) => (
          <Card key={c.chave} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.cor }} />
                <CardTitle>{c.nome}</CardTitle>
              </div>
              <Badge variant="neutral">Lançamento manual</Badge>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={c.chave}>Taxa aplicada (%)</Label>
              <div className="flex gap-2">
                <Input
                  id={c.chave}
                  inputMode="decimal"
                  value={taxas[c.chave]}
                  onChange={(e) =>
                    setTaxas((t) => ({ ...t, [c.chave]: e.target.value }))
                  }
                />
                <Button
                  variant="outline"
                  onClick={() => salvarTaxa(c.chave)}
                  disabled={
                    atualizar.isPending ||
                    String(config?.[c.chave] ?? "") === taxas[c.chave]
                  }
                >
                  Salvar
                </Button>
              </div>
            </div>

            <p className="mt-auto text-legenda text-muted-foreground">
              A sincronização automática (iCal/API) entra na próxima fase.
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Assistente de IA */}
        <Card className="border-ia/30 bg-ia-soft/40">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ia-soft text-ia">
                <Sparkles className="h-5 w-5" />
              </div>
              <CardTitle>Assistente de IA</CardTitle>
            </div>
            {config?.iaConfigurada ? (
              <Badge variant="ia">Conectado</Badge>
            ) : (
              <Badge variant="warn">Não configurado</Badge>
            )}
          </div>

          <p className="mb-2 text-body text-muted-foreground">
            {config?.iaConfigurada
              ? "O assistente está ativo e atua em:"
              : "Configure a ANTHROPIC_API_KEY no servidor para ativar. Sem ela, todas as telas seguem funcionando normalmente. O assistente atua em:"}
          </p>
          <ul className="flex flex-col gap-1.5">
            {ONDE_A_IA_ATUA.map((item) => (
              <li key={item} className="flex items-start gap-2 text-body">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-ia" />
                {item}
              </li>
            ))}
          </ul>
        </Card>

        {/* Seus dados */}
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-info-soft text-info">
              <Database className="h-5 w-5" />
            </div>
            <CardTitle>Seus dados</CardTitle>
          </div>

          <div className="mb-4 flex flex-col gap-1.5">
            <Label htmlFor="saldo">Saldo inicial de caixa (R$)</Label>
            <div className="flex gap-2">
              <Input
                id="saldo"
                inputMode="decimal"
                value={saldo}
                onChange={(e) => setSaldo(e.target.value)}
              />
              <Button
                variant="outline"
                disabled={
                  atualizar.isPending ||
                  String(config?.saldoInicialCaixa ?? "") === saldo
                }
                onClick={() => {
                  const v = Number(String(saldo).replace(",", "."));
                  if (!Number.isFinite(v)) {
                    toast.error("Informe um valor válido.");
                    return;
                  }
                  atualizar.mutate({ saldoInicialCaixa: v });
                }}
              >
                Salvar
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <a href="/api/backup" download>
                <Download className="h-4 w-4" />
                Exportar backup (JSON)
              </a>
            </Button>

            <Button
              variant="outline"
              disabled={restaurar.isPending}
              onClick={() => inputArquivo.current?.click()}
            >
              {restaurar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Restaurar backup
            </Button>
            <input
              ref={inputArquivo}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={aoEscolherArquivo}
            />

            <Button
              variant="destructive"
              disabled={zerar.isPending}
              onClick={() => setZerar1(true)}
            >
              <Trash2 className="h-4 w-4" />
              Começar do zero
            </Button>
          </div>

          <p className="mt-3 text-legenda text-muted-foreground">
            O backup traz chalés, reservas, hóspedes, bloqueios, lançamentos e avaliações.
          </p>
        </Card>
      </div>

      {/* Dupla confirmação (PRD §6.12) */}
      <ConfirmDialog
        open={zerar1}
        onOpenChange={setZerar1}
        titulo="Começar do zero?"
        descricao="Isso apaga todos os chalés, reservas, hóspedes, bloqueios, lançamentos e avaliações. Exporte um backup antes se quiser guardar."
        confirmarLabel="Quero apagar tudo"
        destrutivo
        onConfirmar={() => {
          setZerar1(false);
          setZerar2(true);
        }}
      />
      <ConfirmDialog
        open={zerar2}
        onOpenChange={setZerar2}
        titulo="Tem certeza mesmo?"
        descricao="Esta ação não pode ser desfeita. Todos os dados serão apagados definitivamente."
        confirmarLabel="Apagar tudo definitivamente"
        cancelarLabel="Não, voltar"
        destrutivo
        carregando={zerar.isPending}
        onConfirmar={() => {
          setZerar2(false);
          zerar.mutate();
        }}
      />
    </>
  );
}
