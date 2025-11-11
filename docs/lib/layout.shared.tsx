import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const basePath = process.env.GITHUB_PAGES ? '/next-introspect' : '';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Next Introspect Docs",
    },
  };
}
