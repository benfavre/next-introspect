import path from "path";
import { BaseAdapter } from "./BaseAdapter.js";
import type {
  ProjectInfo,
  RouteInfo,
  OutputMode,
  NextConfig,
  IntrospectionOptions,
} from "../types.js";
import {
  isNextJsProject,
  getPackageInfo,
  detectRouterType,
  traverseDirectory,
} from "../utils.js";

/**
 * Next.js framework adapter
 *
 * Detects Next.js projects and analyzes their routing structure
 * using both App Router and Pages Router parsers.
 */
export class NextJsAdapter extends BaseAdapter {
  constructor() {
    super("nextjs");
  }

  /**
   * Detect if this is a Next.js project
   */
  async detect(projectPath: string): Promise<boolean> {
    return await isNextJsProject(projectPath);
  }

  /**
   * Get Next.js project information
   */
  async getProjectInfo(
    projectPath: string,
    packageDisplayOptions?: IntrospectionOptions["packageDisplay"],
  ): Promise<ProjectInfo> {
    // Validate project path
    await this.validateProjectPath(projectPath);

    // Get package info
    const packageInfo = await getPackageInfo(
      projectPath,
      packageDisplayOptions,
    );
    const nextVersion =
      packageInfo?.dependencies?.["next"] ||
      packageInfo?.devDependencies?.["next"];

    // Detect router type
    const router = detectRouterType(projectPath);

    // Parse Next.js config
    const config = await this.parseNextConfig(projectPath);

    // Determine source directories
    const sourceDirs: ProjectInfo["sourceDirs"] = {};
    if (await this.directoryExists(path.join(projectPath, "app"))) {
      sourceDirs.app = "app";
    }
    if (await this.directoryExists(path.join(projectPath, "pages"))) {
      sourceDirs.pages = "pages";
    }
    if (await this.directoryExists(path.join(projectPath, "src", "app"))) {
      sourceDirs.app = "src/app";
    }
    if (await this.directoryExists(path.join(projectPath, "src", "pages"))) {
      sourceDirs.pages = "src/pages";
    }

    return {
      framework: "nextjs",
      version: nextVersion || "unknown",
      router,
      rootDir: projectPath,
      config,
      packageInfo,
      sourceDirs,
    };
  }

  /**
   * Get all routes for the Next.js project
   */
  async getRoutes(projectPath: string, mode: OutputMode): Promise<RouteInfo[]> {
    const projectInfo = await this.getProjectInfo(projectPath);
    const routes: RouteInfo[] = [];

    // Analyze App Router routes
    if (projectInfo.router === "app" || projectInfo.router === "both") {
      const appRoutes = await this.getAppRouterRoutes(projectPath, mode);
      routes.push(...appRoutes);
    }

    // Analyze Pages Router routes
    if (projectInfo.router === "pages" || projectInfo.router === "both") {
      const pagesRoutes = await this.getPagesRouterRoutes(projectPath, mode);
      routes.push(...pagesRoutes);
    }

    return routes;
  }

  /**
   * Parse Next.js configuration files
   */
  private async parseNextConfig(
    projectPath: string,
  ): Promise<NextConfig | undefined> {
    const configFiles = [
      "next.config.js",
      "next.config.mjs",
      "next.config.ts",
      "next.config.mts",
      "next.config.cjs",
    ];

    for (const configFile of configFiles) {
      const configPath = path.join(projectPath, configFile);
      if (await this.fileExists(configPath)) {
        try {
          // For now, return basic config detection
          // In a full implementation, we'd need to safely evaluate the config file
          return {
            hasMiddleware:
              (await this.fileExists(
                path.join(projectPath, "middleware.js"),
              )) ||
              (await this.fileExists(
                path.join(projectPath, "middleware.ts"),
              )) ||
              (await this.fileExists(
                path.join(projectPath, "src/middleware.js"),
              )) ||
              (await this.fileExists(
                path.join(projectPath, "src/middleware.ts"),
              )),
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.warn(
            `Warning: Could not parse Next.js config ${configFile}:`,
            errorMessage,
          );
        }
      }
    }

    return undefined;
  }

  /**
   * Get App Router routes
   */
  private async getAppRouterRoutes(
    projectPath: string,
    _mode: OutputMode,
  ): Promise<RouteInfo[]> {
    // This will be implemented when we create the AppRouterParser
    // For now, return empty array
    const routes: RouteInfo[] = [];

    // Find app directory
    let appDir: string | null = null;
    if (await this.directoryExists(path.join(projectPath, "app"))) {
      appDir = path.join(projectPath, "app");
    } else if (
      await this.directoryExists(path.join(projectPath, "src", "app"))
    ) {
      appDir = path.join(projectPath, "src", "app");
    }

    if (!appDir) {
      return routes;
    }

    // Basic App Router route detection (simplified)
    // This will be enhanced when we implement the full AppRouterParser
    try {
      const entries = await traverseDirectory(appDir, 10, 0, [
        "node_modules/**",
        ".next/**",
        "**/*.test.*",
        "**/*.spec.*",
      ]);

      for (const entry of entries) {
        if (entry.isDirectory) {
          continue;
        }

        // Check if it's a special Next.js file
        if (this.isAppRouterSpecialFile(entry.name)) {
          // Compute path relative to app directory
          const relativeToApp = path.relative(appDir, entry.path);
          const routePath = this.convertFilePathToRoute(relativeToApp);
          routes.push({
            path: routePath,
            filePath: entry.path,
            pattern: "static", // Will be determined by parser
            router: "app",
          });
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn(
        "Warning: Could not analyze App Router routes:",
        errorMessage,
      );
    }

    return routes;
  }

  /**
   * Get Pages Router routes
   */
  private async getPagesRouterRoutes(
    projectPath: string,
    _mode: OutputMode,
  ): Promise<RouteInfo[]> {
    // This will be implemented when we create the PagesRouterParser
    // For now, return empty array
    const routes: RouteInfo[] = [];

    // Find pages directory
    let pagesDir: string | null = null;
    if (await this.directoryExists(path.join(projectPath, "pages"))) {
      pagesDir = path.join(projectPath, "pages");
    } else if (
      await this.directoryExists(path.join(projectPath, "src", "pages"))
    ) {
      pagesDir = path.join(projectPath, "src", "pages");
    }

    if (!pagesDir) {
      return routes;
    }

    // Basic Pages Router route detection (simplified)
    // This will be enhanced when we implement the full PagesRouterParser
    try {
      const entries = await traverseDirectory(pagesDir, 10, 0, [
        "node_modules/**",
        ".next/**",
        "**/*.test.*",
        "**/*.spec.*",
      ]);

      for (const entry of entries) {
        if (entry.isDirectory) {
          continue;
        }

        // Check if it's a valid page file
        if (this.isPagesRouterFile(entry.name)) {
          // Compute path relative to pages directory
          const relativeToPages = path.relative(pagesDir, entry.path);
          const routePath = this.convertPagesPathToRoute(relativeToPages);
          routes.push({
            path: routePath,
            filePath: entry.path,
            pattern: "static", // Will be determined by parser
            router: "pages",
            pagesRouter: {
              isApiRoute: routePath.startsWith("/api/"),
              isSpecialPage: false,
            },
          });
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn(
        "Warning: Could not analyze Pages Router routes:",
        errorMessage,
      );
    }

    return routes;
  }

  /**
   * Check if a file is a special App Router file
   */
  private isAppRouterSpecialFile(filename: string): boolean {
    const specialFiles = [
      "page.tsx",
      "page.jsx",
      "page.js",
      "page.ts",
      "layout.tsx",
      "layout.jsx",
      "layout.js",
      "layout.ts",
      "loading.tsx",
      "loading.jsx",
      "loading.js",
      "loading.ts",
      "error.tsx",
      "error.jsx",
      "error.js",
      "error.ts",
      "not-found.tsx",
      "not-found.jsx",
      "not-found.js",
      "not-found.ts",
      "template.tsx",
      "template.jsx",
      "template.js",
      "template.ts",
      "default.tsx",
      "default.jsx",
      "default.js",
      "default.ts",
      "route.ts",
      "route.js",
    ];

    return specialFiles.includes(filename);
  }

  /**
   * Check if a file is a valid Pages Router file
   */
  private isPagesRouterFile(filename: string): boolean {
    // Exclude TypeScript declaration files and test files
    if (
      filename.endsWith(".d.ts") ||
      filename.includes(".test.") ||
      filename.includes(".spec.")
    ) {
      return false;
    }

    const validExtensions = [".tsx", ".jsx", ".js", ".ts"];
    return validExtensions.some((ext) => filename.endsWith(ext));
  }

  /**
   * Convert App Router file path to route path
   */
  private convertFilePathToRoute(relativePath: string): string {
    // The relativePath is already relative to the app directory
    // Remove special file names and their extensions
    let routePath = relativePath.replace(
      /\/(page|route|layout|loading|error|not-found|template|default)(\..*)?$/,
      "",
    );

    // Split into segments and filter out route groups (segments wrapped in parentheses)
    const segments = routePath
      .split("/")
      .filter((segment) => segment.length > 0);
    const filteredSegments = segments.filter(
      (segment) => !(segment.startsWith("(") && segment.endsWith(")")),
    );

    // Join back into path
    const finalRoutePath = filteredSegments.join("/");

    // Convert directory structure to route
    if (finalRoutePath === "") {
      return "/";
    }

    return `/${finalRoutePath}`;
  }

  /**
   * Convert Pages Router file path to route path
   */
  private convertPagesPathToRoute(relativePath: string): string {
    // Remove pages directory prefix and file extension
    let routePath = relativePath
      .replace(/^pages\//, "")
      .replace(/^src\/pages\//, "");

    // Remove file extension
    routePath = routePath.replace(/\..*$/, "");

    // Handle index files
    if (routePath.endsWith("/index")) {
      routePath = routePath.slice(0, -6); // Remove '/index'
    } else if (routePath === "index") {
      routePath = "";
    }

    // Convert to route path
    if (routePath === "") {
      return "/";
    }

    return `/${routePath}`;
  }
}
