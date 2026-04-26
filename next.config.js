/** @type {import('next').NextConfig} */
const nextConfig = {
  // Phase2 portal uses Next.js API Routes for token verification / sponsor-H edits.
  // Do not use `output: 'export'`; static export cannot include API routes.
  images: { unoptimized: true },
};

module.exports = nextConfig;
