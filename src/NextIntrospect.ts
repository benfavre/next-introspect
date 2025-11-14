import path from "path";
import type {
  IntrospectionOptions,
  ProjectInfo,
  RouteInfo,
  IntrospectionResult,
  OutputFormat,
  OutputMode,
  RouteMetadata,
} from "./types.js";
import { NextJsAdapter } from "./adapters/NextJsAdapter.js";
import { ObjectFormatter } from "./formatters/ObjectFormatter.js";
import { JsonFormatter } from "./formatters/JsonFormatter.js";
import { MarkdownFormatter } from "./formatters/MarkdownFormatter.js";
import { TypeScriptFormatter } from "./formatters/TypeScriptFormatter.js";
import {
  isNextJsProject,
  formatPathForDisplay,
  routesToNested,
  routesToArray,
  parseMetadataFile,
  mergeRouteMetadata,
  filterExcludedFields,
} from "./utils.js";

/**
 * Main Next.js Introspection Class
 *
 * Analyzes Next.js projects and provides detailed routing information
 * in multiple output formats.
 */
export class NextIntrospect {
  private projectPath: string;
  private options: IntrospectionOptions;
  private projectInfo: ProjectInfo | null = null;
  private routes: RouteInfo[] = [];
  private analyzed = false;

  // Formatters
  private formatters = {
    object: new ObjectFormatter(),
    json: new JsonFormatter(),
    markdown: new MarkdownFormatter(),
    typescript: new TypeScriptFormatter(),
  };

  /**
   * Create a new NextIntrospect instance
   */
  constructor(projectPath: string, options: IntrospectionOptions = {}) {
    this.projectPath = path.resolve(projectPath);
    this.options = {
      mode: "comprehensive",
      maxDepth: 10,
      followSymlinks: false,
      ...options,
    };
  }

  /**
   * Analyze the Next.js project
   */
  async analyze(): Promise<ProjectInfo> {
    const startTime = Date.now();

    // Validate project path
    if (!(await this.isValidProject())) {
      throw new Error(`Invalid Next.js project: ${this.projectPath}`);
    }

    // Detect framework and get project info
    const adapter = new NextJsAdapter();
    this.projectInfo = await adapter.getProjectInfo(
      this.projectPath,
      this.options.packageDisplay,
    );

    // Get routes based on router type
    this.routes = await adapter.getRoutes(this.projectPath, this.options.mode!);

    // Load and merge metadata if specified
    if (this.options.metadata?.file) {
      try {
        const metadata = await parseMetadataFile(this.options.metadata.file);
        this.routes = mergeRouteMetadata(this.routes, metadata);
        this.options.metadata.entries = metadata;
      } catch (error) {
        console.warn(
          `Warning: Could not load metadata file ${this.options.metadata.file}:`,
          error,
        );
      }
    }

    // Format paths according to display options
    this.routes = this.formatRoutePaths(this.routes, this.projectInfo);

    this.analyzed = true;

    const endTime = Date.now();
    const _duration = endTime - startTime;

    // Update project info with analysis metadata
    this.projectInfo = {
      ...this.projectInfo,
      // Add any additional analysis metadata if needed
    };

    return this.projectInfo;
  }

  /**
   * Get all detected routes
   */
  getRoutes(): RouteInfo[] {
    if (!this.analyzed) {
      throw new Error(
        "Project must be analyzed first. Call analyze() before getRoutes().",
      );
    }
    return this.routes;
  }

  /**
   * Get the complete introspection result as an object (alias for getResult)
   */
  exportToObject(): IntrospectionResult {
    return this.getResult();
  }

  /**
   * Get the complete introspection result
   */
  getResult(): IntrospectionResult {
    if (!this.analyzed || !this.projectInfo) {
      throw new Error(
        "Project must be analyzed first. Call analyze() before getResult().",
      );
    }

    const routes = this.options.outputFormat?.nested
      ? routesToNested(
          this.routes,
          this.options.outputFormat.includeEmptySegments,
        )
      : this.routes;

    const result = {
      project: this.projectInfo,
      routes: routes,
      metadata: {
        analyzedAt: new Date(),
        duration: 0, // Would need to track this properly
        filesProcessed: this.routes.length, // Approximation
        mode: this.options.mode!,
      },
    };

    // Apply field filtering if specified
    if (
      this.options.outputFormat?.excludeFields &&
      this.options.outputFormat.excludeFields.length > 0
    ) {
      return filterExcludedFields(
        result,
        this.options.outputFormat.excludeFields,
      );
    }

    return result;
  }

  /**
   * Format the results using the specified formatter
   */
  format(format: OutputFormat): string | object {
    const result = this.getResult();

    let formatter = this.formatters[format];
    if (!formatter) {
      throw new Error(`Unknown format: ${format}`);
    }

    // Handle TypeScriptFormatter with stripPrefixes option
    if (format === "typescript" && this.options.outputFormat?.stripPrefixes) {
      formatter = new TypeScriptFormatter({
        stripPrefixes: this.options.outputFormat.stripPrefixes,
      });
    }

    return formatter.format(result);
  }

  /**
   * Set the analysis mode
   */
  setMode(mode: OutputMode): void {
    this.options.mode = mode;
    // Reset analysis state if mode changed
    if (this.analyzed) {
      this.analyzed = false;
      this.routes = [];
    }
  }

  /**
   * Get the current analysis mode
   */
  getMode(): OutputMode {
    return this.options.mode!;
  }

  /**
   * Get project information
   */
  getProjectInfo(): ProjectInfo | null {
    return this.projectInfo;
  }

  /**
   * Check if the project has been analyzed
   */
  isAnalyzed(): boolean {
    return this.analyzed;
  }

  /**
   * Get analysis options
   */
  getOptions(): IntrospectionOptions {
    return { ...this.options };
  }

  /**
   * Format route paths according to display options
   */
  private formatRoutePaths(
    routes: RouteInfo[],
    projectInfo: ProjectInfo,
  ): RouteInfo[] {
    if (!this.options.pathDisplay) {
      return routes;
    }

    return routes.map((route) => {
      const formattedRoute = { ...route };

      // Format file path if showFilePaths is explicitly enabled
      if (this.options.pathDisplay!.showFilePaths === true) {
        formattedRoute.filePath = formatPathForDisplay(
          route.filePath,
          projectInfo.rootDir,
          projectInfo.sourceDirs || {},
          this.options.pathDisplay,
        );
      }

      // Format route path (the "path" field) - these are URL-style route paths starting with '/'
      // Only apply path formatting if the route path looks like a file path (contains '../' or full paths)
      if (
        route.path.includes("../") ||
        route.path.includes(projectInfo.rootDir)
      ) {
        formattedRoute.path = formatPathForDisplay(
          route.path,
          projectInfo.rootDir,
          projectInfo.sourceDirs || {},
          this.options.pathDisplay,
        );
      }

      return formattedRoute;
    });
  }

  /**
   * Update analysis options
   */
  updateOptions(newOptions: Partial<IntrospectionOptions>): void {
    this.options = { ...this.options, ...newOptions };
    // Reset analysis state if options changed
    if (this.analyzed) {
      this.analyzed = false;
      this.routes = [];
    }
  }

  /**
   * Get routes filtered by router type
   */
  getRoutesByRouter(router: "app" | "pages"): RouteInfo[] {
    return this.getRoutes().filter((route) => route.router === router);
  }

  /**
   * Get API routes (Pages Router only)
   */
  getApiRoutes(): RouteInfo[] {
    return this.getRoutes().filter(
      (route) => route.router === "pages" && route.pagesRouter?.isApiRoute,
    );
  }

  /**
   * Get special pages (Pages Router only)
   */
  getSpecialPages(): RouteInfo[] {
    return this.getRoutes().filter(
      (route) => route.router === "pages" && route.pagesRouter?.isSpecialPage,
    );
  }

  /**
   * Get dynamic routes
   */
  getDynamicRoutes(): RouteInfo[] {
    return this.getRoutes().filter((route) => route.pattern !== "static");
  }

  /**
   * Get static routes
   */
  getStaticRoutes(): RouteInfo[] {
    return this.getRoutes().filter((route) => route.pattern === "static");
  }

  /**
   * Export results to a file
   */
  async exportToFile(
    filePath: string,
    format: OutputFormat = "json",
  ): Promise<void> {
    const fs = await import("fs/promises");
    const path = await import("path");

    const result = this.format(format);
    const content =
      typeof result === "string" ? result : JSON.stringify(result, null, 2);

    const fullPath = path.resolve(filePath);
    await fs.writeFile(fullPath, content, "utf-8");
  }

  /**
   * Merge an existing introspection JSON file with new metadata
   */
  async mergeWithJson(
    jsonFilePath: string,
    metadata: Record<string, RouteMetadata> | IntrospectionResult,
  ): Promise<IntrospectionResult> {
    const fs = await import("fs/promises");

    // Load existing JSON file
    const jsonContent = await fs.readFile(jsonFilePath, "utf-8");
    const existingResult: IntrospectionResult = JSON.parse(jsonContent);

    // Extract routes from existing result
    const existingRoutes = Array.isArray(existingResult.routes)
      ? existingResult.routes
      : this.flattenNestedRoutes(existingResult.routes);

    let mergedRoutes: RouteInfo[];

    // Check if metadata is a full IntrospectionResult or just metadata entries
    if (metadata && typeof metadata === "object" && "routes" in metadata) {
      // Full IntrospectionResult - merge route data
      const newResult = metadata as IntrospectionResult;
      const newRoutes = Array.isArray(newResult.routes)
        ? newResult.routes
        : this.flattenNestedRoutes(newResult.routes);

      // Merge routes by path
      const routeMap = new Map<string, RouteInfo>();

      // Add existing routes
      existingRoutes.forEach((route) => {
        routeMap.set(route.path, { ...route });
      });

      // Merge/override with new routes
      newRoutes.forEach((route) => {
        if (routeMap.has(route.path)) {
          routeMap.set(route.path, { ...routeMap.get(route.path)!, ...route });
        } else {
          routeMap.set(route.path, route);
        }
      });

      mergedRoutes = Array.from(routeMap.values());
    } else {
      // Just metadata - merge metadata into existing routes
      const metadataEntries = metadata as Record<string, RouteMetadata>;
      const { mergeRouteMetadata } = await import("./utils.js");
      mergedRoutes = mergeRouteMetadata(existingRoutes, metadataEntries);
    }

    // Return merged result
    return {
      ...existingResult,
      routes: mergedRoutes,
      metadata: {
        ...existingResult.metadata,
        mergedAt: new Date(),
        mergeSource: jsonFilePath,
      },
    };
  }

  /**
   * Flatten nested routes back to array format
   */
  private flattenNestedRoutes(nestedRoutes: Record<string, any>): RouteInfo[] {
    return routesToArray(nestedRoutes);
  }

  /**
   * Validate that the project path is a valid Next.js project
   */
  private async isValidProject(): Promise<boolean> {
    try {
      const fs = await import("fs/promises");
      await fs.access(this.projectPath);
      return await isNextJsProject(this.projectPath);
    } catch {
      return false;
    }
  }

  /**
   * Re-analyze the project (useful when files have changed)
   */
  async reanalyze(): Promise<ProjectInfo> {
    this.analyzed = false;
    this.routes = [];
    this.projectInfo = null;
    return await this.analyze();
  }
}
