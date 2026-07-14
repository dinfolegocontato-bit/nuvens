"use client";

import { signOut } from "next-auth/react";
import { ChevronDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({
  nome = "Mariana Ferraz",
  papel = "Proprietária",
}: {
  nome?: string;
  papel?: string;
}) {
  const iniciais = nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl p-1 pr-2 outline-none transition-colors hover:bg-app focus-visible:ring-2 focus-visible:ring-primary">
        <Avatar>
          <AvatarFallback>{iniciais}</AvatarFallback>
        </Avatar>
        <div className="hidden text-left leading-tight md:block">
          <p className="text-label font-medium text-strong">{nome}</p>
          <p className="text-[12px] text-muted-foreground">{papel}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>{nome}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-danger focus:bg-danger-soft"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
