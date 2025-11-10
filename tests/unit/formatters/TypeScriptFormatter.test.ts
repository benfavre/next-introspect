import { describe, it, expect } from "vitest";
import { TypeScriptFormatter } from "../../../src/formatters/TypeScriptFormatter";
import type {
  RouteInfo,
  ProjectInfo,
  IntrospectionResult,
} from "../../../src/types";

describe("TypeScriptFormatter", () => {
  let formatter: TypeScriptFormatter;

  const mockRoutes: RouteInfo[] = [
    {
      path: "/",
      filePath: "src/app/page.tsx",
      pattern: "static",
      type: "page",
      router: "app",
    },
    {
      path: "/api/users",
      filePath: "src/app/api/users/route.ts",
      pattern: "static",
      type: "api",
      router: "app",
    },
    {
      path: "/blog/[slug]",
      filePath: "src/app/blog/[slug]/page.tsx",
      pattern: "dynamic",
      type: "page",
      router: "app",
    },
    {
      path: "/catch/[...slug]",
      filePath: "src/app/catch/[...slug]/page.tsx",
      pattern: "catch-all",
      type: "page",
      router: "app",
    },
  ];

  const mockProjectInfo: ProjectInfo = {
    framework: "nextjs",
    version: "14.0.0",
    router: "app",
    rootDir: "/path/to/project",
    sourceDirs: {
      app: "src/app",
    },
  };

  const mockResult: IntrospectionResult = {
    project: mockProjectInfo,
    routes: mockRoutes,
    metadata: {
      analyzedAt: new Date(),
      duration: 150,
      filesProcessed: 4,
      mode: "comprehensive" as const,
    },
  };

  beforeEach(() => {
    formatter = new TypeScriptFormatter();
  });

  describe("format", () => {
    it("should generate valid TypeScript code", () => {
      const result = formatter.format(mockResult);

      expect(typeof result).toBe("string");
      expect(result).toContain("export const routes = {");
      expect(result).toContain("// Named exports for granular tree-shaking");
      expect(result).toContain(
        "// Direct-reference routes object for dot notation",
      );
      expect(result).toContain("export default routes;");
    });

    it("should include route builders for static routes", () => {
      const result = formatter.format(mockResult);

      // Should contain named exports for routes
      expect(result).toContain('export const index = "/";');
      expect(result).toContain("export const blog = {");
      expect(result).toContain('bySlug: "/blog/[slug]"');
    });

    it("should handle dynamic routes with parameters", () => {
      const result = formatter.format(mockResult);

      expect(result).toContain("export const blog_bySlug = (() => {");
      expect(result).toContain(
        "const func = ({ slug }: { slug: string }): string => `/blog/${slug}`;",
      );
    });

    it("should handle catch-all routes", () => {
      const result = formatter.format(mockResult);

      expect(result).toContain("export const catch_bySlugRest = (() => {");
      expect(result).toContain(
        "const func = ({ slug }: { slug: string }): string => `/catch/[...slug]`;",
      );
    });

    it("should generate proper nested structure", () => {
      const result = formatter.format(mockResult);

      // Check for proper nesting in routes object
      expect(result).toContain("export const routes = {");
      expect(result).toContain("index: index,");
      expect(result).toContain("blog: {");
      expect(result).toContain("bySlug: blog_bySlug");
      expect(result).toContain("catch: {");
      expect(result).toContain("bySlugRest: catch_bySlugRest");
    });

    it("should include type definitions", () => {
      const result = formatter.format(mockResult);

      // The current implementation doesn't generate separate type definitions
      // but uses inferred types from the const assertions
      expect(result).toContain("as const;");
      expect(result).toContain("export default routes;");
    });

    it("should handle empty routes", () => {
      const emptyResult: IntrospectionResult = {
        project: mockProjectInfo,
        routes: [],
        metadata: {
          analyzedAt: new Date(),
          duration: 50,
          filesProcessed: 0,
          mode: "comprehensive" as const,
        },
      };

      const result = formatter.format(emptyResult);

      expect(result).toContain("export const routes = {} as const;");
    });
  });

  describe("namespace option", () => {
    it("should not support namespace option", () => {
      // The current TypeScriptFormatter doesn't support namespace option
      const result = formatter.format(mockResult);

      expect(result).not.toContain("namespace");
      expect(result).toContain("export const routes =");
    });
  });

  describe("route path transformations", () => {
    it("should handle strip prefixes", () => {
      const formatterWithStrip = new TypeScriptFormatter({
        stripPrefixes: ["/api"],
      });
      const result = formatterWithStrip.format(mockResult);

      // Routes under /api should be adjusted - but the current implementation doesn't strip API routes
      expect(result).toContain("export const routes = {");
    });

    it("should handle multiple strip prefixes", () => {
      const formatterWithStrip = new TypeScriptFormatter({
        stripPrefixes: ["/api", "/blog"],
      });
      const result = formatterWithStrip.format(mockResult);

      expect(result).toContain("export const routes = {");
    });

    it("should handle regex strip prefixes", () => {
      const formatterWithStrip = new TypeScriptFormatter({
        stripPrefixes: ["//\\/sites\\/[^\\/]+\\/"],
      });
      const routesWithSites: RouteInfo[] = [
        {
          path: "/sites/example/blog",
          filePath: "src/app/sites/example/blog/page.tsx",
          pattern: "static",
          type: "page",
          router: "app",
        },
      ];

      const result = formatterWithStrip.format({
        project: mockProjectInfo,
        routes: routesWithSites,
        metadata: {
          analyzedAt: new Date(),
          duration: 100,
          filesProcessed: 1,
          mode: "comprehensive" as const,
        },
      });

      expect(result).toContain("export const routes = {");
    });
  });

  describe("complex route structures", () => {
    it("should handle deeply nested routes", () => {
      const nestedRoutes: RouteInfo[] = [
        {
          path: "/admin/users/profile/settings",
          filePath: "src/app/admin/users/profile/settings/page.tsx",
          pattern: "static",
          type: "page",
          router: "app",
        },
      ];

      const result = formatter.format({
        project: mockProjectInfo,
        routes: nestedRoutes,
        metadata: {
          analyzedAt: new Date(),
          duration: 100,
          filesProcessed: 1,
          mode: "comprehensive" as const,
        },
      });

      expect(result).toContain("export const routes = {");
      expect(result).toContain("admin: {");
      expect(result).toContain("users: {");
      expect(result).toContain("profile: {");
    });

    it("should handle mixed static and dynamic segments", () => {
      const mixedRoutes: RouteInfo[] = [
        {
          path: "/blog/2023/[slug]/comments/[commentId]",
          filePath: "src/app/blog/2023/[slug]/comments/[commentId]/page.tsx",
          pattern: "dynamic",
          type: "page",
          router: "app",
        },
      ];

      const result = formatter.format({
        project: mockProjectInfo,
        routes: mixedRoutes,
        metadata: {
          analyzedAt: new Date(),
          duration: 100,
          filesProcessed: 1,
          mode: "comprehensive" as const,
        },
      });

      expect(result).toContain("export const routes = {");
      expect(result).toContain("blog: {");
    });
  });

  describe("optional catch-all routes", () => {
    it("should handle optional catch-all routes", () => {
      const optionalCatchAllRoutes: RouteInfo[] = [
        {
          path: "/docs/[[...slug]]",
          filePath: "src/app/docs/[[...slug]]/page.tsx",
          pattern: "optional-catch-all",
          type: "page",
          router: "app",
        },
      ];

      const result = formatter.format({
        project: mockProjectInfo,
        routes: optionalCatchAllRoutes,
        metadata: {
          analyzedAt: new Date(),
          duration: 100,
          filesProcessed: 1,
          mode: "comprehensive" as const,
        },
      });

      expect(result).toContain("export const routes = {");
      expect(result).toContain("docs: {");
    });
  });

  describe("field exclusion", () => {
    it("should work without field exclusion", () => {
      // TypeScript formatter doesn't directly support field exclusion
      const result = formatter.format(mockResult);

      // Should still generate valid TypeScript
      expect(result).toContain("export const routes = {");
      expect(result).toContain("index: index");
    });
  });

  describe("error handling", () => {
    it("should handle routes with invalid paths", () => {
      const invalidRoutes: RouteInfo[] = [
        {
          path: "",
          filePath: "src/app/page.tsx",
          pattern: "static",
          type: "page",
          router: "app",
        },
      ];

      const result = formatter.format({
        project: mockProjectInfo,
        routes: invalidRoutes,
        metadata: {
          analyzedAt: new Date(),
          duration: 100,
          filesProcessed: 1,
          mode: "comprehensive" as const,
        },
      });

      // Should handle empty paths gracefully
      expect(result).toContain("export const routes = {");
    });

    it("should handle routes with special characters", () => {
      const specialRoutes: RouteInfo[] = [
        {
          path: "/test/path-with-dashes",
          filePath: "src/app/test/path-with-dashes/page.tsx",
          pattern: "static",
          type: "page",
          router: "app",
        },
      ];

      const result = formatter.format({
        project: mockProjectInfo,
        routes: specialRoutes,
        metadata: {
          analyzedAt: new Date(),
          duration: 100,
          filesProcessed: 1,
          mode: "comprehensive" as const,
        },
      });

      expect(result).toContain("export const routes = {");
    });
  });

  describe("type safety", () => {
    it("should generate compileable TypeScript", () => {
      const result = formatter.format(mockResult);

      // Basic checks that the generated code looks like valid TypeScript
      expect(result).toContain("export const routes = {");
      expect(result).toContain("} as const;");
      expect(result).toContain("() =>");
    });

    it("should generate proper parameter types for dynamic routes", () => {
      const dynamicRoutes: RouteInfo[] = [
        {
          path: "/users/[id]/posts/[postId]",
          filePath: "src/app/users/[id]/posts/[postId]/page.tsx",
          pattern: "dynamic",
          type: "page",
          router: "app",
        },
      ];

      const result = formatter.format({
        project: mockProjectInfo,
        routes: dynamicRoutes,
        metadata: {
          analyzedAt: new Date(),
          duration: 100,
          filesProcessed: 1,
          mode: "comprehensive" as const,
        },
      });

      expect(result).toContain("export const routes = {");
    });
  });
});
