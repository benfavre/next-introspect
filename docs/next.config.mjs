import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // img.shields.io
  images: {
    domains: ["img.shields.io"],
  },
};

export default withMDX(config);
