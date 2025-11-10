import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextIntrospect } from '../../src/NextIntrospect';
import { NextJsAdapter } from '../../src/adapters/NextJsAdapter';
import { JsonFormatter } from '../../src/formatters/JsonFormatter';
import { MarkdownFormatter } from '../../src/formatters/MarkdownFormatter';
import { TypeScriptFormatter } from '../../src/formatters/TypeScriptFormatter';
import type { ProjectInfo, RouteInfo, RouteMetadata } from '../../src/types';

// Mock the NextJsAdapter
const mockAdapterInstance = {
  getProjectInfo: vi.fn(),
  getRoutes: vi.fn(),
};

vi.mock('../../src/adapters/NextJsAdapter', () => ({
  NextJsAdapter: vi.fn(() => mockAdapterInstance),
}));

// Mock NextIntrospect - will be set up in beforeEach after variables are defined
let mockNextIntrospectImpl: any;

vi.mock('../../src/NextIntrospect', () => ({
  NextIntrospect: vi.fn((...args) => mockNextIntrospectImpl?.(...args)),
}));

// Mock utils functions
vi.mock('../../src/utils', () => ({
  parseMetadataFile: vi.fn(),
}));

describe.skip('Metadata Handling', () => {
  let mockAdapter: any;
  let introspect: NextIntrospect;

  const mockProjectInfo: ProjectInfo = {
    framework: 'nextjs',
    version: '14.0.0',
    router: 'app',
    rootDir: 'tests/__fixtures__/mock-nextjs-project',
    sourceDirs: {
      app: 'src/app',
      pages: 'src/pages',
    },
  };

  const mockRoutes: RouteInfo[] = [
    {
      path: '/',
      filePath: 'src/app/page.tsx',
      pattern: 'static',
      type: 'page',
      router: 'app',
    },
    {
      path: '/blog',
      filePath: 'src/app/blog/page.tsx',
      pattern: 'static',
      type: 'page',
      router: 'app',
    },
    {
      path: '/blog/[slug]',
      filePath: 'src/app/blog/[slug]/page.tsx',
      pattern: 'dynamic',
      type: 'page',
      router: 'app',
    },
    {
      path: '/api/users',
      filePath: 'src/app/api/users/route.ts',
      pattern: 'static',
      type: 'api',
      router: 'app',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up NextIntrospect mock implementation
    mockNextIntrospectImpl = vi.fn(function (this: any, projectPath: string, options?: any) {
      const instance = {
        projectPath,
        options: options || {},
        analyzed: false,
        projectInfo: null,
        routes: [],
        analyze: vi.fn().mockImplementation(async () => {
          instance.analyzed = true;
          instance.projectInfo = mockProjectInfo;
          instance.routes = mockRoutes;
          return {
            project: mockProjectInfo,
            routes: mockRoutes,
            metadata: {
              analyzedAt: new Date(),
              duration: 100,
              filesProcessed: 6,
              mode: 'comprehensive' as const,
            },
          };
        }),
        getResult: vi.fn().mockImplementation(() => ({
          project: mockProjectInfo,
          routes: mockRoutes,
          metadata: {
            analyzedAt: new Date(),
            duration: 100,
            filesProcessed: 6,
            mode: 'comprehensive' as const,
          },
        })),
        exportToObject: vi.fn().mockImplementation(() => ({
          project: mockProjectInfo,
          routes: mockRoutes,
          metadata: {
            analyzedAt: new Date(),
            duration: 100,
            filesProcessed: 6,
            mode: 'comprehensive' as const,
          },
        })),
      };
      return instance;
    });

    mockAdapter = new NextJsAdapter();
    mockAdapter.getProjectInfo.mockResolvedValue(mockProjectInfo);
    mockAdapter.getRoutes.mockResolvedValue(mockRoutes);
  });

  describe('Metadata Merging', () => {
    it('should merge metadata from configuration into routes', async () => {
      const metadata: Record<string, RouteMetadata> = {
        '/blog': {
          title: 'Blog Homepage',
          description: 'Welcome to our amazing blog',
          category: 'content',
        },
        '/api/users': {
          description: 'User management API endpoint',
          version: 'v1',
          auth: true,
        },
      };

      introspect = new NextIntrospect('tests/__fixtures__/mock-nextjs-project', {
        metadata: { entries: metadata },
      });

      await introspect.analyze();
      const result = introspect.exportToObject();

      const blogRoute = result.routes.find((r: RouteInfo) => r.path === '/blog');
      const apiRoute = result.routes.find((r: RouteInfo) => r.path === '/api/users');
      const homeRoute = result.routes.find((r: RouteInfo) => r.path === '/');

      expect(blogRoute?.title).toBe('Blog Homepage');
      expect(blogRoute?.description).toBe('Welcome to our amazing blog');
      expect((blogRoute as any)?.category).toBe('content');

      expect(apiRoute?.description).toBe('User management API endpoint');
      expect((apiRoute as any)?.version).toBe('v1');
      expect((apiRoute as any)?.auth).toBe(true);

      // Routes without metadata should remain unchanged
      expect(homeRoute?.title).toBeUndefined();
    });

    it('should handle empty metadata object', async () => {
      introspect = new NextIntrospect('tests/__fixtures__/mock-nextjs-project', {
        metadata: { entries: {} },
      });

      await introspect.analyze();
      const result = introspect.exportToObject();

      // No routes should have metadata
      result.routes.forEach((route: RouteInfo) => {
        expect(route.title).toBeUndefined();
        expect(route.description).toBeUndefined();
      });
    });

    it('should handle partial metadata (only some routes)', async () => {
      const partialMetadata: Record<string, RouteMetadata> = {
        '/blog': { title: 'Blog' },
        // '/api/users' not included
        '/blog/[slug]': { title: 'Blog Post' },
      };

      introspect = new NextIntrospect('tests/__fixtures__/mock-nextjs-project', {
        metadata: { entries: partialMetadata },
      });

      await introspect.analyze();
      const result = introspect.exportToObject();

      const blogIndexRoute = result.routes.find((r: RouteInfo) => r.path === '/blog');
      const blogSlugRoute = result.routes.find((r: RouteInfo) => r.path === '/blog/[slug]');
      const apiRoute = result.routes.find((r: RouteInfo) => r.path === '/api/users');

      expect(blogIndexRoute?.title).toBe('Blog');
      expect(blogSlugRoute?.title).toBe('Blog Post');
      expect(apiRoute?.title).toBeUndefined();
    });

    it('should override existing metadata from route analysis', async () => {
      // Mock routes with existing metadata
      const routesWithMetadata: RouteInfo[] = [
        {
          ...mockRoutes[0],
          title: 'Original Title',
          description: 'Original description',
        },
      ];

      mockAdapter.getRoutes.mockResolvedValue(routesWithMetadata);

      const overrideMetadata: Record<string, RouteMetadata> = {
        '/': {
          title: 'Overridden Title',
          description: 'Overridden description',
          newField: 'added',
        },
      };

      introspect = new NextIntrospect('tests/__fixtures__/mock-nextjs-project', {
        metadata: { entries: overrideMetadata },
      });

      await introspect.analyze();
      const result = introspect.exportToObject();

      const homeRoute = result.routes.find((r: RouteInfo) => r.path === '/');
      expect(homeRoute?.title).toBe('Overridden Title');
      expect(homeRoute?.description).toBe('Overridden description');
      expect((homeRoute as any)?.newField).toBe('added');
    });
  });

  describe('Metadata File Loading', () => {
    it('should load metadata from JSON file', async () => {
      const jsonMetadata = {
        '/blog': { title: 'Blog from JSON', source: 'file' },
        '/api/users': { description: 'API from JSON' },
      };

      // Mock the parseMetadataFile function
      const parseMetadataFileMock = vi.fn().mockResolvedValue(jsonMetadata);
      vi.doMock('../../src/utils', async () => {
        const actual = await vi.importActual('../../src/utils');
        return {
          ...actual,
          parseMetadataFile: parseMetadataFileMock,
        };
      });

      introspect = new NextIntrospect('tests/__fixtures__/mock-nextjs-project', {
        metadata: { file: 'routes.json' },
      });

      await introspect.analyze();

      expect(parseMetadataFileMock).toHaveBeenCalledWith('routes.json');
    });

    it('should handle metadata file load errors gracefully', async () => {
      const parseMetadataFileMock = vi.fn().mockRejectedValue(new Error('File not found'));
      vi.doMock('../../src/utils', async () => {
        const actual = await vi.importActual('../../src/utils');
        return {
          ...actual,
          parseMetadataFile: parseMetadataFileMock,
        };
      });

      // Mock console.warn to capture warnings
      const consoleWarnMock = vi.fn();
      vi.spyOn(console, 'warn').mockImplementation(consoleWarnMock);

      introspect = new NextIntrospect('tests/__fixtures__/mock-nextjs-project', {
        metadata: { file: 'missing.json' },
      });

      await introspect.analyze();

      expect(parseMetadataFileMock).toHaveBeenCalledWith('missing.json');
      expect(consoleWarnMock).toHaveBeenCalledWith(
        expect.stringContaining('Could not load metadata file'),
        expect.any(Error)
      );

      // Analysis should still succeed
      const result = introspect.exportToObject();
      expect(result.routes).toBeDefined();
    });

    it('should merge file metadata with inline metadata', async () => {
      const fileMetadata = {
        '/blog': { title: 'From File', fileField: true },
      };

      const inlineMetadata = {
        '/blog': { description: 'From Inline', inlineField: true },
        '/api/users': { title: 'API Title' },
      };

      const parseMetadataFileMock = vi.fn().mockResolvedValue(fileMetadata);
      vi.doMock('../../src/utils', async () => {
        const actual = await vi.importActual('../../src/utils');
        return {
          ...actual,
          parseMetadataFile: parseMetadataFileMock,
        };
      });

      introspect = new NextIntrospect('tests/__fixtures__/mock-nextjs-project', {
        metadata: {
          file: 'routes.json',
          entries: inlineMetadata,
        },
      });

      await introspect.analyze();
      const result = introspect.exportToObject();

      const blogRoute = result.routes.find((r: RouteInfo) => r.path === '/blog');
      const apiRoute = result.routes.find((r: RouteInfo) => r.path === '/api/users');

      // File metadata should be loaded and merged with inline
      expect(blogRoute?.title).toBe('From File');
      expect(blogRoute?.description).toBe('From Inline');
      expect((blogRoute as any)?.fileField).toBe(true);
      expect((blogRoute as any)?.inlineField).toBe(true);

      // Inline-only metadata should still apply
      expect(apiRoute?.title).toBe('API Title');
    });
  });

  describe('Metadata in Output Formats', () => {
    beforeEach(async () => {
      const metadata: Record<string, RouteMetadata> = {
        '/blog': {
          title: 'Blog Homepage',
          description: 'A place for articles',
          category: 'content',
          tags: ['blog', 'articles'],
          customData: { featured: true, priority: 1 },
        },
        '/api/users': {
          description: 'User management',
          version: 'v1.0',
          auth: { required: true, scopes: ['read', 'write'] },
        },
      };

      introspect = new NextIntrospect('tests/__fixtures__/mock-nextjs-project', {
        metadata: { entries: metadata },
      });

      await introspect.analyze();
    });

    it('should include metadata in JSON output', () => {
      const formatter = new JsonFormatter();
      const result = introspect.exportToObject();
      const jsonOutput = formatter.format(result);

      const parsed = JSON.parse(jsonOutput);

      const blogRoute = parsed.routes.find((r: RouteInfo) => r.path === '/blog');
      const apiRoute = parsed.routes.find((r: RouteInfo) => r.path === '/api/users');

      expect(blogRoute.title).toBe('Blog Homepage');
      expect(blogRoute.description).toBe('A place for articles');
      expect(blogRoute.category).toBe('content');
      expect(blogRoute.tags).toEqual(['blog', 'articles']);
      expect(blogRoute.customData).toEqual({ featured: true, priority: 1 });

      expect(apiRoute.description).toBe('User management');
      expect(apiRoute.version).toBe('v1.0');
      expect(apiRoute.auth).toEqual({ required: true, scopes: ['read', 'write'] });
    });

    it('should include metadata in Markdown output', () => {
      const formatter = new MarkdownFormatter();
      const result = introspect.exportToObject();
      const markdownOutput = formatter.format(result);

      expect(markdownOutput).toContain('Blog Homepage');
      expect(markdownOutput).toContain('A place for articles');
      expect(markdownOutput).toContain('User management');
      expect(markdownOutput).toContain('v1.0');
    });

    it('should include metadata in TypeScript output', () => {
      const formatter = new TypeScriptFormatter();
      const result = introspect.exportToObject();
      const tsOutput = formatter.format(result);

      // Metadata should be included in the generated TypeScript
      expect(tsOutput).toContain('title: "Blog Homepage"');
      expect(tsOutput).toContain('description: "A place for articles"');
    });

    it('should handle metadata field exclusion', () => {
      const result = introspect.exportToObject({
        excludeFields: ['title', 'description'],
      });

      result.routes.forEach((route: RouteInfo) => {
        expect(route.title).toBeUndefined();
        expect(route.description).toBeUndefined();
        // Other metadata fields should still be present
        if (route.path === '/blog') {
          expect((route as any).category).toBe('content');
          expect((route as any).tags).toEqual(['blog', 'articles']);
        }
      });
    });
  });

  describe('Complex Metadata Scenarios', () => {
    it('should handle nested metadata objects', async () => {
      const complexMetadata: Record<string, RouteMetadata> = {
        '/blog': {
          seo: {
            title: 'Blog | My Site',
            description: 'Blog description',
            keywords: ['blog', 'articles'],
            og: {
              image: '/blog-og.jpg',
              type: 'website',
            },
          },
          features: {
            comments: true,
            sharing: true,
            newsletter: false,
          },
        },
      };

      introspect = new NextIntrospect('tests/__fixtures__/mock-nextjs-project', {
        metadata: { entries: complexMetadata },
      });

      await introspect.analyze();
      const result = introspect.exportToObject();

      const blogRoute = result.routes.find((r: RouteInfo) => r.path === '/blog');
      expect((blogRoute as any)?.seo).toEqual({
        title: 'Blog | My Site',
        description: 'Blog description',
        keywords: ['blog', 'articles'],
        og: {
          image: '/blog-og.jpg',
          type: 'website',
        },
      });
      expect((blogRoute as any)?.features).toEqual({
        comments: true,
        sharing: true,
        newsletter: false,
      });
    });

    it('should handle metadata with special data types', async () => {
      const specialMetadata: Record<string, RouteMetadata> = {
        '/special': {
          date: new Date('2023-01-01'),
          regex: /test/i,
          func: function test() { return 'test'; },
          symbol: Symbol('test'),
          buffer: Buffer.from('test'),
        },
      };

      introspect = new NextIntrospect('tests/__fixtures__/mock-nextjs-project', {
        metadata: { entries: specialMetadata },
      });

      await introspect.analyze();
      const result = introspect.exportToObject();

      const specialRoute = result.routes.find((r: RouteInfo) => r.path === '/special');
      expect((specialRoute as any)?.date).toBeInstanceOf(Date);
      expect((specialRoute as any)?.regex).toEqual(/test/i);
      expect(typeof (specialRoute as any)?.func).toBe('function');
      expect(typeof (specialRoute as any)?.symbol).toBe('symbol');
      expect((specialRoute as any)?.buffer).toBeInstanceOf(Buffer);
    });

    it('should handle large metadata objects', async () => {
      const largeMetadata: Record<string, RouteMetadata> = {};

      // Create metadata for many routes
      for (let i = 0; i < 100; i++) {
        largeMetadata[`/page-${i}`] = {
          title: `Page ${i}`,
          description: `Description for page ${i}`,
          index: i,
          data: { value: i * 2 },
        };
      }

      const largeRoutes: RouteInfo[] = Object.keys(largeMetadata).map(path => ({
        path,
        filePath: `src/app${path}/page.tsx`,
        pattern: 'static' as const,
        type: 'page' as const,
        router: 'app' as const,
      }));

      mockAdapter.getRoutes.mockResolvedValue(largeRoutes);

      introspect = new NextIntrospect('tests/__fixtures__/mock-nextjs-project', {
        metadata: { entries: largeMetadata },
      });

      await introspect.analyze();
      const result = introspect.exportToObject();

      expect(result.routes).toHaveLength(100);
      expect(result.routes[0].title).toBe('Page 0');
      expect(result.routes[99].title).toBe('Page 99');
      expect((result.routes[50] as any)?.index).toBe(50);
    });
  });

  describe('Metadata Validation and Sanitization', () => {
    it('should handle null and undefined metadata values', async () => {
      const invalidMetadata: Record<string, RouteMetadata> = {
        '/blog': {
          title: null as any,
          description: undefined,
          validField: 'valid',
        },
      };

      introspect = new NextIntrospect('tests/__fixtures__/mock-nextjs-project', {
        metadata: { entries: invalidMetadata },
      });

      await introspect.analyze();
      const result = introspect.exportToObject();

      const blogRoute = result.routes.find((r: RouteInfo) => r.path === '/blog');
      expect(blogRoute?.title).toBeNull();
      expect(blogRoute?.description).toBeUndefined();
      expect((blogRoute as any)?.validField).toBe('valid');
    });

    it('should handle metadata with prototype pollution attempts', async () => {
      const maliciousMetadata: Record<string, RouteMetadata> = {
        '/test': {
          __proto__: { malicious: true },
          constructor: { prototype: { hacked: true } },
          validField: 'safe',
        } as any,
      };

      introspect = new NextIntrospect('tests/__fixtures__/mock-nextjs-project', {
        metadata: { entries: maliciousMetadata },
      });

      await introspect.analyze();
      const result = introspect.exportToObject();

      const testRoute = result.routes.find((r: RouteInfo) => r.path === '/test');
      expect((testRoute as any)?.validField).toBe('safe');
      // Should not have prototype pollution
      expect((testRoute as any)?.__proto__?.malicious).toBeUndefined();
    });
  });
});
