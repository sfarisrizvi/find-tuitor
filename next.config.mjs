import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  org: "tutor-online",
  project: "javascript-nextjs",
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
