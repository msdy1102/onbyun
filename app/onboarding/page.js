import { Suspense } from "react";
import OnboardingPage from "./OnboardingPage";

export const metadata = {
  title: "온변 시작하기 | 온변",
  description: "온변 서비스를 시작하기 위한 간단한 설정을 진행해주세요.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OnboardingPage />
    </Suspense>
  );
}
