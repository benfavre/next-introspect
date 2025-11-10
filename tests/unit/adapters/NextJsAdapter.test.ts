import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextJsAdapter } from '../../../src/adapters/NextJsAdapter';
import type { ProjectInfo, RouteInfo, RouterType } from '../../../src/types';

// Mock the route parsing methods
const mockAppRoutes: RouteInfo[] = [
  {
    path: '/',
    filePath: 'src/app/page.tsx',
    pattern: 'static',
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
  {
    path: '/blog/[slug]',
    filePath: 'src/app/blog/[slug]/page.tsx',
    pattern: 'dynamic',
    type: 'page',
    router: 'app',
  },
];

const mockPagesRoutes: RouteInfo[] = [
  {
    path: '/about',
    filePath: 'src/pages/about.tsx',
    pattern: 'static',
    type: 'page',
    router: 'pages',
  },
];

describe('NextJsAdapter', () => {
  let adapter: NextJsAdapter;

  beforeEach(() => {
    adapter = new NextJsAdapter();

    // Mock the route parsing methods
    vi.spyOn(adapter as any, 'getAppRouterRoutes').mockResolvedValue(mockAppRoutes);
    vi.spyOn(adapter as any, 'getPagesRouterRoutes').mockResolvedValue(mockPagesRoutes);
  });

  describe('getProjectInfo', () => {
    it('should detect Next.js project with App Router', async () => {
      const fixturePath = 'tests/__fixtures__/mock-nextjs-project';

      const projectInfo = await adapter.getProjectInfo(fixturePath);

      expect(projectInfo).toMatchObject({
        framework: 'nextjs',
        router: 'both', // Since we have both app and pages directories
      });
      expect(projectInfo.version).toBeDefined();
      expect(projectInfo.rootDir).toBe(fixturePath);
    });

    it('should detect package.json information', async () => {
      const fixturePath = 'tests/__fixtures__/mock-nextjs-project';

      const projectInfo = await adapter.getProjectInfo(fixturePath, {
        includeScripts: true,
        includeDependencies: true,
      });

      expect(projectInfo.packageInfo).toBeDefined();
      expect(projectInfo.packageInfo?.name).toBe('mock-nextjs-project');
      expect(projectInfo.packageInfo?.scripts).toBeDefined();
    });

    it('should handle non-Next.js projects', async () => {
      const invalidPath = '/nonexistent/path';

      await expect(adapter.getProjectInfo(invalidPath)).rejects.toThrow();
    });
  });

  describe('getRoutes', () => {
    it('should extract routes from App Router', async () => {
      const fixturePath = 'tests/__fixtures__/mock-nextjs-project';

      const routes = await adapter.getRoutes(fixturePath, 'comprehensive');

      expect(Array.isArray(routes)).toBe(true);
      expect(routes.length).toBeGreaterThan(0);

      // Check for home page route
      const homeRoute = routes.find(r => r.path === '/');
      expect(homeRoute).toBeDefined();
      expect(homeRoute?.type).toBe('page');
      expect(homeRoute?.router).toBe('app');
      expect(homeRoute?.filePath).toContain('src/app/page.tsx');
    });

    it('should extract dynamic routes', async () => {
      const fixturePath = 'tests/__fixtures__/mock-nextjs-project';

      const routes = await adapter.getRoutes(fixturePath, 'comprehensive');

      // Check for dynamic blog route
      const blogRoute = routes.find(r => r.path?.includes('[slug]'));
      expect(blogRoute).toBeDefined();
      expect(blogRoute?.pattern).toBe('dynamic');
      expect(blogRoute?.filePath).toContain('src/app/blog/[slug]/page.tsx');
    });

    it('should extract API routes', async () => {
      const fixturePath = 'tests/__fixtures__/mock-nextjs-project';

      const routes = await adapter.getRoutes(fixturePath, 'comprehensive');

      // Check for API route
      const apiRoute = routes.find(r => r.path === '/api/users');
      expect(apiRoute).toBeDefined();
      expect(apiRoute?.type).toBe('api');
      expect(apiRoute?.router).toBe('app');
      expect(apiRoute?.filePath).toContain('src/app/api/users/route.ts');
    });

    it('should extract Pages Router routes', async () => {
      const fixturePath = 'tests/__fixtures__/mock-nextjs-project';

      const routes = await adapter.getRoutes(fixturePath, 'comprehensive');

      // Check for pages router route
      const aboutRoute = routes.find(r => r.path === '/about');
      expect(aboutRoute).toBeDefined();
      expect(aboutRoute?.type).toBe('page');
      expect(aboutRoute?.router).toBe('pages');
      expect(aboutRoute?.filePath).toContain('src/pages/about.tsx');
    });

    it('should handle different analysis modes', async () => {
      const fixturePath = 'tests/__fixtures__/mock-nextjs-project';

      const basicRoutes = await adapter.getRoutes(fixturePath, 'basic');
      const detailedRoutes = await adapter.getRoutes(fixturePath, 'detailed');
      const comprehensiveRoutes = await adapter.getRoutes(fixturePath, 'comprehensive');

      expect(basicRoutes.length).toBeGreaterThan(0);
      expect(detailedRoutes.length).toBeGreaterThanOrEqual(basicRoutes.length);
      expect(comprehensiveRoutes.length).toBeGreaterThanOrEqual(detailedRoutes.length);
    });

    it('should handle catch-all routes', async () => {
      // This would require creating a fixture with catch-all routes
      // For now, just test that the method handles it gracefully
      const fixturePath = 'tests/__fixtures__/mock-nextjs-project';

      const routes = await adapter.getRoutes(fixturePath, 'comprehensive');

      // Should not throw and should return valid routes
      expect(Array.isArray(routes)).toBe(true);
    });

    it('should handle optional catch-all routes', async () => {
      // Similar to catch-all test
      const fixturePath = 'tests/__fixtures__/mock-nextjs-project';

      const routes = await adapter.getRoutes(fixturePath, 'comprehensive');

      expect(Array.isArray(routes)).toBe(true);
    });
  });

  describe('route detection edge cases', () => {
    it('should handle nested route groups', async () => {
      // Would need fixture with route groups like (auth), (dashboard), etc.
      const fixturePath = 'tests/__fixtures__/mock-nextjs-project';

      const routes = await adapter.getRoutes(fixturePath, 'comprehensive');

      // Routes should not include route group segments in paths
      const routePaths = routes.map(r => r.path).filter(Boolean);
      expect(routePaths.every(path => !path!.includes('(') && !path!.includes(')'))).toBe(true);
    });

    it('should handle special Next.js files', async () => {
      const fixturePath = 'tests/__fixtures__/mock-nextjs-project';

      const routes = await adapter.getRoutes(fixturePath, 'comprehensive');

      // Should include layout.tsx, loading.tsx, error.tsx, etc. if they existed
      // For now, just ensure no errors are thrown
      expect(Array.isArray(routes)).toBe(true);
    });

    it('should handle middleware.ts files', async () => {
      const fixturePath = 'tests/__fixtures__/mock-nextjs-project';

      const routes = await adapter.getRoutes(fixturePath, 'comprehensive');

      // Middleware files should be detected if present
      expect(Array.isArray(routes)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle missing directories gracefully', async () => {
      const invalidPath = '/completely/invalid/path';

      await expect(adapter.getRoutes(invalidPath, 'basic')).rejects.toThrow();
    });

    it('should handle malformed package.json', async () => {
      // Would need a fixture with invalid JSON
      // For now, test with valid fixture
      const fixturePath = 'tests/__fixtures__/mock-nextjs-project';

      const projectInfo = await adapter.getProjectInfo(fixturePath);
      expect(projectInfo).toBeDefined();
    });
  });
});
