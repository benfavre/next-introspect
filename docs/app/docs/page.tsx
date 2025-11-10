import { source } from '@/app/source';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import {
  DocsPage,
  DocsBody,
} from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';

export default async function Page() {
  const page = source.getPage([]);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <h1 className="text-3xl font-bold">{page.data.title}</h1>
      <p className="text-muted-foreground">{page.data.description}</p>
      <DocsBody>
        <MDX components={defaultMdxComponents} />
      </DocsBody>
    </DocsPage>
  );
}
