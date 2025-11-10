import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: process.env.GITHUB_PAGES ? "/next-introspect" : "",
  trailingSlash: true,
  turbopack: {
    root: resolve(__dirname, "../../.."),
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize esbuild and its platform-specific binaries
      config.externals = {
        ...config.externals,
        esbuild: "esbuild",
      };
    }

    // Ignore warnings about esbuild
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /@esbuild/ },
      { module: /esbuild/ },
    ];

    return config;
  },
};

export default nextConfig;
