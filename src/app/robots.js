export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/client/",
        "/tutor/dashboard",
        "/tutor/contracts",
        "/tutor/messages",
        "/tutor/onboarding",
        "/api/"
      ],
    },
    sitemap: "https://tutoronline.pk/sitemap.xml",
  };
}
