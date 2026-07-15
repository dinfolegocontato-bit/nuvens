import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Estrelas de 0 a 5 (com meia estrela por preenchimento). */
export function Estrelas({
  nota,
  tamanho = 16,
}: {
  nota: number;
  tamanho?: number;
}) {
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${nota} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const preenchida = nota >= i - 0.25;
        return (
          <Star
            key={i}
            style={{ width: tamanho, height: tamanho }}
            className={cn(
              preenchida ? "fill-warn text-warn" : "fill-transparent text-border"
            )}
          />
        );
      })}
    </div>
  );
}
