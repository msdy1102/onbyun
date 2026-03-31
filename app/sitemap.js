import { CONTRACT_LIST, CONTRACTS, APPLICATIONS } from "./data";

export default function sitemap() {
  const base = "https://onbyun.vercel.app";
  const now = new Date();

  const staticPages = [
    { url: base, lastModified: now, changeFrequency: "weekly",  priority: 1 },
    { url: `${base}/?tab=list`, lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/?tab=ai`,   lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // 약관 및 정책 페이지
    { url: `${base}/terms`,         lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/service-terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/policy`,        lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`,       lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const docPages = [
    ...CONTRACT_LIST.map(item => ({
      url: `${base}/doc/${item.id}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    })),
    ...CONTRACTS.map(item => ({
      url: `${base}/doc/${item.id}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    })),
    ...APPLICATIONS.map(item => ({
      url: `${base}/doc/${item.id}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    })),
  ];

  return [...staticPages, ...docPages];
}
