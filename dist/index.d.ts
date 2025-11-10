/**
 * Output formats supported by the introspection tool
 */
type OutputFormat = "object" | "json" | "markdown" | "typescript";
/**
 * Metadata for routes (titles, descriptions, etc.)
 */
interface RouteMetadata {
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
type OutputMode = "basic" | "detailed" | "comprehensive";
/**
 * Router types available in Next.js projects
 */
type RouterType = "app" | "pages" | "both";
/**
 * Component type detection
 */
type ComponentType = "server" | "client" | "unknown";
/**
 * Route pattern types
 */
type RoutePattern = "static" | "dynamic" | "catch-all" | "optional-catch-all";
/**
 * Configuration options for the introspection process
 */
interface IntrospectionOptions {
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
        style?: "absolute" | "relative-to-project" | "relative-to-app" | "relative-to-pages" | "strip-prefix";
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
interface ProjectInfo {
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
interface NextConfig {
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
interface PackageInfo {
    name?: string;
    version?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
}
/**
 * Base route information
 */
interface BaseRoute {
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
interface AppRouterRoute extends BaseRoute {
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
        route?: boolean;
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
interface PagesRouterRoute extends BaseRoute {
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
interface RouteInfo extends BaseRoute {
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
interface IntrospectionResult {
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
interface FrameworkAdapter {
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
interface ParserConfig {
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
interface Formatter {
    /** Format the introspection result */
    format(result: IntrospectionResult): string | object;
    /** Get the supported format type */
    getFormatType(): OutputFormat;
}
/**
 * File system entry information
 */
interface FileEntry {
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
interface RouteSegment {
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

/**
 * Main Next.js Introspection Class
 *
 * Analyzes Next.js projects and provides detailed routing information
 * in multiple output formats.
 */
declare class NextIntrospect {
    private projectPath;
    private options;
    private projectInfo;
    private routes;
    private analyzed;
    private formatters;
    /**
     * Create a new NextIntrospect instance
     */
    constructor(projectPath: string, options?: IntrospectionOptions);
    /**
     * Analyze the Next.js project
     */
    analyze(): Promise<ProjectInfo>;
    /**
     * Get all detected routes
     */
    getRoutes(): RouteInfo[];
    /**
     * Get the complete introspection result
     */
    getResult(): IntrospectionResult;
    /**
     * Format the results using the specified formatter
     */
    format(format: OutputFormat, metadata?: Record<string, {
        title?: string;
        description?: string;
    }>): string | object;
    /**
     * Set the analysis mode
     */
    setMode(mode: OutputMode): void;
    /**
     * Get the current analysis mode
     */
    getMode(): OutputMode;
    /**
     * Get project information
     */
    getProjectInfo(): ProjectInfo | null;
    /**
     * Check if the project has been analyzed
     */
    isAnalyzed(): boolean;
    /**
     * Get analysis options
     */
    getOptions(): IntrospectionOptions;
    /**
     * Format route paths according to display options
     */
    private formatRoutePaths;
    /**
     * Update analysis options
     */
    updateOptions(newOptions: Partial<IntrospectionOptions>): void;
    /**
     * Get routes filtered by router type
     */
    getRoutesByRouter(router: "app" | "pages"): RouteInfo[];
    /**
     * Get API routes (Pages Router only)
     */
    getApiRoutes(): RouteInfo[];
    /**
     * Get special pages (Pages Router only)
     */
    getSpecialPages(): RouteInfo[];
    /**
     * Get dynamic routes
     */
    getDynamicRoutes(): RouteInfo[];
    /**
     * Get static routes
     */
    getStaticRoutes(): RouteInfo[];
    /**
     * Export results to a file
     */
    exportToFile(filePath: string, format?: OutputFormat, options?: {
        metadata?: Record<string, {
            title?: string;
            description?: string;
        }>;
    }): Promise<void>;
    /**
     * Merge an existing introspection JSON file with new metadata
     */
    mergeWithJson(jsonFilePath: string, metadata: Record<string, RouteMetadata> | IntrospectionResult): Promise<IntrospectionResult>;
    /**
     * Flatten nested routes back to array format
     */
    private flattenNestedRoutes;
    /**
     * Validate that the project path is a valid Next.js project
     */
    private isValidProject;
    /**
     * Re-analyze the project (useful when files have changed)
     */
    reanalyze(): Promise<ProjectInfo>;
}

/**
 * Abstract base class for framework adapters
 *
 * Provides common functionality and defines the interface that all
 * framework adapters must implement.
 */
declare abstract class BaseAdapter implements FrameworkAdapter {
    /** Framework name */
    readonly name: string;
    constructor(name: string);
    /**
     * Detect if this framework is present in the project
     */
    abstract detect(projectPath: string): Promise<boolean>;
    /**
     * Get project information specific to this framework
     */
    abstract getProjectInfo(projectPath: string): Promise<ProjectInfo>;
    /**
     * Get routes for this framework
     */
    abstract getRoutes(projectPath: string, mode: OutputMode): Promise<RouteInfo[]>;
    /**
     * Create a parser configuration with default values
     */
    protected createParserConfig(rootDir: string, mode: OutputMode, options?: {
        include?: string[];
        exclude?: string[];
        maxDepth?: number;
    }): ParserConfig;
    /**
     * Get default exclude patterns for file traversal
     */
    protected getDefaultExcludes(): string[];
    /**
     * Validate that a project path exists and is readable
     */
    protected validateProjectPath(projectPath: string): Promise<void>;
    /**
     * Get framework version from package.json
     */
    protected getFrameworkVersion(projectPath: string, packageName: string): Promise<string | undefined>;
    /**
     * Check if a directory exists
     */
    protected directoryExists(dirPath: string): Promise<boolean>;
    /**
     * Check if a file exists
     */
    protected fileExists(filePath: string): Promise<boolean>;
    /**
     * Get common project information
     */
    protected getBaseProjectInfo(projectPath: string, framework: string, version?: string): Promise<Partial<ProjectInfo>>;
    /**
     * Normalize file paths for consistent handling across platforms
     */
    protected normalizePath(filePath: string): Promise<string>;
    /**
     * Get relative path from project root
     */
    protected getRelativePath(projectRoot: string, filePath: string): Promise<string>;
}

/**
 * Next.js framework adapter
 *
 * Detects Next.js projects and analyzes their routing structure
 * using both App Router and Pages Router parsers.
 */
declare class NextJsAdapter extends BaseAdapter {
    constructor();
    /**
     * Detect if this is a Next.js project
     */
    detect(projectPath: string): Promise<boolean>;
    /**
     * Get Next.js project information
     */
    getProjectInfo(projectPath: string, packageDisplayOptions?: IntrospectionOptions["packageDisplay"]): Promise<ProjectInfo>;
    /**
     * Get all routes for the Next.js project
     */
    getRoutes(projectPath: string, mode: OutputMode): Promise<RouteInfo[]>;
    /**
     * Parse Next.js configuration files
     */
    private parseNextConfig;
    /**
     * Get App Router routes
     */
    private getAppRouterRoutes;
    /**
     * Get Pages Router routes
     */
    private getPagesRouterRoutes;
    /**
     * Check if a file is a special App Router file
     */
    private isAppRouterSpecialFile;
    /**
     * Check if a file is a valid Pages Router file
     */
    private isPagesRouterFile;
    /**
     * Convert App Router file path to route path
     */
    private convertFilePathToRoute;
    /**
     * Convert Pages Router file path to route path
     */
    private convertPagesPathToRoute;
}

/**
 * Parser for Next.js App Router (app/ directory)
 *
 * Analyzes the App Router structure and extracts detailed routing information
 * including special files, dynamic routes, route groups, and metadata.
 */
declare class AppRouterParser {
    /**
     * Parse App Router routes from a directory
     */
    static parse(appDir: string, config: ParserConfig): Promise<RouteInfo[]>;
    /**
     * Group files by their route segments
     */
    private static groupFilesByRoute;
    /**
     * Check if a file is part of App Router
     */
    private static isAppRouterFile;
    /**
     * Get the route path for a file (its directory)
     */
    private static getRoutePathForFile;
    /**
     * Parse a route segment and its files
     */
    private static parseRouteSegment;
    /**
     * Parse a route path into segments
     */
    private static parseRoutePath;
    /**
     * Analyze route segments to determine pattern and properties
     */
    private static analyzeRouteSegments;
    /**
     * Analyze special files in a route segment
     */
    private static analyzeSpecialFiles;
    /**
     * Analyze components for comprehensive mode
     */
    private static analyzeComponents;
    /**
     * Build hierarchical route structure
     * TODO: Implement hierarchical route building
     */
    static buildRouteHierarchy(routes: RouteInfo[]): any[];
    /**
     * Get parent path of a route
     */
    private static getParentPath;
}

/**
 * Parser for Next.js Pages Router (pages/ directory)
 *
 * Analyzes the Pages Router structure and extracts routing information
 * including dynamic routes, API routes, special pages, and data fetching methods.
 */
declare class PagesRouterParser {
    /**
     * Parse Pages Router routes from a directory
     */
    static parse(pagesDir: string, config: ParserConfig): Promise<RouteInfo[]>;
    /**
     * Check if a file is a valid Pages Router file
     */
    private static isPagesRouterFile;
    /**
     * Parse a page file and extract route information
     */
    private static parsePageFile;
    /**
     * Convert a file path to a route path
     */
    private static getRoutePathFromFile;
    /**
     * Parse a route path into segments
     */
    private static parseRoutePath;
    /**
     * Analyze route segments to determine pattern and properties
     */
    private static analyzeRouteSegments;
    /**
     * Get information about special pages
     */
    private static getSpecialPageInfo;
    /**
     * Extract data fetching methods from file content
     */
    private static extractDataFetchingMethods;
    /**
     * Group API routes by their endpoints
     */
    static groupApiRoutes(routes: RouteInfo[]): Map<string, RouteInfo[]>;
    /**
     * Get special pages from routes
     */
    static getSpecialPages(routes: RouteInfo[]): RouteInfo[];
    /**
     * Categorize routes by type
     */
    static categorizeRoutes(routes: RouteInfo[]): {
        static: RouteInfo[];
        dynamic: RouteInfo[];
        api: RouteInfo[];
        special: RouteInfo[];
    };
}

/**
 * Parser for Next.js configuration files
 *
 * Safely extracts configuration information from next.config.js/mjs/ts files
 * without executing potentially unsafe code.
 */
declare class ConfigParser {
    /**
     * Parse a Next.js configuration file
     */
    static parse(configPath: string): Promise<NextConfig | undefined>;
    /**
     * Extract a string property from config content
     */
    private static extractStringProperty;
    /**
     * Extract a boolean property from config content
     */
    private static extractBooleanProperty;
    /**
     * Extract images configuration
     */
    private static extractImagesConfig;
    /**
     * Extract environment variables configuration
     */
    private static extractEnvConfig;
    /**
     * Extract experimental features configuration
     */
    private static extractExperimentalConfig;
    /**
     * Extract an object property from config content
     */
    private static extractObjectProperty;
    /**
     * Check if middleware file exists in the project
     */
    private static checkMiddlewareExists;
    /**
     * Get all possible config file paths for a project
     */
    static getConfigFilePaths(projectPath: string): string[];
    /**
     * Find and parse the first available config file
     */
    static findAndParseConfig(projectPath: string): Promise<NextConfig | undefined>;
    /**
     * Validate if a config object has any meaningful data
     */
    static isValidConfig(config: NextConfig | undefined): config is NextConfig;
}

/**
 * Object Formatter - Returns the raw JavaScript object
 *
 * This formatter provides the full TypeScript-typed result object
 * without any transformation, suitable for programmatic use.
 */
declare class ObjectFormatter implements Formatter {
    /**
     * Format the introspection result as a JavaScript object
     */
    format(result: IntrospectionResult): IntrospectionResult;
    /**
     * Get the output format type
     */
    getFormatType(): OutputFormat;
}

/**
 * JSON Formatter - Serializes results to JSON format
 *
 * Provides pretty-printed JSON output with configurable indentation.
 */
declare class JsonFormatter implements Formatter {
    private indent;
    constructor(indent?: number);
    /**
     * Format the introspection result as JSON
     */
    format(result: IntrospectionResult): string;
    /**
     * Get the output format type
     */
    getFormatType(): OutputFormat;
    /**
     * Set the indentation level
     */
    setIndent(indent: number): void;
    /**
     * Get the current indentation level
     */
    getIndent(): number;
}

/**
 * Markdown Formatter - Generates documentation in Markdown format
 *
 * Creates comprehensive documentation with sections for project info,
 * routing details, and hierarchical route structures.
 */
declare class MarkdownFormatter implements Formatter {
    /**
     * Format the introspection result as Markdown
     */
    format(result: IntrospectionResult): string;
    /**
     * Get the output format type
     */
    getFormatType(): OutputFormat;
    /**
     * Format router type for display
     */
    private formatRouterType;
    /**
     * Add configuration section
     */
    private addConfigSection;
    /**
     * Get route statistics
     */
    private getRouteStatistics;
    /**
     * Add App Router routes section
     */
    private addAppRouterRoutes;
    /**
     * Add Pages Router routes section
     */
    private addPagesRouterRoutes;
    /**
     * Add API routes section
     */
    private addApiRoutes;
    /**
     * Convert nested routes back to flat array
     */
    private routesToArray;
    /**
     * Format route pattern for display
     */
    private formatRoutePattern;
}

/**
 * Check if a directory is a Next.js project
 */
declare function isNextJsProject(projectPath: string): Promise<boolean>;
/**
 * Parse a route segment and extract its properties
 */
declare function parseRouteSegment(segment: string): RouteSegment;
/**
 * Convert file system segments to URL path segments
 */
declare function formatRoutePath(segments: RouteSegment[]): string;
/**
 * Detect if a component is a client or server component
 */
declare function detectComponentType(fileContent: string): ComponentType;
/**
 * Get router type from project structure
 */
declare function detectRouterType(projectPath: string): RouterType;

export { AppRouterParser, type AppRouterRoute, BaseAdapter, type BaseRoute, type ComponentType, ConfigParser, type FileEntry, type Formatter, type FrameworkAdapter, type IntrospectionOptions, type IntrospectionResult, JsonFormatter, MarkdownFormatter, type NextConfig, NextIntrospect, NextJsAdapter, ObjectFormatter, type OutputFormat, type OutputMode, type PackageInfo, PagesRouterParser, type PagesRouterRoute, type ParserConfig, type ProjectInfo, type RouteInfo, type RoutePattern, type RouteSegment, type RouterType, detectComponentType, detectRouterType, formatRoutePath, isNextJsProject, parseRouteSegment };
