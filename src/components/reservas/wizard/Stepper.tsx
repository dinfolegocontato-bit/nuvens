import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const PASSOS = [
  "Dados da reserva",
  "Hóspede",
  "Detalhes da estadia",
  "Pagamento e valores",
  "Revisão",
] as const;

export function Stepper({ atual }: { atual: number }) {
  return (
    <ol className="flex items-center gap-2 overflow-x-auto pb-1">
      {PASSOS.map((label, i) => {
        const passo = i + 1;
        const concluido = passo < atual;
        const ativo = passo === atual;
        return (
          <li key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-legenda font-semibold",
                  concluido && "bg-primary text-white",
                  ativo && "bg-primary text-white",
                  !concluido && !ativo && "bg-app text-muted-foreground"
                )}
              >
                {concluido ? <Check className="h-4 w-4" /> : passo}
              </span>
              <span
                className={cn(
                  "hidden whitespace-nowrap text-label md:inline",
                  ativo ? "font-medium text-strong" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {passo < PASSOS.length && (
              <span className="mx-1 hidden h-px w-6 bg-border md:inline-block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
