import type {
  PagesRouterRoute,
  RouteInfo,
  RouteSegment,
  ComponentType,
  ParserConfig
} from '../types.js';
import {
  traverseDirectory,
  parseRouteSegment,
  formatRoutePath,
  detectComponentType,
  extractExports,
  readFileContent
} from '../utils.js';

/**
 * Parser for Next.js Pages Router (pages/ directory)
 *
 * Analyzes the Pages Router structure and extracts routing information
 * including dynamic routes, API routes, special pages, and data fetching methods.
 */
export class PagesRouterParser {
  /**
   * Parse Pages Router routes from a directory
   */
  static async parse(
    pagesDir: string,
    config: ParserConfig
  ): Promise<RouteInfo[]> {
    const routes: RouteInfo[] = [];

    try {
      // Get all files in the pages directory
      const entries = await traverseDirectory(
        pagesDir,
        config.maxDepth,
        0,
        ['node_modules/**', '.next/**', 'dist/**', '**/*.test.*', '**/*.spec.*']
      );

      // Process each file
      for (const entry of entries) {
        if (entry.isDirectory) {
          continue;
        }

        // Skip non-page files
        if (!this.isPagesRouterFile(entry.name)) {
          continue;
        }

        const route = await this.parsePageFile(entry, pagesDir, config);
        if (route) {
          routes.push(route);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Warning: Could not parse Pages Router directory ${pagesDir}:`, errorMessage);
    }

    return routes;
  }

  /**
   * Check if a file is a valid Pages Router file
   */
  private static isPagesRouterFile(filename: string): boolean {
    // Exclude TypeScript declaration files and test files
    if (filename.endsWith('.d.ts') || filename.includes('.test.') || filename.includes('.spec.')) {
      return false;
    }

    // Include common Next.js file extensions
    const validExtensions = ['.tsx', '.jsx', '.js', '.ts'];
    return validExtensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Parse a page file and extract route information
   */
  private static async parsePageFile(
    entry: { path: string; relativePath: string; name: string; isDirectory: boolean },
    pagesDir: string,
    config: ParserConfig
  ): Promise<RouteInfo | null> {
    try {
      // Get the route path from the file path
      const routePath = this.getRoutePathFromFile(entry.relativePath, pagesDir);

      // Check if it's an API route
      const isApiRoute = routePath.startsWith('/api/');

      // Check if it's a special page
      const specialPageInfo = this.getSpecialPageInfo(entry.name);

      // Parse route segments to determine pattern
      const segments = this.parseRoutePath(routePath);
      const routeProps = this.analyzeRouteSegments(segments);

      // Build Pages Router route info (excluding BaseRoute properties)
      const pagesRouterData: {
        isApiRoute: boolean;
        isSpecialPage?: boolean;
        specialPageType?: PagesRouterRoute['specialPageType'];
        componentType?: ComponentType;
        dataFetching?: PagesRouterRoute['dataFetching'];
      } = {
        isApiRoute,
        isSpecialPage: !!specialPageInfo,
        specialPageType: specialPageInfo?.type,
        componentType: config.mode === 'comprehensive' ? undefined : 'unknown'
      };

      // Add comprehensive analysis
      if (config.mode === 'comprehensive') {
        const content = await readFileContent(entry.path);
        if (content) {
          pagesRouterData.componentType = detectComponentType(content);
          pagesRouterData.dataFetching = this.extractDataFetchingMethods(content);
        }
      }

      // Build the route info
      const routeInfo: RouteInfo = {
        path: routeProps.path,
        filePath: entry.path,
        pattern: routeProps.pattern,
        dynamicSegments: routeProps.dynamicSegments,
        catchAllSegment: routeProps.catchAllSegment,
        router: 'pages',
        pagesRouter: pagesRouterData
      };

      return routeInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Warning: Could not parse page file ${entry.path}:`, errorMessage);
      return null;
    }
  }

  /**
   * Convert a file path to a route path
   */
  private static getRoutePathFromFile(relativePath: string, pagesDir: string): string {
    // Remove the pages directory prefix
    const withoutPages = relativePath.replace(new RegExp(`^${pagesDir}/?`), '');

    // Remove file extension
    const withoutExtension = withoutPages.replace(/\.(tsx|jsx|js|ts)$/, '');

    // Handle index files
    if (withoutExtension === 'index') {
      return '/';
    }

    // Handle nested index files
    const withIndexRemoved = withoutExtension.replace(/\/index$/, '');

    return `/${withIndexRemoved}`;
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
   * Get information about special pages
   */
  private static getSpecialPageInfo(filename: string): { type: PagesRouterRoute['specialPageType'] } | null {
    const specialPages: Record<string, PagesRouterRoute['specialPageType']> = {
      '_app.tsx': 'app',
      '_app.jsx': 'app',
      '_app.js': 'app',
      '_app.ts': 'app',
      '_document.tsx': 'document',
      '_document.jsx': 'document',
      '_document.js': 'document',
      '_document.ts': 'document',
      '_error.tsx': 'error',
      '_error.jsx': 'error',
      '_error.js': 'error',
      '_error.ts': 'error',
      '404.tsx': '404',
      '404.jsx': '404',
      '404.js': '404',
      '404.ts': '404',
      '500.tsx': '500',
      '500.jsx': '500',
      '500.js': '500',
      '500.ts': '500'
    };

    const type = specialPages[filename];
    return type ? { type } : null;
  }

  /**
   * Extract data fetching methods from file content
   */
  private static extractDataFetchingMethods(content: string): PagesRouterRoute['dataFetching'] {
    const exports = extractExports(content);

    const dataFetching: PagesRouterRoute['dataFetching'] = {};

    if (exports.getStaticProps) dataFetching.getStaticProps = true;
    if (exports.getServerSideProps) dataFetching.getServerSideProps = true;
    if (exports.getStaticPaths) dataFetching.getStaticPaths = true;

    return Object.keys(dataFetching).length > 0 ? dataFetching : undefined;
  }

  /**
   * Group API routes by their endpoints
   */
  static groupApiRoutes(routes: RouteInfo[]): Map<string, RouteInfo[]> {
    const apiGroups = new Map<string, RouteInfo[]>();

    for (const route of routes) {
      if (!route.pagesRouter?.isApiRoute) {
        continue;
      }

      // Group by HTTP method or general endpoint
      const endpoint = route.path.replace('/api', '');
      const baseEndpoint = endpoint.split('/').slice(0, 2).join('/') || '/';

      if (!apiGroups.has(baseEndpoint)) {
        apiGroups.set(baseEndpoint, []);
      }

      apiGroups.get(baseEndpoint)!.push(route);
    }

    return apiGroups;
  }

  /**
   * Get special pages from routes
   */
  static getSpecialPages(routes: RouteInfo[]): RouteInfo[] {
    return routes.filter(route => route.pagesRouter?.isSpecialPage);
  }

  /**
   * Categorize routes by type
   */
  static categorizeRoutes(routes: RouteInfo[]): {
    static: RouteInfo[];
    dynamic: RouteInfo[];
    api: RouteInfo[];
    special: RouteInfo[];
  } {
    const categories = {
      static: [] as RouteInfo[],
      dynamic: [] as RouteInfo[],
      api: [] as RouteInfo[],
      special: [] as RouteInfo[]
    };

    for (const route of routes) {
      if (route.pagesRouter?.isSpecialPage) {
        categories.special.push(route);
      } else if (route.pagesRouter?.isApiRoute) {
        categories.api.push(route);
      } else if (route.pattern === 'static') {
        categories.static.push(route);
      } else {
        categories.dynamic.push(route);
      }
    }

    return categories;
  }
}
