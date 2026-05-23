import AuthPageClient from "@/components/clients/AuthPageClient";
import { Suspense } from "react";

export default function Auth() {
  return (
    <Suspense fallback={null}>
      <AuthPageClient />
    </Suspense>
  );
}
