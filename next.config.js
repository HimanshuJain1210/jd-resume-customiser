/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@react-pdf/renderer"],
  // Note: pdfjs-dist is intentionally NOT externalized — it must be bundled so
  // the worker module imported in the parse-resume route is included in the
  // serverless function.
};
module.exports = nextConfig;
