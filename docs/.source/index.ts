import { loader } from 'fumadocs-core/source';
import { createMDXSource } from 'fumadocs-mdx';

export const { docs, meta } = loader({
  baseUrl: '/docs',
  source: createMDXSource('./content', {
    schema: (ctx) => ({
      type: 'page',
      title: ctx.frontmatter.title,
      description: ctx.frontmatter.description,
    }),
  }),
});