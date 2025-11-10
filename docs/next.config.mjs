/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.GITHUB_PAGES ? '/next-introspect' : '',
  trailingSlash: true,
};

export default nextConfig;