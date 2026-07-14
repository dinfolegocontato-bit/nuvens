export type PlataformaValor = "AIRBNB" | "BOOKING" | "DIRETO";
export type ImovelStatusValor = "ATIVO" | "FUTURO" | "INATIVO";

export interface ImovelDTO {
  id: string;
  nome: string;
  cidade: string;
  status: ImovelStatusValor;
  capacidade: number;
  quartos: number;
  banheiros: number;
  fotoUrl: string | null;
  plataformas: PlataformaValor[];
  criadoEm: string;
  _count?: { reservas: number };
}
