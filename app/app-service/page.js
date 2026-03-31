import { Suspense } from "react";
import OnByun from "../components/OnByun";

export default function AppPage() {
  return (
    <Suspense fallback={null}>
      <OnByun />
    </Suspense>
  );
}
