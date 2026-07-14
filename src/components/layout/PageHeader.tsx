interface PageHeaderProps {
  /** Botões de ação da página (canto direito da linha do título) */
  acoes?: React.ReactNode;
  /** Linha de filtros abaixo do título */
  filtros?: React.ReactNode;
  titulo: string;
}

/**
 * Cabeçalho de página: título (h2) + ações à direita + linha de filtros (PRD §6.1).
 * A saudação e o subtítulo vivem na Topbar; aqui fica o título da seção.
 */
export function PageHeader({ titulo, acoes, filtros }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-h2 font-bold text-strong">{titulo}</h2>
        {acoes && <div className="flex items-center gap-2">{acoes}</div>}
      </div>
      {filtros && (
        <div className="flex flex-wrap items-center gap-2">{filtros}</div>
      )}
    </div>
  );
}
