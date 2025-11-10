import { DocsLayout } from 'fumadocs-ui/layout';
import type { ReactNode } from 'react';
import { pageTree } from '../../.source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout tree={pageTree} nav={{ title: 'Next Introspect' }}>
      {children}
    </DocsLayout>
  );
}
