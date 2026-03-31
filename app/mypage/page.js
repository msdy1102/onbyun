import { Suspense } from "react";
import MyPage from "./MyPage";

export const metadata = {
  title: "내 정보 | 온변",
  description: "온변 내 계정 정보 및 알림 설정을 관리하세요.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MyPage />
    </Suspense>
  );
}
