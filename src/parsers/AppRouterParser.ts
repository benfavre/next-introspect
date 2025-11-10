import path from 'path';
import type {
  AppRouterRoute,
  RouteInfo,
  RouteSegment,
  ParserConfig
} from '../types.js';
import {
  traverseDirectory,
  parseRouteSegment,
  formatRoutePath,
  detectComponentType,
  extractExports,
  readFileContent,
  getSpecialFileType,
  isSpecialNextJsFile
} from '../utils.js';

/**
 * Parser for Next.js App Router (app/ directory)
 *
 * Analyzes the App Router structure and extracts detailed routing information
 * including special files, dynamic routes, route groups, and metadata.
 */
export class AppRouterParser {
  /**
   * Parse App Router routes from a directory
   */
  static async parse(
    appDir: string,
    config: ParserConfig
  ): Promise<RouteInfo[]> {
    const routes: RouteInfo[] = [];

    try {
      // Get all files in the app directory
      const entries = await traverseDirectory(
        appDir,
        config.maxDepth,
        0,
        ['node_modules/**', '.next/**', 'dist/**', '**/*.test.*', '**/*.spec.*']
      );

      // Group files by their directory (route segment)
      const routeGroups = this.groupFilesByRoute(entries, appDir);

      // Process each route group
      for (const [routePath, files] of routeGroups.entries()) {
        const route = await this.parseRouteSegment(routePath, files, config);
        if (route) {
          routes.push(route);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Warning: Could not parse App Router directory ${appDir}:`, errorMessage);
    }

    return routes;
  }

  /**
   * Group files by their route segments
   */
  private static groupFilesByRoute(
    entries: Array<{ path: string; relativePath: string; name: string; isDirectory: boolean }>,
    appDir: string
  ): Map<string, Array<{ path: string; relativePath: string; name: string; isDirectory: boolean }>> {
    const groups = new Map<string, typeof entries>();

    for (const entry of entries) {
      if (entry.isDirectory) {
        continue;
      }

      // Only process files that could be part of App Router
      if (!this.isAppRouterFile(entry.name)) {
        continue;
      }

      // Get the route path (directory containing the file)
      const routePath = this.getRoutePathForFile(entry.relativePath, appDir);

      if (!groups.has(routePath)) {
        groups.set(routePath, []);
      }

      groups.get(routePath)!.push(entry);
    }

    return groups;
  }

  /**
   * Check if a file is part of App Router
   */
  private static isAppRouterFile(filename: string): boolean {
    return isSpecialNextJsFile(filename) || filename.endsWith('.tsx') || filename.endsWith('.jsx') ||
           filename.endsWith('.js') || filename.endsWith('.ts');
  }

  /**
   * Get the route path for a file (its directory)
   */
  private static getRoutePathForFile(relativePath: string, appDir: string): string {
    // Remove the app directory prefix
    const withoutApp = relativePath.replace(new RegExp(`^${appDir}/?`), '');

    // Remove the filename to get the directory
    const dirPath = path.dirname(withoutApp);

    // If it's in the root of app, return '/'
    if (dirPath === '.' || dirPath === '') {
      return '/';
    }

    return `/${dirPath}`;
  }

  /**
   * Parse a route segment and its files
   */
  private static async parseRouteSegment(
    routePath: string,
    files: Array<{ path: string; relativePath: string; name: string; isDirectory: boolean }>,
    config: ParserConfig
  ): Promise<RouteInfo | null> {
    try {
      // Parse route segments
      const segments = this.parseRoutePath(routePath);

      // Determine route pattern and properties
      const routeProps = this.analyzeRouteSegments(segments);

      // Analyze special files
      const specialFiles = await this.analyzeSpecialFiles(files, config);

      // Build the App Router route info (excluding BaseRoute properties)
      const appRouterData: {
        segment: string;
        isRouteGroup: boolean;
        isInterceptingRoute: boolean;
        isParallelRoute: boolean;
        specialFiles: AppRouterRoute['specialFiles'];
        componentTypes: AppRouterRoute['componentTypes'];
        exports?: AppRouterRoute['exports'];
        children?: AppRouterRoute[];
      } = {
        segment: path.basename(routePath) || '',
        isRouteGroup: segments.some(s => s.isRouteGroup),
        isInterceptingRoute: segments.some(s => s.isIntercepting),
        isParallelRoute: segments.some(s => s.isParallel),
        specialFiles,
        componentTypes: {},
        exports: config.mode === 'comprehensive' ? {} : undefined
      };

      // Add component types and exports for comprehensive mode
      if (config.mode === 'comprehensive') {
        const componentAnalysis = await this.analyzeComponents(files);
        appRouterData.componentTypes = componentAnalysis.componentTypes;
        appRouterData.exports = componentAnalysis.exports;
      }

      // Build the route info
      const routeInfo: RouteInfo = {
        path: routeProps.path,
        filePath: files[0]?.path || '', // Use first file as representative
        pattern: routeProps.pattern,
        dynamicSegments: routeProps.dynamicSegments,
        router: 'app',
        appRouter: appRouterData
      };

      return routeInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Warning: Could not parse route segment ${routePath}:`, errorMessage);
      return null;
    }
  }

  /**
   * Parse a route path into segments
   */
  private static parseRoutePath(routePath: string): RouteSegment[] {
    if (routePath === '/') {
      return [];
    }

    const segments = routePath.slice(1).split('/'); // Remove leading slash
    return segments.map(segment => parseRouteSegment(segment));
  }

  /**
   * Analyze route segments to determine pattern and properties
   */
  private static analyzeRouteSegments(segments: RouteSegment[]): {
    path: string;
    pattern: 'static' | 'dynamic' | 'catch-all' | 'optional-catch-all';
    dynamicSegments?: string[];
    catchAllSegment?: string;
  } {
    const urlSegments: RouteSegment[] = [];
    const dynamicSegments: string[] = [];
    let catchAllSegment: string | undefined;
    let hasOptionalCatchAll = false;

    for (const segment of segments) {
      if (segment.isRouteGroup || segment.isIntercepting || segment.isParallel) {
        continue; // Skip these in URL generation
      }

      urlSegments.push(segment);

      if (segment.isDynamic) {
        if (segment.isOptionalCatchAll) {
          hasOptionalCatchAll = true;
          catchAllSegment = segment.paramName;
        } else if (segment.isCatchAll) {
          catchAllSegment = segment.paramName;
        } else {
          dynamicSegments.push(segment.paramName!);
        }
      }
    }

    // Determine pattern
    let pattern: 'static' | 'dynamic' | 'catch-all' | 'optional-catch-all' = 'static';
    if (hasOptionalCatchAll) {
      pattern = 'optional-catch-all';
    } else if (catchAllSegment) {
      pattern = 'catch-all';
    } else if (dynamicSegments.length > 0) {
      pattern = 'dynamic';
    }

    return {
      path: formatRoutePath(urlSegments),
      pattern,
      dynamicSegments: dynamicSegments.length > 0 ? dynamicSegments : undefined,
      catchAllSegment
    };
  }

  /**
   * Analyze special files in a route segment
   */
  private static async analyzeSpecialFiles(
    files: Array<{ path: string; relativePath: string; name: string; isDirectory: boolean }>,
    _config: ParserConfig
  ): Promise<AppRouterRoute['specialFiles']> {
    const specialFiles: AppRouterRoute['specialFiles'] = {
      page: false,
      layout: false,
      loading: false,
      error: false,
      notFound: false,
      template: false,
      default: false,
      route: false
    };

    for (const file of files) {
      const specialType = getSpecialFileType(file.name);
      if (specialType && specialType in specialFiles) {
        (specialFiles as any)[specialType] = true;
      }
    }

    return specialFiles;
  }

  /**
   * Analyze components for comprehensive mode
   */
  private static async analyzeComponents(
    files: Array<{ path: string; relativePath: string; name: string; isDirectory: boolean }>
  ): Promise<{
    componentTypes: AppRouterRoute['componentTypes'];
    exports: AppRouterRoute['exports'];
  }> {
    const componentTypes: AppRouterRoute['componentTypes'] = {};
    const exports: AppRouterRoute['exports'] = {};

    for (const file of files) {
      const specialType = getSpecialFileType(file.name);
      if (!specialType) {
        continue;
      }

      const content = await readFileContent(file.path);
      if (!content) {
        continue;
      }

      // Detect component type
      const componentType = detectComponentType(content);
      componentTypes[specialType as keyof typeof componentTypes] = componentType;

      // Extract exports for special files
      if (specialType === 'page' || specialType === 'layout') {
        const fileExports = extractExports(content);

        if (fileExports.metadata) exports.metadata = true;
        if (fileExports.generateMetadata) exports.generateMetadata = true;
        if (fileExports.generateStaticParams) exports.generateStaticParams = true;
        if (fileExports.generateViewport) exports.generateViewport = true;

        // Check for revalidate export (number)
        const revalidateMatch = content.match(/export\s+(?:const\s+)?revalidate\s*=\s*(\d+)/);
        if (revalidateMatch) {
          exports.revalidate = parseInt(revalidateMatch[1]);
        }
      }
    }

    return { componentTypes, exports };
  }

  /**
   * Build hierarchical route structure
   * TODO: Implement hierarchical route building
   */
  static buildRouteHierarchy(routes: RouteInfo[]): any[] {
    // TODO: Implement proper hierarchical route building
    // For now, return routes without hierarchy
    return routes
      .filter(route => route.appRouter)
      .map(route => route.appRouter);
  }

  /**
   * Get parent path of a route
   */
  private static getParentPath(routePath: string): string | null {
    if (routePath === '/') {
      return null;
    }

    const parts = routePath.split('/').filter(Boolean);
    if (parts.length <= 1) {
      return '/';
    }

    return `/${parts.slice(0, -1).join('/')}`;
  }
}
