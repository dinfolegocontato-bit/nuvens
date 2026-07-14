import { LoginForm } from "@/components/auth/LoginForm";
import { Mountain } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-app px-6">
      <div className="w-full max-w-sm">
        {/* Marca */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-text text-white">
            <Mountain className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-h2 font-bold text-strong">
            Morada nas Nuvens
          </h1>
          <p className="mt-1 text-legenda text-muted-foreground">
            Visconde de Mauá - RJ
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
