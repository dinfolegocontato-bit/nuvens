"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const res = await signIn("credentials", {
      email,
      senha,
      redirect: false,
    });

    setCarregando(false);

    if (res?.error) {
      setErro("E-mail ou senha incorretos.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="mariana@moradanasnuvens.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="senha">Senha</Label>
          <Input
            id="senha"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>

        {erro && (
          <p className="text-legenda text-danger" role="alert">
            {erro}
          </p>
        )}

        <Button type="submit" disabled={carregando} className="mt-1 w-full">
          {carregando && <Loader2 className="h-4 w-4 animate-spin" />}
          {carregando ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </Card>
  );
}
