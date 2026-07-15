import { Suspense } from "react";
import { CalendarioView } from "@/components/calendario/CalendarioView";

export default function CalendarioPage() {
  return (
    <Suspense>
      <CalendarioView />
    </Suspense>
  );
}
