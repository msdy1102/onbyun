import { CONTRACT_LIST, CONTRACT_CATEGORIES, CONTRACTS, APPLICATIONS } from "../../data";
import { DOC_DETAILS } from "../../doc-details";
import { notFound } from "next/navigation";
import DocPage from "./DocPage";

export async function generateStaticParams() {
  const ids = [
    ...CONTRACT_LIST.map(c => ({ id: c.id })),
    ...CONTRACTS.map(c => ({ id: c.id })),
    ...APPLICATIONS.map(a => ({ id: a.id })),
  ];
  return ids;
}

export async function generateMetadata({ params }) {
  const { id } = params;

  const listItem = CONTRACT_LIST.find(c => c.id === id);
  const contract = CONTRACTS.find(c => c.id === id);
  const application = APPLICATIONS.find(a => a.id === id);
  const item = listItem || contract || application;

  if (!item) return { title: "온변 — 온라인 변호사" };

  const cat = CONTRACT_CATEGORIES.find(c => c.id === listItem?.category);
  const desc = contract?.summary || application?.summary || `${item.label} 주의사항과 체크리스트를 무료로 확인하세요.`;

  return {
    title: `${item.label} 주의사항 | 온변`,
    description: `${item.label} 서명 전 꼭 확인해야 할 체크리스트. ${desc} 온변에서 무료로 확인하세요.`,
    keywords: [`${item.label}`, `${item.label} 주의사항`, `${item.label} 체크리스트`, "온변", "온라인 변호사"],
    openGraph: {
      title: `${item.label} 주의사항 | 온변`,
      description: desc,
      type: "article",
    },
  };
}

export default function Page({ params }) {
  const { id } = params;

  const listItem = CONTRACT_LIST.find(c => c.id === id);
  const contract = CONTRACTS.find(c => c.id === id);
  const application = APPLICATIONS.find(a => a.id === id);
  const detail = DOC_DETAILS[id];

  if (!listItem && !contract && !application) notFound();

  const cat = CONTRACT_CATEGORIES.find(c => c.id === listItem?.category);

  const data = {
    id,
    label: (listItem || contract || application).label,
    category: cat?.label || null,
    type: contract ? "contract" : application ? "application" : "list",
    contract: contract || null,
    application: application || null,
    detail: detail || null,
  };

  return <DocPage data={data} />;
}
