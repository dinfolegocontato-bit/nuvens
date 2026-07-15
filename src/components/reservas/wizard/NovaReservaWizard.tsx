"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Check, AlertCircle, CircleCheck, Info, ArrowLeft, ArrowRight, X, Home } from "lucide-react";
import { Card } from "@/components/ui/card";
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
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";
import { apiFetch, ApiError } from "@/lib/api-client";
import { noites as calcNoites } from "@/lib/metricas";
import { formatBRL } from "@/lib/formatters";
import { useImoveis } from "@/hooks/useImoveis";
import { useConfig, taxaPorPlataforma } from "@/hooks/useConfig";
import { useCriarReserva, buscarHospedePorEmail } from "@/hooks/useReservas";
import { Stepper, PASSOS } from "./Stepper";
import { ResumoReserva } from "./ResumoReserva";
import {
  FORM_INICIAL,
  formParaPayload,
  TIPOS_RESERVA,
  type FormReserva,
} from "./estado";
import type { PlataformaValor, ImovelDTO } from "@/lib/tipos";

const PLATAFORMAS: { valor: PlataformaValor; label: string; cor: string }[] = [
  { valor: "AIRBNB", label: "Airbnb", cor: "var(--airbnb)" },
  { valor: "BOOKING", label: "Booking.com", cor: "var(--booking)" },
  { valor: "DIRETO", label: "Direto", cor: "var(--direto)" },
];

interface Disponibilidade {
  checando: boolean;
  livre: boolean | null;
  mensagem?: string;
}

export function NovaReservaWizard() {
  const router = useRouter();
  const { data: imoveis } = useImoveis();
  const { data: config } = useConfig();
  const criar = useCriarReserva();

  const ativos = useMemo(
    () => (imoveis ?? []).filter((i) => i.status === "ATIVO"),
    [imoveis]
  );

  const [passo, setPasso] = useState(1);
  const [form, setForm] = useState<FormReserva>(FORM_INICIAL);
  const [disp, setDisp] = useState<Disponibilidade>({ checando: false, livre: null });
  const [hospedeExistente, setHospedeExistente] = useState<string | null>(null);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  const imovel = ativos.find((i) => i.id === form.imovelId);
  const taxaPct = taxaPorPlataforma(config, (form.plataforma || "DIRETO") as PlataformaValor);

  function set<K extends keyof FormReserva>(campo: K, valor: FormReserva[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }
  function setHospede(campo: keyof FormReserva["hospede"], valor: string) {
    setForm((f) => ({ ...f, hospede: { ...f.hospede, [campo]: valor } }));
  }

  // RN03 — check-out depois do check-in
  const datasValidas =
    !!form.checkin && !!form.checkout && form.checkout > form.checkin;
  const noites = datasValidas ? calcNoites(form.checkin, form.checkout) : 0;

  // RN01/RN02 — disponibilidade em tempo real (debounce)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (!form.imovelId || !datasValidas) {
      setDisp({ checando: false, livre: null });
      return;
    }
    setDisp({ checando: true, livre: null });
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await apiFetch<{ livre: boolean; conflitos: { tipo: string }[] }>(
          `/api/reservas/disponibilidade?imovelId=${form.imovelId}&checkin=${form.checkin}&checkout=${form.checkout}`
        );
        const temBloqueio = r.conflitos.some((c) => c.tipo !== "RESERVA");
        setDisp({
          checando: false,
          livre: r.livre,
          mensagem: r.livre
            ? undefined
            : temBloqueio
              ? "Essas datas estão bloqueadas. Libere o bloqueio no calendário antes de reservar."
              : "Esse chalé já tem reserva nessas datas.",
        });
      } catch {
        setDisp({ checando: false, livre: null });
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [form.imovelId, form.checkin, form.checkout, datasValidas]);

  // RN06 — hóspede por e-mail
  const emailRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const email = form.hospede.email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setHospedeExistente(null);
      return;
    }
    clearTimeout(emailRef.current);
    emailRef.current = setTimeout(async () => {
      try {
        const h = await buscarHospedePorEmail(email);
        setHospedeExistente(h ? h.nome : null);
        if (h && !form.hospede.nome) setHospede("nome", h.nome);
      } catch {
        setHospedeExistente(null);
      }
    }, 450);
    return () => clearTimeout(emailRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.hospede.email]);

  // Validação por passo
  const passoValido: Record<number, boolean> = {
    1: !!form.imovelId && !!form.plataforma && !!form.tipo && !!form.status,
    2: form.hospede.nome.trim().length > 0,
    3:
      datasValidas &&
      Number(form.numeroHospedes) >= 1 &&
      !disp.checando &&
      disp.livre === true,
    4: Number(String(form.valorDiaria).replace(",", ".")) > 0,
    5: true,
  };

  function continuar() {
    if (passo < 5) setPasso((p) => p + 1);
  }
  function voltar() {
    if (passo > 1) setPasso((p) => p - 1);
  }

  function salvar() {
    setErroSalvar(null);
    criar.mutate(formParaPayload(form), {
      onSuccess: (nova) => {
        router.push(`/reservas?novo=${nova.id}`);
      },
      onError: (e) => {
        if (e instanceof ApiError && e.codigo === "CONFLITO") {
          setErroSalvar(e.message);
          setPasso(3);
        } else {
          setErroSalvar(
            e instanceof ApiError ? e.message : "Não deu para salvar a reserva."
          );
        }
      },
    });
  }

  // Sem chalés ativos → não dá para reservar (RN04)
  if (imoveis && ativos.length === 0) {
    return (
      <EmptyState
        icon={Home}
        titulo="Nenhum chalé ativo"
        texto="Cadastre um chalé ativo antes de lançar uma reserva."
        acao={
          <Button asChild>
            <Link href="/imoveis">Cadastrar chalé</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Stepper atual={passo} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Passo atual */}
        <div className="lg:col-span-2">
          <Card className="flex flex-col gap-5">
            {passo === 1 && (
              <Passo1 form={form} set={set} ativos={ativos} />
            )}
            {passo === 2 && (
              <Passo2
                form={form}
                setHospede={setHospede}
                hospedeExistente={hospedeExistente}
              />
            )}
            {passo === 3 && (
              <Passo3
                form={form}
                set={set}
                noites={noites}
                datasValidas={datasValidas}
                disp={disp}
              />
            )}
            {passo === 4 && <Passo4 form={form} set={set} taxaPct={taxaPct} />}
            {passo === 5 && (
              <Passo5 form={form} irPara={setPasso} erro={erroSalvar} />
            )}

            {/* Barra de navegação */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button variant="ghost" asChild>
                <Link href="/reservas">
                  <X className="h-4 w-4" />
                  Cancelar
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                {passo > 1 && (
                  <Button variant="outline" onClick={voltar}>
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                )}
                {passo < 5 ? (
                  <Button onClick={continuar} disabled={!passoValido[passo]}>
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={salvar} disabled={criar.isPending}>
                    {criar.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Salvar reserva
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Resumo */}
        <div className="lg:col-span-1">
          <ResumoReserva
            form={form}
            imovel={imovel}
            taxaPlataformaPct={taxaPct}
            passoAtual={passo}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Passos ---------------- */

function Campo({
  label,
  obrigatorio,
  erro,
  children,
}: {
  label: string;
  obrigatorio?: boolean;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        {label}
        {obrigatorio && <span className="ml-0.5 text-danger">*</span>}
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

function Passo1({
  form,
  set,
  ativos,
}: {
  form: FormReserva;
  set: <K extends keyof FormReserva>(c: K, v: FormReserva[K]) => void;
  ativos: ImovelDTO[];
}) {
  return (
    <>
      <h2 className="text-h3 font-semibold text-strong">Dados da reserva</h2>

      <Campo label="Chalé" obrigatorio>
        <Select value={form.imovelId} onValueChange={(v) => set("imovelId", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Escolha o chalé" />
          </SelectTrigger>
          <SelectContent>
            {(ativos ?? []).map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.nome} · {i.cidade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Campo>

      <Campo label="Plataforma" obrigatorio>
        <div className="grid grid-cols-3 gap-2">
          {PLATAFORMAS.map((p) => {
            const ativo = form.plataforma === p.valor;
            return (
              <button
                key={p.valor}
                type="button"
                onClick={() => set("plataforma", p.valor)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-label transition-colors",
                  ativo
                    ? "border-primary bg-primary-soft text-primary-text"
                    : "border-border bg-surface text-body hover:bg-app"
                )}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.cor }} />
                {p.label}
              </button>
            );
          })}
        </div>
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Tipo de reserva" obrigatorio>
          <Select value={form.tipo} onValueChange={(v) => set("tipo", v as FormReserva["tipo"])}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_RESERVA.map((t) => (
                <SelectItem key={t.valor} value={t.valor}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>

        <Campo label="Status" obrigatorio>
          <Select value={form.status} onValueChange={(v) => set("status", v as FormReserva["status"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CONFIRMADA">Confirmada</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </Campo>
      </div>

      <Campo label="Código da reserva">
        <Input
          placeholder="Ex.: HMXYZ123"
          value={form.codigoExterno}
          onChange={(e) => set("codigoExterno", e.target.value)}
        />
      </Campo>
    </>
  );
}

function Passo2({
  form,
  setHospede,
  hospedeExistente,
}: {
  form: FormReserva;
  setHospede: (c: keyof FormReserva["hospede"], v: string) => void;
  hospedeExistente: string | null;
}) {
  return (
    <>
      <h2 className="text-h3 font-semibold text-strong">Hóspede</h2>

      <Campo label="Nome" obrigatorio>
        <Input
          placeholder="Nome do hóspede"
          value={form.hospede.nome}
          onChange={(e) => setHospede("nome", e.target.value)}
        />
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="E-mail">
          <Input
            type="email"
            placeholder="email@exemplo.com"
            value={form.hospede.email}
            onChange={(e) => setHospede("email", e.target.value)}
          />
        </Campo>
        <Campo label="Telefone">
          <Input
            placeholder="(24) 90000-0000"
            value={form.hospede.telefone}
            onChange={(e) => setHospede("telefone", e.target.value)}
          />
        </Campo>
      </div>

      {hospedeExistente && (
        <div className="flex items-center gap-2 rounded-xl bg-info-soft px-3 py-2 text-label text-info">
          <CircleCheck className="h-4 w-4" />
          Hóspede já cadastrado — vamos vincular a esta reserva.
        </div>
      )}

      <Campo label="Documento">
        <Input
          placeholder="CPF / passaporte"
          value={form.hospede.documento}
          onChange={(e) => setHospede("documento", e.target.value)}
        />
      </Campo>

      <Campo label="Observações">
        <Textarea
          placeholder="Preferências, pedidos especiais..."
          value={form.hospede.observacoes}
          onChange={(e) => setHospede("observacoes", e.target.value)}
        />
      </Campo>
    </>
  );
}

function Passo3({
  form,
  set,
  noites,
  datasValidas,
  disp,
}: {
  form: FormReserva;
  set: <K extends keyof FormReserva>(c: K, v: FormReserva[K]) => void;
  noites: number;
  datasValidas: boolean;
  disp: Disponibilidade;
}) {
  const erroData =
    form.checkin && form.checkout && !datasValidas
      ? "O check-out precisa ser depois do check-in."
      : undefined;

  return (
    <>
      <h2 className="text-h3 font-semibold text-strong">Detalhes da estadia</h2>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Check-in" obrigatorio>
          <Input
            type="date"
            value={form.checkin}
            onChange={(e) => set("checkin", e.target.value)}
          />
        </Campo>
        <Campo label="Check-out" obrigatorio erro={erroData}>
          <Input
            type="date"
            value={form.checkout}
            min={form.checkin || undefined}
            onChange={(e) => set("checkout", e.target.value)}
          />
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Noites">
          <Input value={noites ? `${noites}` : ""} readOnly placeholder="—" />
        </Campo>
        <Campo label="Nº de hóspedes" obrigatorio>
          <Input
            type="number"
            min={1}
            value={form.numeroHospedes}
            onChange={(e) => set("numeroHospedes", e.target.value)}
          />
        </Campo>
      </div>

      {/* Disponibilidade RN01/RN02 */}
      {datasValidas && form.imovelId && (
        <div>
          {disp.checando && (
            <p className="flex items-center gap-2 text-label text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando disponibilidade...
            </p>
          )}
          {!disp.checando && disp.livre === true && (
            <p className="flex items-center gap-2 rounded-xl bg-ok-soft px-3 py-2 text-label text-ok">
              <CircleCheck className="h-4 w-4" />
              Datas livres para este chalé.
            </p>
          )}
          {!disp.checando && disp.livre === false && (
            <p className="flex items-center gap-2 rounded-xl bg-danger-soft px-3 py-2 text-label text-danger">
              <AlertCircle className="h-4 w-4" />
              {disp.mensagem}
            </p>
          )}
        </div>
      )}
    </>
  );
}

function Passo4({
  form,
  set,
  taxaPct,
}: {
  form: FormReserva;
  set: <K extends keyof FormReserva>(c: K, v: FormReserva[K]) => void;
  taxaPct: number;
}) {
  return (
    <>
      <h2 className="text-h3 font-semibold text-strong">Pagamento e valores</h2>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Valor da diária (R$)" obrigatorio>
          <Input
            inputMode="decimal"
            placeholder="0,00"
            value={form.valorDiaria}
            onChange={(e) => set("valorDiaria", e.target.value)}
          />
        </Campo>
        <Campo label="Taxa de limpeza (R$)">
          <Input
            inputMode="decimal"
            placeholder="0,00"
            value={form.taxaLimpeza}
            onChange={(e) => set("taxaLimpeza", e.target.value)}
          />
        </Campo>
        <Campo label="Taxas / serviços (R$)">
          <Input
            inputMode="decimal"
            placeholder="0,00"
            value={form.taxasServicos}
            onChange={(e) => set("taxasServicos", e.target.value)}
          />
        </Campo>
        <Campo label="Desconto (R$)">
          <Input
            inputMode="decimal"
            placeholder="0,00"
            value={form.desconto}
            onChange={(e) => set("desconto", e.target.value)}
          />
        </Campo>
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-info-soft px-3 py-2.5 text-label text-info">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        A receita líquida é calculada automaticamente a partir da taxa da
        plataforma ({taxaPct}%).
      </div>
    </>
  );
}

function Passo5({
  form,
  irPara,
  erro,
}: {
  form: FormReserva;
  irPara: (p: number) => void;
  erro: string | null;
}) {
  const tipoLabel = TIPOS_RESERVA.find((t) => t.valor === form.tipo)?.label;
  return (
    <>
      <h2 className="text-h3 font-semibold text-strong">Revisão</h2>

      {erro && (
        <div className="flex items-center gap-2 rounded-xl bg-danger-soft px-3 py-2 text-label text-danger">
          <AlertCircle className="h-4 w-4" />
          {erro}
        </div>
      )}

      <BlocoRevisao titulo="Dados da reserva" onEditar={() => irPara(1)}>
        <ItemRevisao label="Plataforma" valor={form.plataforma} />
        <ItemRevisao label="Tipo" valor={tipoLabel} />
        <ItemRevisao label="Status" valor={form.status} />
        {form.codigoExterno && (
          <ItemRevisao label="Código" valor={form.codigoExterno} />
        )}
      </BlocoRevisao>

      <BlocoRevisao titulo="Hóspede" onEditar={() => irPara(2)}>
        <ItemRevisao label="Nome" valor={form.hospede.nome} />
        {form.hospede.email && (
          <ItemRevisao label="E-mail" valor={form.hospede.email} />
        )}
        {form.hospede.telefone && (
          <ItemRevisao label="Telefone" valor={form.hospede.telefone} />
        )}
      </BlocoRevisao>

      <BlocoRevisao titulo="Estadia" onEditar={() => irPara(3)}>
        <ItemRevisao label="Check-in" valor={form.checkin} />
        <ItemRevisao label="Check-out" valor={form.checkout} />
        <ItemRevisao label="Hóspedes" valor={form.numeroHospedes} />
      </BlocoRevisao>

      <BlocoRevisao titulo="Valores" onEditar={() => irPara(4)}>
        <ItemRevisao
          label="Diária"
          valor={formatBRL(Number(String(form.valorDiaria).replace(",", ".")) || 0)}
        />
        <ItemRevisao
          label="Taxa de limpeza"
          valor={formatBRL(Number(String(form.taxaLimpeza).replace(",", ".")) || 0)}
        />
      </BlocoRevisao>
    </>
  );
}

function BlocoRevisao({
  titulo,
  onEditar,
  children,
}: {
  titulo: string;
  onEditar: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-label font-semibold text-strong">{titulo}</h3>
        <button
          type="button"
          onClick={onEditar}
          className="text-legenda font-medium text-primary-text hover:underline"
        >
          Editar
        </button>
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function ItemRevisao({ label, valor }: { label: string; valor?: string }) {
  return (
    <div className="flex items-center justify-between text-body">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-strong">{valor || "—"}</span>
    </div>
  );
}
