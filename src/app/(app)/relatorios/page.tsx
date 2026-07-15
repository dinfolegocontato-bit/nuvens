import { Suspense } from "react";
import { RelatoriosView } from "@/components/relatorios/RelatoriosView";

export default function RelatoriosPage() {
  return (
    <Suspense>
      <RelatoriosView />
    </Suspense>
  );
}
