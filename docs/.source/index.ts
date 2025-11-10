import { createMDXSource } from 'fumadocs-mdx';

export const { docs, meta } = createMDXSource({
  cwd: './content'
});

export const pageTree = docs.pageTree;
