import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarCheck,
  Wallet,
  Home,
  Users,
  Calendar,
  Star,
  FileText,
  BarChart3,
  Plug,
  CalendarPlus,
  CalendarX,
  ReceiptText,
  FileSpreadsheet,
} from "lucide-react";

export interface ItemNav {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Navegação principal da sidebar (PRD §6.1) */
export const NAV_PRINCIPAL: ItemNav[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reservas", label: "Reservas", icon: CalendarCheck },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/imoveis", label: "Imóveis", icon: Home },
  { href: "/hospedes", label: "Hóspedes", icon: Users },
  { href: "/calendario", label: "Calendário", icon: Calendar },
  { href: "/avaliacoes", label: "Avaliações", icon: Star },
  { href: "/relatorios", label: "Relatórios", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/integracoes", label: "Integrações", icon: Plug },
];

/** Atalhos rápidos (PRD §6.1) */
export const ATALHOS_RAPIDOS: ItemNav[] = [
  { href: "/reservas/nova", label: "Nova reserva", icon: CalendarPlus },
  { href: "/calendario?bloquear=1", label: "Bloquear datas", icon: CalendarX },
  { href: "/financeiro?novo=1", label: "Novo lançamento", icon: ReceiptText },
  { href: "/financeiro", label: "Extrato financeiro", icon: FileSpreadsheet },
];

/**
 * Subtítulo da topbar por página (PRD §6.1).
 * Os que o PRD não tabela (Avaliações, Relatórios, Integrações) seguem o mesmo padrão.
 */
export const SUBTITULOS: Record<string, string> = {
  "/dashboard": "Aqui está a visão geral do seu negócio.",
  "/reservas": "Aqui estão todas as reservas do seu negócio.",
  "/reservas/nova":
    "Preencha as informações para criar uma nova reserva manualmente.",
  "/financeiro": "Aqui está o resumo financeiro do seu negócio.",
  "/imoveis": "Aqui está a visão geral dos seus chalés.",
  "/hospedes": "Aqui está a gestão dos seus hóspedes.",
  "/calendario": "Aqui está o calendário de reservas dos seus chalés.",
  "/avaliacoes": "Aqui está a gestão das avaliações dos seus chalés.",
  "/relatorios": "Aqui estão os relatórios do seu negócio.",
  "/analytics": "Aqui está a análise completa do desempenho do seu negócio.",
  "/integracoes": "Aqui estão os canais e integrações do seu negócio.",
};

export function subtituloDe(pathname: string): string {
  if (SUBTITULOS[pathname]) return SUBTITULOS[pathname];
  // fallback: casa pelo prefixo mais específico
  const chave = Object.keys(SUBTITULOS)
    .filter((k) => pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return chave ? SUBTITULOS[chave] : "";
}
