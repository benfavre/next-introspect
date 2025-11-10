/**
 * Output formats supported by the introspection tool
 */
export type OutputFormat = "object" | "json" | "markdown" | "typescript";

/**
 * Metadata for routes (titles, descriptions, etc.)
 */
export interface RouteMetadata {
  /** Human-readable title for the route */
  title?: string;

  /** Description of the route's purpose */
  description?: string;

  /** Additional custom metadata */
  [key: string]: any;
}

/**
 * Detail levels for introspection analysis
 */
export type OutputMode = "basic" | "detailed" | "comprehensive";

/**
 * Router types available in Next.js projects
 */
export type RouterType = "app" | "pages" | "both";

/**
 * Component type detection
 */
export type ComponentType = "server" | "client" | "unknown";

/**
 * Route pattern types
 */
export type RoutePattern =
  | "static"
  | "dynamic"
  | "catch-all"
  | "optional-catch-all";

/**
 * Configuration options for the introspection process
 */
export interface IntrospectionOptions {
  /** Detail level of analysis */
  mode?: OutputMode;

  /** File patterns to include in analysis */
  include?: string[];

  /** File patterns to exclude from analysis */
  exclude?: string[];

  /** Maximum depth for directory traversal */
  maxDepth?: number;

  /** Custom ignore patterns (similar to .gitignore) */
  ignorePatterns?: string[];

  /** Whether to follow symbolic links */
  followSymlinks?: boolean;

  /** Path display options */
  pathDisplay?: {
    /** How to display paths: 'absolute', 'relative-to-project', 'relative-to-app', 'relative-to-pages', 'strip-prefix' */
    style?:
      | "absolute"
      | "relative-to-project"
      | "relative-to-app"
      | "relative-to-pages"
      | "strip-prefix";

    /** Custom prefix to strip from paths when using 'strip-prefix' style */
    stripPrefix?: string;

    /** Whether to show file paths or route paths (default: route paths) */
    showFilePaths?: boolean;
  };

  /** Package.json display options */
  packageDisplay?: {
    /** Whether to include full package.json details or just summary */
    includeFullDetails?: boolean;

    /** Whether to include scripts section */
    includeScripts?: boolean;

    /** Whether to include dependencies/devDependencies */
    includeDependencies?: boolean;
  };

  /** Output format options */
  outputFormat?: {
    /** Whether to output routes in nested hierarchical structure */
    nested?: boolean;

    /** Whether to include empty path segments in nested structure */
    includeEmptySegments?: boolean;

    /** Array of field names to exclude from route objects */
    excludeFields?: string[];

    /** Array of prefixes to strip from route paths */
    stripPrefixes?: string[];
  };

  /** Metadata file options */
  metadata?: {
    /** Path to metadata file (JSON or TOML) */
    file?: string;

    /** Metadata entries keyed by route path */
    entries?: Record<string, RouteMetadata>;
  };
}

/**
 * Information about the detected framework and project
 */
export interface ProjectInfo {
  /** Framework name (e.g., 'nextjs') */
  framework: string;

  /** Framework version */
  version: string;

  /** Router type(s) detected */
  router: RouterType;

  /** Project root directory */
  rootDir: string;

  /** Next.js configuration */
  config?: NextConfig;

  /** Package.json information */
  packageInfo?: PackageInfo;

  /** Detected source directories */
  sourceDirs: {
    app?: string;
    pages?: string;
    api?: string;
  };
}

/**
 * Next.js configuration information
 */
export interface NextConfig {
  /** Base path for the application */
  basePath?: string;

  /** Distribution directory */
  distDir?: string;

  /** Whether to add trailing slashes to URLs */
  trailingSlash?: boolean;

  /** Image domains configuration */
  images?: {
    domains?: string[];
    remotePatterns?: any[];
  };

  /** Environment variables */
  env?: Record<string, string>;

  /** Redirect rules */
  redirects?: any[];

  /** Rewrite rules */
  rewrites?: any[];

  /** Headers configuration */
  headers?: any[];

  /** Experimental features */
  experimental?: Record<string, any>;

  /** Webpack configuration */
  webpack?: any;

  /** Has middleware file */
  hasMiddleware?: boolean;
}

/**
 * Package.json information
 */
export interface PackageInfo {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

/**
 * Base route information
 */
export interface BaseRoute {
  /** Route path (URL path) */
  path: string;

  /** File system path to the route file */
  filePath: string;

  /** Route pattern type */
  pattern: RoutePattern;

  /** Dynamic segments in the route */
  dynamicSegments?: string[];

  /** Catch-all segment (if applicable) */
  catchAllSegment?: string;
}

/**
 * App Router specific route information
 */
export interface AppRouterRoute extends BaseRoute {
  /** Route segment name */
  segment: string;

  /** Whether this is a route group (parentheses) */
  isRouteGroup: boolean;

  /** Whether this is an intercepting route */
  isInterceptingRoute: boolean;

  /** Whether this is a parallel route */
  isParallelRoute: boolean;

  /** Special files present in this route segment */
  specialFiles: {
    page?: boolean;
    layout?: boolean;
    loading?: boolean;
    error?: boolean;
    notFound?: boolean;
    template?: boolean;
    default?: boolean;
    route?: boolean; // API route handler
  };

  /** Component types for each special file */
  componentTypes: {
    page?: ComponentType;
    layout?: ComponentType;
    loading?: ComponentType;
    error?: ComponentType;
    notFound?: ComponentType;
    template?: ComponentType;
    default?: ComponentType;
  };

  /** Exported functions and metadata (comprehensive mode only) */
  exports?: {
    metadata?: boolean;
    generateMetadata?: boolean;
    generateStaticParams?: boolean;
    generateViewport?: boolean;
    revalidate?: number;
  };

  /** Child routes */
  children?: AppRouterRoute[];
}

/**
 * Pages Router specific route information
 */
export interface PagesRouterRoute extends BaseRoute {
  /** Whether this is an API route */
  isApiRoute: boolean;

  /** Data fetching methods (comprehensive mode only) */
  dataFetching?: {
    getStaticProps?: boolean;
    getServerSideProps?: boolean;
    getStaticPaths?: boolean;
  };

  /** Whether it's a special Next.js page (_app, _document, _error, etc.) */
  isSpecialPage?: boolean;

  /** Special page type */
  specialPageType?: "app" | "document" | "error" | "404" | "500";

  /** Component type */
  componentType?: ComponentType;
}

/**
 * Generic route information (union type)
 */
export interface RouteInfo extends BaseRoute {
  /** Router type this route belongs to */
  router: "app" | "pages";

  /** App Router specific data */
  appRouter?: Omit<AppRouterRoute, keyof BaseRoute>;

  /** Pages Router specific data */
  pagesRouter?: Omit<PagesRouterRoute, keyof BaseRoute>;

  /** Metadata from external file */
  metadata?: RouteMetadata;
}

/**
 * Introspection results
 */
export interface IntrospectionResult {
  /** Project information */
  project: ProjectInfo;

  /** All detected routes */
  routes: RouteInfo[] | Record<string, any>;

  /** Analysis metadata */
  metadata: {
    /** When the analysis was performed */
    analyzedAt: Date;

    /** Analysis duration in milliseconds */
    duration: number;

    /** Total files processed */
    filesProcessed: number;

    /** Mode used for analysis */
    mode: OutputMode;

    /** When the result was merged (for merged results) */
    mergedAt?: Date;

    /** Source file for merged results */
    mergeSource?: string;
  };
}

/**
 * Adapter interface for different frameworks
 */
export interface FrameworkAdapter {
  /** Framework name */
  name: string;

  /** Detect if this framework is present in the project */
  detect(projectPath: string): Promise<boolean>;

  /** Get project information */
  getProjectInfo(projectPath: string): Promise<ProjectInfo>;

  /** Get routes for this framework */
  getRoutes(projectPath: string, mode: OutputMode): Promise<RouteInfo[]>;
}

/**
 * Parser configuration
 */
export interface ParserConfig {
  /** Root directory to parse */
  rootDir: string;

  /** Analysis mode */
  mode: OutputMode;

  /** Include patterns */
  include?: string[];

  /** Exclude patterns */
  exclude?: string[];

  /** Maximum depth */
  maxDepth?: number;
}

/**
 * Formatter interface
 */
export interface Formatter {
  /** Format the introspection result */
  format(result: IntrospectionResult): string | object;

  /** Get the supported format type */
  getFormatType(): OutputFormat;
}

/**
 * File system entry information
 */
export interface FileEntry {
  /** Full path to the file/directory */
  path: string;

  /** Relative path from project root */
  relativePath: string;

  /** Whether this is a directory */
  isDirectory: boolean;

  /** File extension (without dot) */
  extension?: string;

  /** File name */
  name: string;

  /** Parent directory path */
  parentPath: string;
}

/**
 * Route segment information for parsing
 */
export interface RouteSegment {
  /** Segment name */
  name: string;

  /** Whether it's dynamic [param] */
  isDynamic: boolean;

  /** Whether it's catch-all [...param] */
  isCatchAll: boolean;

  /** Whether it's optional catch-all [[...param]] */
  isOptionalCatchAll: boolean;

  /** Whether it's a route group (groupName) */
  isRouteGroup: boolean;

  /** Whether it's an intercepting route */
  isIntercepting: boolean;

  /** Whether it's a parallel route */
  isParallel: boolean;

  /** Parameter name (for dynamic segments) */
  paramName?: string;
}
