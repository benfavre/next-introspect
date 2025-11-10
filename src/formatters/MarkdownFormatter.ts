import type {
  Formatter,
  IntrospectionResult,
  OutputFormat,
  RouteInfo,
} from "../types.js";

/**
 * Markdown Formatter - Generates documentation in Markdown format
 *
 * Creates comprehensive documentation with sections for project info,
 * routing details, and hierarchical route structures.
 */
export class MarkdownFormatter implements Formatter {
  /**
   * Format the introspection result as Markdown
   */
  format(result: IntrospectionResult): string {
    const lines: string[] = [];

    // Header
    lines.push("# Next.js Project Introspection");
    lines.push("");

    // Project information
    lines.push("## Project Information");
    lines.push("");
    lines.push(
      `- **Framework**: ${result.project.framework} ${result.project.version}`,
    );
    lines.push(
      `- **Router Type**: ${this.formatRouterType(result.project.router)}`,
    );
    lines.push(`- **Root Directory**: \`${result.project.rootDir}\``);

    if (result.project.sourceDirs) {
      lines.push(
        `- **App Directory**: \`${result.project.sourceDirs.app || "N/A"}\``,
      );
      lines.push(
        `- **Pages Directory**: \`${result.project.sourceDirs.pages || "N/A"}\``,
      );
    }

    lines.push(`- **Analysis Mode**: ${result.metadata.mode}`);
    lines.push(`- **Files Processed**: ${result.metadata.filesProcessed}`);
    lines.push(`- **Analysis Duration**: ${result.metadata.duration}ms`);
    lines.push(
      `- **Analyzed At**: ${result.metadata.analyzedAt.toISOString()}`,
    );
    lines.push("");

    // Configuration
    if (result.project.config) {
      lines.push("## Configuration");
      lines.push("");
      this.addConfigSection(lines, result.project.config);
      lines.push("");
    }

    // Convert routes to array if nested
    const routesArray = this.routesToArray(result.routes);

    // Routes overview
    const routeStats = this.getRouteStatistics(routesArray);
    lines.push("## Routes Overview");
    lines.push("");
    lines.push(`- **Total Routes**: ${routesArray.length}`);
    lines.push(`- **App Router Routes**: ${routeStats.appRouter}`);
    lines.push(`- **Pages Router Routes**: ${routeStats.pagesRouter}`);
    lines.push(`- **API Routes**: ${routeStats.apiRoutes}`);
    lines.push(`- **Dynamic Routes**: ${routeStats.dynamicRoutes}`);
    lines.push("");

    // App Router Routes
    if (routeStats.appRouter > 0) {
      lines.push("## App Router Routes");
      lines.push("");
      this.addAppRouterRoutes(lines, routesArray);
      lines.push("");
    }

    // Pages Router Routes
    if (routeStats.pagesRouter > 0) {
      lines.push("## Pages Router Routes");
      lines.push("");
      this.addPagesRouterRoutes(lines, routesArray);
      lines.push("");
    }

    // API Routes
    if (routeStats.apiRoutes > 0) {
      lines.push("## API Routes");
      lines.push("");
      this.addApiRoutes(lines, routesArray);
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Get the output format type
   */
  getFormatType(): OutputFormat {
    return "markdown";
  }

  /**
   * Format router type for display
   */
  private formatRouterType(router: string): string {
    switch (router) {
      case "app":
        return "App Router";
      case "pages":
        return "Pages Router";
      case "both":
        return "App Router + Pages Router";
      default:
        return router;
    }
  }

  /**
   * Add configuration section
   */
  private addConfigSection(lines: string[], config: any): void {
    if (config.basePath) {
      lines.push(`- **Base Path**: \`${config.basePath}\``);
    }
    if (config.distDir) {
      lines.push(`- **Distribution Directory**: \`${config.distDir}\``);
    }
    if (config.trailingSlash !== undefined) {
      lines.push(
        `- **Trailing Slash**: ${config.trailingSlash ? "Enabled" : "Disabled"}`,
      );
    }
    if (config.images?.domains?.length) {
      lines.push(
        `- **Image Domains**: ${config.images.domains.map((d: string) => `\`${d}\``).join(", ")}`,
      );
    }
    if (config.hasMiddleware) {
      lines.push("- **Middleware**: Present");
    }
    if (config.experimental) {
      lines.push("- **Experimental Features**: Enabled");
    }
  }

  /**
   * Get route statistics
   */
  private getRouteStatistics(routes: RouteInfo[]): {
    appRouter: number;
    pagesRouter: number;
    apiRoutes: number;
    dynamicRoutes: number;
  } {
    let appRouter = 0;
    let pagesRouter = 0;
    let apiRoutes = 0;
    let dynamicRoutes = 0;

    for (const route of routes) {
      if (route.router === "app") {
        appRouter++;
      } else if (route.router === "pages") {
        pagesRouter++;
        if (route.pagesRouter?.isApiRoute) {
          apiRoutes++;
        }
      }

      if (route.pattern !== "static") {
        dynamicRoutes++;
      }
    }

    return { appRouter, pagesRouter, apiRoutes, dynamicRoutes };
  }

  /**
   * Add App Router routes section
   */
  private addAppRouterRoutes(lines: string[], routes: RouteInfo[]): void {
    const appRoutes = routes.filter((r) => r.router === "app");

    for (const route of appRoutes) {
      lines.push(`### \`${route.path}\``);
      lines.push("");

      // Route properties
      if (route.dynamicSegments?.length) {
        lines.push(
          `- **Dynamic Segments**: ${route.dynamicSegments.map((s) => `\`${s}\``).join(", ")}`,
        );
      }
      if (route.catchAllSegment) {
        lines.push(`- **Catch-all Segment**: \`${route.catchAllSegment}\``);
      }
      lines.push(`- **Pattern**: ${this.formatRoutePattern(route.pattern)}`);

      // Special files
      if (route.appRouter?.specialFiles) {
        const specialFiles = Object.entries(route.appRouter.specialFiles)
          .filter(([_, present]) => present)
          .map(([file, _]) => `\`${file}\``);

        if (specialFiles.length > 0) {
          lines.push(`- **Special Files**: ${specialFiles.join(", ")}`);
        }
      }

      // Route group/intercepting/parallel
      if (route.appRouter?.isRouteGroup) {
        lines.push("- **Route Group**: Yes");
      }
      if (route.appRouter?.isInterceptingRoute) {
        lines.push("- **Intercepting Route**: Yes");
      }
      if (route.appRouter?.isParallelRoute) {
        lines.push("- **Parallel Route**: Yes");
      }

      // Component types and exports (comprehensive mode)
      if (route.appRouter?.componentTypes) {
        const componentInfo = Object.entries(route.appRouter.componentTypes)
          .filter(([_, type]) => type !== "unknown")
          .map(([file, type]) => `${file}: ${type}`);

        if (componentInfo.length > 0) {
          lines.push(`- **Components**: ${componentInfo.join(", ")}`);
        }
      }

      if (route.appRouter?.exports) {
        const exports = Object.entries(route.appRouter.exports)
          .filter(([_, present]) => present)
          .map(([exp, _]) => `\`${exp}\``);

        if (exports.length > 0) {
          lines.push(`- **Exports**: ${exports.join(", ")}`);
        }
      }

      // Metadata
      if (route.metadata) {
        if (route.metadata.title) {
          lines.push(`- **Title**: ${route.metadata.title}`);
        }
        if (route.metadata.description) {
          lines.push(`- **Description**: ${route.metadata.description}`);
        }

        // Custom metadata fields
        const customFields = Object.entries(route.metadata)
          .filter(([key]) => !["title", "description"].includes(key))
          .map(([key, value]) => `${key}: ${value}`);

        if (customFields.length > 0) {
          lines.push(`- **Metadata**: ${customFields.join(", ")}`);
        }
      }

      lines.push("");
    }
  }

  /**
   * Add Pages Router routes section
   */
  private addPagesRouterRoutes(lines: string[], routes: RouteInfo[]): void {
    const pagesRoutes = routes.filter(
      (r) =>
        r.router === "pages" &&
        !r.pagesRouter?.isApiRoute &&
        !r.pagesRouter?.isSpecialPage,
    );

    for (const route of pagesRoutes) {
      lines.push(`### \`${route.path}\``);
      lines.push("");

      if (route.dynamicSegments?.length) {
        lines.push(
          `- **Dynamic Segments**: ${route.dynamicSegments.map((s) => `\`${s}\``).join(", ")}`,
        );
      }
      if (route.catchAllSegment) {
        lines.push(`- **Catch-all Segment**: \`${route.catchAllSegment}\``);
      }
      lines.push(`- **Pattern**: ${this.formatRoutePattern(route.pattern)}`);

      if (
        route.pagesRouter?.componentType &&
        route.pagesRouter.componentType !== "unknown"
      ) {
        lines.push(`- **Component Type**: ${route.pagesRouter.componentType}`);
      }

      if (route.pagesRouter?.dataFetching) {
        const methods = Object.entries(route.pagesRouter.dataFetching)
          .filter(([_, present]) => present)
          .map(([method, _]) => `\`${method}\``);

        if (methods.length > 0) {
          lines.push(`- **Data Fetching**: ${methods.join(", ")}`);
        }
      }

      // Metadata
      if (route.metadata) {
        if (route.metadata.title) {
          lines.push(`- **Title**: ${route.metadata.title}`);
        }
        if (route.metadata.description) {
          lines.push(`- **Description**: ${route.metadata.description}`);
        }

        // Custom metadata fields
        const customFields = Object.entries(route.metadata)
          .filter(([key]) => !["title", "description"].includes(key))
          .map(([key, value]) => `${key}: ${value}`);

        if (customFields.length > 0) {
          lines.push(`- **Metadata**: ${customFields.join(", ")}`);
        }
      }

      lines.push("");
    }
  }

  /**
   * Add API routes section
   */
  private addApiRoutes(lines: string[], routes: RouteInfo[]): void {
    const apiRoutes = routes.filter((r) => r.pagesRouter?.isApiRoute);

    for (const route of apiRoutes) {
      lines.push(`### \`${route.path}\``);
      lines.push("");

      if (route.dynamicSegments?.length) {
        lines.push(
          `- **Dynamic Segments**: ${route.dynamicSegments.map((s) => `\`${s}\``).join(", ")}`,
        );
      }
      lines.push(`- **Pattern**: ${this.formatRoutePattern(route.pattern)}`);

      if (
        route.pagesRouter?.componentType &&
        route.pagesRouter.componentType !== "unknown"
      ) {
        lines.push(`- **Component Type**: ${route.pagesRouter.componentType}`);
      }

      // Metadata
      if (route.metadata) {
        if (route.metadata.title) {
          lines.push(`- **Title**: ${route.metadata.title}`);
        }
        if (route.metadata.description) {
          lines.push(`- **Description**: ${route.metadata.description}`);
        }

        // Custom metadata fields
        const customFields = Object.entries(route.metadata)
          .filter(([key]) => !["title", "description"].includes(key))
          .map(([key, value]) => `${key}: ${value}`);

        if (customFields.length > 0) {
          lines.push(`- **Metadata**: ${customFields.join(", ")}`);
        }
      }

      lines.push("");
    }
  }

  /**
   * Convert nested routes back to flat array
   */
  private routesToArray(
    routes: RouteInfo[] | Record<string, any>,
  ): RouteInfo[] {
    if (Array.isArray(routes)) {
      return routes;
    }

    // Convert nested structure back to flat array
    const result: RouteInfo[] = [];

    function traverse(obj: Record<string, any>, currentPath: string[] = []) {
      for (const [key, value] of Object.entries(obj)) {
        const newPath = [...currentPath, key];

        if (value && typeof value === "object" && !Array.isArray(value)) {
          // Check if this is a route object (has router property)
          if (value.router) {
            // Restore the path property
            const path = newPath.filter((segment) => segment !== "").join("/");
            result.push({
              ...value,
              path: path ? `/${path}` : "/",
            });
          } else {
            // Continue traversing
            traverse(value, newPath);
          }
        }
      }
    }

    traverse(routes);
    return result;
  }

  /**
   * Format route pattern for display
   */
  private formatRoutePattern(pattern: string): string {
    switch (pattern) {
      case "static":
        return "Static";
      case "dynamic":
        return "Dynamic";
      case "catch-all":
        return "Catch-all";
      case "optional-catch-all":
        return "Optional Catch-all";
      default:
        return pattern;
    }
  }
}
