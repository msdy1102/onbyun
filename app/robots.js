export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: "https://onbyun.vercel.app/sitemap.xml",
    host: "https://onbyun.vercel.app",
  };
}
