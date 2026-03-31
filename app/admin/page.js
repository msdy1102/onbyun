import { Suspense } from "react";
import AdminPage from "./AdminPage";

export const metadata = { title: "관리자 대시보드 | 온변" };

export default function Page() {
  return <Suspense fallback={null}><AdminPage /></Suspense>;
}
