import { Suspense } from "react";
import { HospedesView } from "@/components/hospedes/HospedesView";

export default function HospedesPage() {
  return (
    <Suspense>
      <HospedesView />
    </Suspense>
  );
}
