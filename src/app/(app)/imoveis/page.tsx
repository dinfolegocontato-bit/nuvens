import { Suspense } from "react";
import { ImoveisView } from "@/components/imoveis/ImoveisView";

export default function ImoveisPage() {
  return (
    <Suspense>
      <ImoveisView />
    </Suspense>
  );
}
