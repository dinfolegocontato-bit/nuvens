import { Suspense } from "react";
import { FinanceiroView } from "@/components/financeiro/FinanceiroView";

export default function FinanceiroPage() {
  return (
    <Suspense>
      <FinanceiroView />
    </Suspense>
  );
}
