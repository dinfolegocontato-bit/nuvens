/**
 * Geração de CSV no padrão do PRD §9: text/csv, BOM UTF-8, separador ";".
 * Números saem no formato pt-BR (vírgula decimal) para abrir certo no Excel.
 */

const SEP = ";";
// BOM UTF-8 (U+FEFF). Montado por código para não depender de o caractere
// literal sobreviver ao salvamento do arquivo.
const BOM = String.fromCharCode(0xfeff);

function escapar(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  const s = String(valor);
  if (s.includes(SEP) || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Número em pt-BR sem separador de milhar: 1234.5 → "1234,50" */
export function numeroCSV(v: number, casas = 2): string {
  return v.toFixed(casas).replace(".", ",");
}

/**
 * Data-only vinda do banco (meia-noite UTC) → dd/mm/aaaa.
 * Formata a partir das partes UTC para não escorregar um dia em fusos negativos.
 */
export function dataCSV(d: Date | string): string {
  const iso = d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10);
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function gerarCSV(cabecalho: string[], linhas: unknown[][]): string {
  const corpo = [cabecalho, ...linhas]
    .map((linha) => linha.map(escapar).join(SEP))
    .join("\r\n");
  return BOM + corpo;
}

/** Resposta HTTP de download de CSV. */
export function respostaCSV(conteudo: string, nomeArquivo: string): Response {
  return new Response(conteudo, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      "Cache-Control": "no-store",
    },
  });
}
