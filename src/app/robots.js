export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/client/", "/tutor/dashboard", "/admin/"],
    },
    sitemap: "https://tutoronline.pk/sitemap.xml",
  };
}
