export interface ApiErro {
  codigo: string;
  mensagem: string;
  campos?: Record<string, string>;
}

export class ApiError extends Error {
  codigo: string;
  campos?: Record<string, string>;
  status: number;

  constructor(erro: ApiErro, status: number) {
    super(erro.mensagem);
    this.codigo = erro.codigo;
    this.campos = erro.campos;
    this.status = status;
  }
}

/** fetch tipado que lança ApiError no padrão { erro: { codigo, mensagem } } do PRD §9. */
export async function apiFetch<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    let corpo: { erro?: ApiErro } = {};
    try {
      corpo = await res.json();
    } catch {
      /* resposta sem json */
    }
    throw new ApiError(
      corpo.erro ?? {
        codigo: "DESCONHECIDO",
        mensagem: "Não foi possível concluir a ação.",
      },
      res.status
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
