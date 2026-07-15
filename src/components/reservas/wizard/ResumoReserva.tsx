import Image from "next/image";
import { Home } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PlataformaBadge } from "@/components/common/PlataformaBadge";
import { formatBRL, formatData } from "@/lib/formatters";
import { derivadosDoForm, TIPOS_RESERVA, type FormReserva } from "./estado";
import { PASSOS } from "./Stepper";
import type { ImovelDTO } from "@/lib/tipos";

function n(v: string): number {
  const x = Number(String(v).replace(",", "."));
  return Number.isFinite(x) ? x : 0;
}

function Linha({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-body">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-strong">{valor}</span>
    </div>
  );
}

export function ResumoReserva({
  form,
  imovel,
  taxaPlataformaPct,
  passoAtual,
}: {
  form: FormReserva;
  imovel?: ImovelDTO;
  taxaPlataformaPct: number;
  passoAtual: number;
}) {
  const d = derivadosDoForm(form, taxaPlataformaPct);
  const tipoLabel = TIPOS_RESERVA.find((t) => t.valor === form.tipo)?.label;
  const restantes = PASSOS.slice(passoAtual);

  return (
    <Card className="sticky top-6 flex flex-col gap-4">
      <h3 className="text-h3 font-semibold text-strong">Resumo da reserva</h3>

      {/* Chalé */}
      <div className="flex items-center gap-3">
        {imovel?.fotoUrl ? (
          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md">
            <Image src={imovel.fotoUrl} alt={imovel.nome} fill sizes="64px" className="object-cover" />
          </div>
        ) : (
          <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary-soft to-sky-100 text-primary-text">
            <Home className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium text-strong">
            {imovel?.nome ?? "Escolha o chalé"}
          </p>
          <p className="text-legenda text-muted-foreground">
            {form.numeroHospedes || 0} hóspede(s) · {d.noites} noite(s)
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-border pt-3">
        <Linha label="Check-in" valor={form.checkin ? formatData(form.checkin) : "—"} />
        <Linha label="Check-out" valor={form.checkout ? formatData(form.checkout) : "—"} />
        <Linha
          label="Plataforma"
          valor={form.plataforma ? <PlataformaBadge plataforma={form.plataforma} /> : "—"}
        />
        <Linha label="Tipo" valor={tipoLabel ?? "—"} />
      </div>

      <div className="flex flex-col gap-1.5 border-t border-border pt-3">
        <Linha
          label={`${d.noites} diária(s) × ${formatBRL(n(form.valorDiaria))}`}
          valor={formatBRL(d.noites * n(form.valorDiaria))}
        />
        <Linha label="Taxa de limpeza" valor={formatBRL(n(form.taxaLimpeza))} />
        <Linha label="Taxas / serviços" valor={formatBRL(n(form.taxasServicos))} />
        <Linha label="Descontos" valor={`- ${formatBRL(n(form.desconto))}`} />
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="font-semibold text-strong">Total da reserva</span>
        <span className="text-h3 font-semibold text-strong">
          {formatBRL(d.valorTotal)}
        </span>
      </div>

      {/* Receita líquida estimada */}
      <div className="rounded-xl bg-primary-soft p-3">
        <div className="flex items-center justify-between">
          <span className="text-label font-medium text-primary-text">
            Receita líquida estimada
          </span>
          <span className="font-semibold text-primary-text">
            {formatBRL(d.valorLiquido)}
          </span>
        </div>
        <p className="mt-0.5 text-legenda text-primary-text/70">
          Após taxa da plataforma ({taxaPlataformaPct}%)
        </p>
      </div>

      {/* Próximos passos */}
      {restantes.length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="mb-1.5 text-legenda font-medium uppercase tracking-wide text-muted-foreground">
            Próximos passos
          </p>
          <ul className="flex flex-col gap-1">
            {restantes.map((p) => (
              <li key={p} className="flex items-center gap-2 text-legenda text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-border" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
