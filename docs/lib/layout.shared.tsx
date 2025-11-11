import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  const basePath = process.env.GITHUB_PAGES ? '/next-introspect' : '';

  return {
    nav: {
      title: "Next Introspect Docs",
    },
  };
}
