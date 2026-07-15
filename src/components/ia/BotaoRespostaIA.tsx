"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  Copy,
  RefreshCw,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRespostaIA } from "@/hooks/useIA";
import { useAtualizarAvaliacao } from "@/hooks/useAvaliacoes";
import { ApiError } from "@/lib/api-client";
import type { AvaliacaoDTO } from "@/lib/tipos";

/**
 * "Escrever resposta com IA" (PRD §7.2).
 * A IA não grava nada: a resposta só vai pro banco quando a Mariana clica em Salvar.
 */
export function BotaoRespostaIA({ avaliacao }: { avaliacao: AvaliacaoDTO }) {
  const gerar = useRespostaIA();
  const salvar = useAtualizarAvaliacao();
  const [rascunho, setRascunho] = useState<string | null>(null);

  function gerarResposta() {
    gerar.mutate(
      {
        nota: avaliacao.nota,
        comentario: avaliacao.comentario,
        chale: avaliacao.imovelNome,
        hospedeNome: avaliacao.hospedeNome,
      },
      { onSuccess: (r) => setRascunho(r.resposta) }
    );
  }

  async function copiar() {
    if (!rascunho) return;
    try {
      await navigator.clipboard.writeText(rascunho);
      toast.success("Resposta copiada.");
    } catch {
      toast.error("Não deu para copiar.");
    }
  }

  const mensagemErro =
    gerar.error instanceof ApiError && gerar.error.codigo === "IA_NAO_CONFIGURADA"
      ? gerar.error.message
      : "Não deu para escrever a resposta agora. Tente de novo.";

  // Já respondida e sem rascunho aberto → nada a fazer aqui
  if (avaliacao.respostaEnviada && rascunho === null && !gerar.isPending && !gerar.isError) {
    return (
      <Button variant="outline" size="sm" onClick={gerarResposta}>
        <Sparkles className="h-4 w-4 text-ia" />
        Reescrever com IA
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rascunho === null && !gerar.isError && (
        <Button
          variant="outline"
          size="sm"
          className="self-start border-ia/40 text-ia hover:bg-ia-soft"
          onClick={gerarResposta}
          disabled={gerar.isPending}
        >
          {gerar.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {gerar.isPending ? "Escrevendo..." : "Escrever resposta com IA"}
        </Button>
      )}

      {gerar.isError && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-danger-soft px-3 py-2">
          <span className="flex items-center gap-2 text-label text-danger">
            <AlertCircle className="h-4 w-4" />
            {mensagemErro}
          </span>
          <Button variant="outline" size="sm" onClick={gerarResposta}>
            Tentar de novo
          </Button>
        </div>
      )}

      {rascunho !== null && (
        <div className="rounded-xl border border-ia/30 bg-ia-soft p-3">
          <p className="mb-2 flex items-center gap-1.5 text-legenda font-medium text-ia">
            <Sparkles className="h-3.5 w-3.5" />
            Sugestão da IA — revise antes de salvar
          </p>
          <Textarea
            value={rascunho}
            onChange={(e) => setRascunho(e.target.value)}
            className="bg-surface"
            rows={4}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={copiar}>
              <Copy className="h-4 w-4" />
              Copiar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={gerarResposta}
              disabled={gerar.isPending}
            >
              {gerar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Gerar outra
            </Button>
            <Button
              size="sm"
              disabled={salvar.isPending || !rascunho.trim()}
              onClick={() =>
                salvar.mutate(
                  { id: avaliacao.id, dados: { respostaEnviada: rascunho.trim() } },
                  { onSuccess: () => setRascunho(null) }
                )
              }
            >
              {salvar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Salvar resposta
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
