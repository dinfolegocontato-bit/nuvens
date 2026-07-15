import { Suspense } from "react";
import { ReservasView } from "@/components/reservas/ReservasView";

export default function ReservasPage() {
  return (
    <Suspense>
      <ReservasView />
    </Suspense>
  );
}
