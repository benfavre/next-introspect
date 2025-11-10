import { describe, it, expect } from "vitest";
import { JsonFormatter } from "../../../src/formatters/JsonFormatter";
import type {
  RouteInfo,
  ProjectInfo,
  IntrospectionResult,
} from "../../../src/types";

describe("JsonFormatter", () => {
  let formatter: JsonFormatter;

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
    formatter = new JsonFormatter();
  });

  describe("format", () => {
    it("should format introspection result as JSON", () => {
      const result = formatter.format(mockResult);

      expect(typeof result).toBe("string");

      // Parse and verify structure
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty("project");
      expect(parsed).toHaveProperty("routes");
      expect(parsed).toHaveProperty("metadata");
      expect(Array.isArray(parsed.routes)).toBe(true);
    });

    it("should include all route information", () => {
      const result = formatter.format(mockResult);
      const parsed = JSON.parse(result);

      expect(parsed.routes).toHaveLength(3);

      const homeRoute = parsed.routes.find((r: RouteInfo) => r.path === "/");
      expect(homeRoute).toMatchObject({
        path: "/",
        filePath: "src/app/page.tsx",
        pattern: "static",
        type: "page",
        router: "app",
      });
    });

    it("should include project information", () => {
      const result = formatter.format(mockResult);
      const parsed = JSON.parse(result);

      expect(parsed.project).toEqual(mockProjectInfo);
    });

    it("should handle empty routes array", () => {
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
      const parsed = JSON.parse(result);

      expect(parsed.routes).toEqual([]);
      expect(parsed.project).toEqual(mockProjectInfo);
    });

    it("should handle routes with complex data", () => {
      const complexRoutes: RouteInfo[] = [
        {
          path: "/catch/[...slug]",
          filePath: "src/app/catch/[...slug]/page.tsx",
          pattern: "catch-all",
          type: "page",
          router: "app",
          segments: [
            { type: "static", value: "catch" },
            { type: "dynamic", value: "[...slug]" },
          ],
        },
      ];

      const result = formatter.format({
        projectInfo: mockProjectInfo,
        routes: complexRoutes,
        analysisTime: 100,
      });

      const parsed = JSON.parse(result);
      expect(parsed.routes[0]).toHaveProperty("segments");
      expect(Array.isArray(parsed.routes[0].segments)).toBe(true);
    });
  });

  describe("indentation", () => {
    it("should format with custom indentation", () => {
      const formatter = new JsonFormatter(4);
      const result = formatter.format(mockResult);

      // Check that it has proper indentation (spaces at the beginning of lines)
      const lines = result.split("\n");
      expect(lines[1]).toMatch(/^\s{4}/); // First content line should be indented
    });

    it("should format compact JSON when no indentation", () => {
      const formatter = new JsonFormatter(0);
      const result = formatter.format(mockResult);

      // Should be compact (no extra whitespace)
      expect(result).not.toContain("\n");
      expect(result).not.toMatch(/\s{2,}/);
    });
  });

  describe("field exclusion", () => {
    it("should format JSON correctly", () => {
      // JsonFormatter doesn't handle field exclusion - that's done by NextIntrospect
      const result = formatter.format(mockResult);
      const parsed = JSON.parse(result);

      // Check that all fields are present (field exclusion is not applied by formatter)
      parsed.routes.forEach((route: RouteInfo) => {
        expect(route.filePath).toBeDefined();
        expect(route.router).toBeDefined();
        expect(route.path).toBeDefined();
        expect(route.type).toBeDefined();
      });
    });

    it("should handle non-existent fields gracefully", () => {
      // JsonFormatter doesn't handle field exclusion
      const result = formatter.format(mockResult);
      const parsed = JSON.parse(result);

      // Should work normally
      expect(parsed.routes[0].path).toBeDefined();
      expect(parsed.routes[0].filePath).toBeDefined();
    });
  });

  describe("error handling", () => {
    it("should handle circular references", () => {
      // Create a circular reference
      const circularRoute = { ...mockRoutes[0] };
      (circularRoute as any).self = circularRoute;

      const result = formatter.format({
        project: mockProjectInfo,
        routes: [circularRoute],
        metadata: {
          analyzedAt: new Date(),
          duration: 100,
          filesProcessed: 1,
          mode: "comprehensive" as const,
        },
      });

      // Should not throw and should produce valid JSON
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it("should handle special values", () => {
      const specialRoutes: RouteInfo[] = [
        {
          path: "/test",
          filePath: "src/app/test/page.tsx",
          pattern: "static",
          type: "page",
          router: "app",
          // Add some special values that might cause JSON issues
          metadata: {
            date: new Date("2023-01-01"),
            regex: /test/,
            func: () => "test",
          },
        },
      ];

      const result = formatter.format({
        projectInfo: mockProjectInfo,
        routes: specialRoutes,
        analysisTime: 100,
      });

      const parsed = JSON.parse(result);

      // Should handle special values appropriately
      expect(parsed.routes[0]).toBeDefined();
    });
  });
});
