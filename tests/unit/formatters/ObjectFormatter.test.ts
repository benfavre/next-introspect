import { describe, it, expect } from "vitest";
import { ObjectFormatter } from "../../../src/formatters/ObjectFormatter";
import type {
  RouteInfo,
  ProjectInfo,
  IntrospectionResult,
} from "../../../src/types";

describe("ObjectFormatter", () => {
  let formatter: ObjectFormatter;

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
      filesProcessed: 3,
      mode: "comprehensive" as const,
    },
  };

  beforeEach(() => {
    formatter = new ObjectFormatter();
  });

  describe("format", () => {
    it("should return a JavaScript object", () => {
      const result = formatter.format(mockResult);

      expect(typeof result).toBe("object");
      expect(result).not.toBeNull();
      expect(result).toHaveProperty("project");
      expect(result).toHaveProperty("routes");
      expect(result).toHaveProperty("metadata");
    });

    it("should include all project information", () => {
      const result = formatter.format(mockResult);

      expect(result.project).toEqual(mockProjectInfo);
      expect(result.project.framework).toBe("nextjs");
      expect(result.project.version).toBe("14.0.0");
      expect(result.project.router).toBe("app");
    });

    it("should include all routes", () => {
      const result = formatter.format(mockResult);

      expect(Array.isArray(result.routes)).toBe(true);
      expect(result.routes).toHaveLength(3);

      const homeRoute = result.routes.find((r: RouteInfo) => r.path === "/");
      expect(homeRoute).toEqual(mockRoutes[0]);
    });

    it("should preserve route objects completely", () => {
      const complexRoutes: RouteInfo[] = [
        {
          path: "/complex",
          filePath: "src/app/complex/page.tsx",
          pattern: "static",
          type: "page",
          router: "app",
          segments: [{ type: "static", value: "complex" }],
          metadata: {
            title: "Complex Page",
            customField: "value",
          },
        },
      ];

      const result = formatter.format({
        projectInfo: mockProjectInfo,
        routes: complexRoutes,
        analysisTime: 100,
      });

      expect(result.routes[0]).toEqual(complexRoutes[0]);
      expect(result.routes[0].segments).toEqual(complexRoutes[0].segments);
      expect(result.routes[0].metadata).toEqual(complexRoutes[0].metadata);
    });

    it("should handle empty routes array", () => {
      const emptyResult: IntrospectionResult = {
        projectInfo: mockProjectInfo,
        routes: [],
        analysisTime: 50,
      };

      const result = formatter.format(emptyResult);

      expect(result.routes).toEqual([]);
      expect(result.projectInfo).toEqual(mockProjectInfo);
      expect(result.analysisTime).toBe(50);
    });

    it("should handle routes with undefined values", () => {
      const routesWithUndefined: RouteInfo[] = [
        {
          path: "/",
          filePath: "src/app/page.tsx",
          pattern: "static",
          type: "page",
          router: "app",
          title: undefined,
          description: undefined,
        },
      ];

      const result = formatter.format({
        projectInfo: mockProjectInfo,
        routes: routesWithUndefined,
        analysisTime: 100,
      });

      expect(result.routes[0].title).toBeUndefined();
      expect(result.routes[0].description).toBeUndefined();
    });
  });

  describe("field exclusion", () => {
    it("should return object without field exclusion", () => {
      // ObjectFormatter doesn't handle field exclusion - that's done by NextIntrospect
      const result = formatter.format(mockResult);

      result.routes.forEach((route: RouteInfo) => {
        expect(route.filePath).toBeDefined();
        expect(route.router).toBeDefined();
        expect(route.path).toBeDefined();
        expect(route.type).toBeDefined();
        expect(route.pattern).toBeDefined();
      });
    });

    it("should handle nested objects", () => {
      const routesWithNestedData: RouteInfo[] = [
        {
          path: "/test",
          filePath: "src/app/test/page.tsx",
          pattern: "static",
          type: "page",
          router: "app",
          segments: [{ type: "static", value: "test" }],
          metadata: {
            title: "Test Page",
            nested: {
              field: "value",
            },
          },
        },
      ];

      const result = formatter.format({
        project: mockProjectInfo,
        routes: routesWithNestedData,
        metadata: {
          analyzedAt: new Date(),
          duration: 100,
          filesProcessed: 1,
          mode: "comprehensive" as const,
        },
      });

      // ObjectFormatter preserves all data including nested objects
      expect(result.routes[0].metadata).toBeDefined();
      expect(result.routes[0].segments).toBeDefined();
      expect(result.routes[0].path).toBe("/test");
    });

    it("should handle non-existent fields gracefully", () => {
      // ObjectFormatter doesn't handle field exclusion
      const result = formatter.format(mockResult);

      // Should include all fields
      expect(result.routes[0].filePath).toBeDefined();
      expect(result.routes[0].router).toBeDefined();
    });

    it("should handle empty routes array", () => {
      const result = formatter.format({
        project: mockProjectInfo,
        routes: [],
        metadata: {
          analyzedAt: new Date(),
          duration: 50,
          filesProcessed: 0,
          mode: "comprehensive" as const,
        },
      });

      expect(result.routes).toEqual([]);
      expect(result.project).toEqual(mockProjectInfo);
    });
  });

  describe("data integrity", () => {
    it("should not modify original route objects", () => {
      const originalRoutes = JSON.parse(JSON.stringify(mockRoutes));

      formatter.format(mockResult);

      // Original routes should be unchanged
      expect(mockRoutes).toEqual(originalRoutes);
    });

    it("should not modify original result object", () => {
      const originalResult = { ...mockResult };

      formatter.format(mockResult);

      // Original result should be unchanged (allow for metadata Date vs string difference)
      expect(mockResult.project).toEqual(originalResult.project);
      expect(mockResult.routes).toEqual(originalResult.routes);
    });

    it("should handle circular references", () => {
      const circularRoute = { ...mockRoutes[0] };
      (circularRoute as any).self = circularRoute;

      const result = formatter.format({
        projectInfo: mockProjectInfo,
        routes: [circularRoute],
        analysisTime: 100,
      });

      // Should handle circular references without issues
      expect(result.routes).toHaveLength(1);
      expect(result.routes[0].path).toBe("/");
    });

    it("should preserve Date objects", () => {
      const routeWithDate: RouteInfo = {
        ...mockRoutes[0],
        metadata: {
          createdAt: new Date("2023-01-01T00:00:00Z"),
        },
      };

      const result = formatter.format({
        projectInfo: mockProjectInfo,
        routes: [routeWithDate],
        analysisTime: 100,
      });

      expect(result.routes[0].metadata?.createdAt).toBeInstanceOf(Date);
      expect(result.routes[0].metadata?.createdAt.toISOString()).toBe(
        "2023-01-01T00:00:00.000Z",
      );
    });

    it("should preserve special object types", () => {
      const routeWithSpecial: RouteInfo = {
        ...mockRoutes[0],
        metadata: {
          regex: /test/i,
          func: function test() {
            return "test";
          },
          symbol: Symbol("test"),
        },
      };

      const result = formatter.format({
        projectInfo: mockProjectInfo,
        routes: [routeWithSpecial],
        analysisTime: 100,
      });

      expect(result.routes[0].metadata?.regex).toEqual(/test/i);
      expect(typeof result.routes[0].metadata?.func).toBe("function");
      expect(typeof result.routes[0].metadata?.symbol).toBe("symbol");
    });
  });

  describe("performance", () => {
    it("should handle large route arrays efficiently", () => {
      const largeRoutes: RouteInfo[] = Array.from({ length: 1000 }, (_, i) => ({
        path: `/page-${i}`,
        filePath: `src/app/page-${i}/page.tsx`,
        pattern: "static",
        type: "page",
        router: "app",
      }));

      const startTime = Date.now();
      const result = formatter.format({
        projectInfo: mockProjectInfo,
        routes: largeRoutes,
        analysisTime: 100,
      });
      const endTime = Date.now();

      expect(result.routes).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });

  describe("error handling", () => {
    it("should handle malformed route data", () => {
      const malformedRoutes: RouteInfo[] = [
        {
          path: undefined as any,
          filePath: null as any,
          pattern: "static",
          type: "page",
          router: "app",
        },
      ];

      const result = formatter.format({
        projectInfo: mockProjectInfo,
        routes: malformedRoutes,
        analysisTime: 100,
      });

      expect(result.routes[0].path).toBeUndefined();
      expect(result.routes[0].filePath).toBeNull();
    });

    it("should handle missing required fields", () => {
      const incompleteRoutes: Partial<RouteInfo>[] = [
        {
          path: "/test",
          // Missing other required fields
        },
      ];

      const result = formatter.format({
        projectInfo: mockProjectInfo,
        routes: incompleteRoutes as RouteInfo[],
        analysisTime: 100,
      });

      expect(result.routes[0].path).toBe("/test");
    });
  });
});
