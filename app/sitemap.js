import { CONTRACT_LIST } from "./data";

export default function sitemap() {
  const base = "https://onbyun.vercel.app";

  const staticPages = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}?tab=contract`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}?tab=application`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}?tab=list`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  return [...staticPages];
}
