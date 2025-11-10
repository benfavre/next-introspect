import {
  BaseAdapter,
  JsonFormatter,
  NextIntrospect,
  NextJsAdapter,
  ObjectFormatter
} from "./chunk-7MC7YOXI.js";
import {
  detectComponentType,
  detectRouterType,
  extractExports,
  formatRoutePath,
  getSpecialFileType,
  isNextJsProject,
  isSpecialNextJsFile,
  parseRouteSegment,
  readFileContent,
  traverseDirectory
} from "./chunk-FVTFQSOJ.js";
import {
  MarkdownFormatter
} from "./chunk-UCQBORK3.js";

// src/parsers/AppRouterParser.ts
import path from "path";
var AppRouterParser = class {
  /**
   * Parse App Router routes from a directory
   */
  static async parse(appDir, config) {
    const routes = [];
    try {
      const entries = await traverseDirectory(
        appDir,
        config.maxDepth,
        0,
        ["node_modules/**", ".next/**", "dist/**", "**/*.test.*", "**/*.spec.*"]
      );
      const routeGroups = this.groupFilesByRoute(entries, appDir);
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
  static groupFilesByRoute(entries, appDir) {
    const groups = /* @__PURE__ */ new Map();
    for (const entry of entries) {
      if (entry.isDirectory) {
        continue;
      }
      if (!this.isAppRouterFile(entry.name)) {
        continue;
      }
      const routePath = this.getRoutePathForFile(entry.relativePath, appDir);
      if (!groups.has(routePath)) {
        groups.set(routePath, []);
      }
      groups.get(routePath).push(entry);
    }
    return groups;
  }
  /**
   * Check if a file is part of App Router
   */
  static isAppRouterFile(filename) {
    return isSpecialNextJsFile(filename) || filename.endsWith(".tsx") || filename.endsWith(".jsx") || filename.endsWith(".js") || filename.endsWith(".ts");
  }
  /**
   * Get the route path for a file (its directory)
   */
  static getRoutePathForFile(relativePath, appDir) {
    const withoutApp = relativePath.replace(new RegExp(`^${appDir}/?`), "");
    const dirPath = path.dirname(withoutApp);
    if (dirPath === "." || dirPath === "") {
      return "/";
    }
    return `/${dirPath}`;
  }
  /**
   * Parse a route segment and its files
   */
  static async parseRouteSegment(routePath, files, config) {
    try {
      const segments = this.parseRoutePath(routePath);
      const routeProps = this.analyzeRouteSegments(segments);
      const specialFiles = await this.analyzeSpecialFiles(files, config);
      const appRouterData = {
        segment: path.basename(routePath) || "",
        isRouteGroup: segments.some((s) => s.isRouteGroup),
        isInterceptingRoute: segments.some((s) => s.isIntercepting),
        isParallelRoute: segments.some((s) => s.isParallel),
        specialFiles,
        componentTypes: {},
        exports: config.mode === "comprehensive" ? {} : void 0
      };
      if (config.mode === "comprehensive") {
        const componentAnalysis = await this.analyzeComponents(files);
        appRouterData.componentTypes = componentAnalysis.componentTypes;
        appRouterData.exports = componentAnalysis.exports;
      }
      const routeInfo = {
        path: routeProps.path,
        filePath: files[0]?.path || "",
        // Use first file as representative
        pattern: routeProps.pattern,
        dynamicSegments: routeProps.dynamicSegments,
        router: "app",
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
  static parseRoutePath(routePath) {
    if (routePath === "/") {
      return [];
    }
    const segments = routePath.slice(1).split("/");
    return segments.map((segment) => parseRouteSegment(segment));
  }
  /**
   * Analyze route segments to determine pattern and properties
   */
  static analyzeRouteSegments(segments) {
    const urlSegments = [];
    const dynamicSegments = [];
    let catchAllSegment;
    let hasOptionalCatchAll = false;
    for (const segment of segments) {
      if (segment.isRouteGroup || segment.isIntercepting || segment.isParallel) {
        continue;
      }
      urlSegments.push(segment);
      if (segment.isDynamic) {
        if (segment.isOptionalCatchAll) {
          hasOptionalCatchAll = true;
          catchAllSegment = segment.paramName;
        } else if (segment.isCatchAll) {
          catchAllSegment = segment.paramName;
        } else {
          dynamicSegments.push(segment.paramName);
        }
      }
    }
    let pattern = "static";
    if (hasOptionalCatchAll) {
      pattern = "optional-catch-all";
    } else if (catchAllSegment) {
      pattern = "catch-all";
    } else if (dynamicSegments.length > 0) {
      pattern = "dynamic";
    }
    return {
      path: formatRoutePath(urlSegments),
      pattern,
      dynamicSegments: dynamicSegments.length > 0 ? dynamicSegments : void 0,
      catchAllSegment
    };
  }
  /**
   * Analyze special files in a route segment
   */
  static async analyzeSpecialFiles(files, _config) {
    const specialFiles = {
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
        specialFiles[specialType] = true;
      }
    }
    return specialFiles;
  }
  /**
   * Analyze components for comprehensive mode
   */
  static async analyzeComponents(files) {
    const componentTypes = {};
    const exports = {};
    for (const file of files) {
      const specialType = getSpecialFileType(file.name);
      if (!specialType) {
        continue;
      }
      const content = await readFileContent(file.path);
      if (!content) {
        continue;
      }
      const componentType = detectComponentType(content);
      componentTypes[specialType] = componentType;
      if (specialType === "page" || specialType === "layout") {
        const fileExports = extractExports(content);
        if (fileExports.metadata) exports.metadata = true;
        if (fileExports.generateMetadata) exports.generateMetadata = true;
        if (fileExports.generateStaticParams) exports.generateStaticParams = true;
        if (fileExports.generateViewport) exports.generateViewport = true;
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
  static buildRouteHierarchy(routes) {
    return routes.filter((route) => route.appRouter).map((route) => route.appRouter);
  }
  /**
   * Get parent path of a route
   */
  static getParentPath(routePath) {
    if (routePath === "/") {
      return null;
    }
    const parts = routePath.split("/").filter(Boolean);
    if (parts.length <= 1) {
      return "/";
    }
    return `/${parts.slice(0, -1).join("/")}`;
  }
};

// src/parsers/PagesRouterParser.ts
var PagesRouterParser = class {
  /**
   * Parse Pages Router routes from a directory
   */
  static async parse(pagesDir, config) {
    const routes = [];
    try {
      const entries = await traverseDirectory(
        pagesDir,
        config.maxDepth,
        0,
        ["node_modules/**", ".next/**", "dist/**", "**/*.test.*", "**/*.spec.*"]
      );
      for (const entry of entries) {
        if (entry.isDirectory) {
          continue;
        }
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
  static isPagesRouterFile(filename) {
    if (filename.endsWith(".d.ts") || filename.includes(".test.") || filename.includes(".spec.")) {
      return false;
    }
    const validExtensions = [".tsx", ".jsx", ".js", ".ts"];
    return validExtensions.some((ext) => filename.endsWith(ext));
  }
  /**
   * Parse a page file and extract route information
   */
  static async parsePageFile(entry, pagesDir, config) {
    try {
      const routePath = this.getRoutePathFromFile(entry.relativePath, pagesDir);
      const isApiRoute = routePath.startsWith("/api/");
      const specialPageInfo = this.getSpecialPageInfo(entry.name);
      const segments = this.parseRoutePath(routePath);
      const routeProps = this.analyzeRouteSegments(segments);
      const pagesRouterData = {
        isApiRoute,
        isSpecialPage: !!specialPageInfo,
        specialPageType: specialPageInfo?.type,
        componentType: config.mode === "comprehensive" ? void 0 : "unknown"
      };
      if (config.mode === "comprehensive") {
        const content = await readFileContent(entry.path);
        if (content) {
          pagesRouterData.componentType = detectComponentType(content);
          pagesRouterData.dataFetching = this.extractDataFetchingMethods(content);
        }
      }
      const routeInfo = {
        path: routeProps.path,
        filePath: entry.path,
        pattern: routeProps.pattern,
        dynamicSegments: routeProps.dynamicSegments,
        catchAllSegment: routeProps.catchAllSegment,
        router: "pages",
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
  static getRoutePathFromFile(relativePath, pagesDir) {
    const withoutPages = relativePath.replace(new RegExp(`^${pagesDir}/?`), "");
    const withoutExtension = withoutPages.replace(/\.(tsx|jsx|js|ts)$/, "");
    if (withoutExtension === "index") {
      return "/";
    }
    const withIndexRemoved = withoutExtension.replace(/\/index$/, "");
    return `/${withIndexRemoved}`;
  }
  /**
   * Parse a route path into segments
   */
  static parseRoutePath(routePath) {
    if (routePath === "/") {
      return [];
    }
    const segments = routePath.slice(1).split("/");
    return segments.map((segment) => parseRouteSegment(segment));
  }
  /**
   * Analyze route segments to determine pattern and properties
   */
  static analyzeRouteSegments(segments) {
    const urlSegments = [];
    const dynamicSegments = [];
    let catchAllSegment;
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
          dynamicSegments.push(segment.paramName);
        }
      }
    }
    let pattern = "static";
    if (hasOptionalCatchAll) {
      pattern = "optional-catch-all";
    } else if (catchAllSegment) {
      pattern = "catch-all";
    } else if (dynamicSegments.length > 0) {
      pattern = "dynamic";
    }
    return {
      path: formatRoutePath(urlSegments),
      pattern,
      dynamicSegments: dynamicSegments.length > 0 ? dynamicSegments : void 0,
      catchAllSegment
    };
  }
  /**
   * Get information about special pages
   */
  static getSpecialPageInfo(filename) {
    const specialPages = {
      "_app.tsx": "app",
      "_app.jsx": "app",
      "_app.js": "app",
      "_app.ts": "app",
      "_document.tsx": "document",
      "_document.jsx": "document",
      "_document.js": "document",
      "_document.ts": "document",
      "_error.tsx": "error",
      "_error.jsx": "error",
      "_error.js": "error",
      "_error.ts": "error",
      "404.tsx": "404",
      "404.jsx": "404",
      "404.js": "404",
      "404.ts": "404",
      "500.tsx": "500",
      "500.jsx": "500",
      "500.js": "500",
      "500.ts": "500"
    };
    const type = specialPages[filename];
    return type ? { type } : null;
  }
  /**
   * Extract data fetching methods from file content
   */
  static extractDataFetchingMethods(content) {
    const exports = extractExports(content);
    const dataFetching = {};
    if (exports.getStaticProps) dataFetching.getStaticProps = true;
    if (exports.getServerSideProps) dataFetching.getServerSideProps = true;
    if (exports.getStaticPaths) dataFetching.getStaticPaths = true;
    return Object.keys(dataFetching).length > 0 ? dataFetching : void 0;
  }
  /**
   * Group API routes by their endpoints
   */
  static groupApiRoutes(routes) {
    const apiGroups = /* @__PURE__ */ new Map();
    for (const route of routes) {
      if (!route.pagesRouter?.isApiRoute) {
        continue;
      }
      const endpoint = route.path.replace("/api", "");
      const baseEndpoint = endpoint.split("/").slice(0, 2).join("/") || "/";
      if (!apiGroups.has(baseEndpoint)) {
        apiGroups.set(baseEndpoint, []);
      }
      apiGroups.get(baseEndpoint).push(route);
    }
    return apiGroups;
  }
  /**
   * Get special pages from routes
   */
  static getSpecialPages(routes) {
    return routes.filter((route) => route.pagesRouter?.isSpecialPage);
  }
  /**
   * Categorize routes by type
   */
  static categorizeRoutes(routes) {
    const categories = {
      static: [],
      dynamic: [],
      api: [],
      special: []
    };
    for (const route of routes) {
      if (route.pagesRouter?.isSpecialPage) {
        categories.special.push(route);
      } else if (route.pagesRouter?.isApiRoute) {
        categories.api.push(route);
      } else if (route.pattern === "static") {
        categories.static.push(route);
      } else {
        categories.dynamic.push(route);
      }
    }
    return categories;
  }
};

// src/parsers/ConfigParser.ts
import path2 from "path";
var ConfigParser = class {
  /**
   * Parse a Next.js configuration file
   */
  static async parse(configPath) {
    const content = await readFileContent(configPath);
    if (!content) {
      return void 0;
    }
    const config = {};
    config.basePath = this.extractStringProperty(content, "basePath");
    config.distDir = this.extractStringProperty(content, "distDir");
    config.trailingSlash = this.extractBooleanProperty(content, "trailingSlash");
    config.images = this.extractImagesConfig(content);
    config.env = this.extractEnvConfig(content);
    config.experimental = this.extractExperimentalConfig(content);
    config.hasMiddleware = await this.checkMiddlewareExists(path2.dirname(configPath));
    return config;
  }
  /**
   * Extract a string property from config content
   */
  static extractStringProperty(content, property) {
    const regex = new RegExp(`${property}\\s*:\\s*['"]([^'"]+)['"]`, "g");
    const match = regex.exec(content);
    return match ? match[1] : void 0;
  }
  /**
   * Extract a boolean property from config content
   */
  static extractBooleanProperty(content, property) {
    const regex = new RegExp(`${property}\\s*:\\s*(true|false)`, "g");
    const match = regex.exec(content);
    return match ? match[1] === "true" : void 0;
  }
  /**
   * Extract images configuration
   */
  static extractImagesConfig(content) {
    const imagesSection = this.extractObjectProperty(content, "images");
    if (!imagesSection) {
      return void 0;
    }
    const images = {};
    const domainsMatch = imagesSection.match(/domains\s*:\s*\[([^\]]*)\]/);
    if (domainsMatch) {
      images.domains = domainsMatch[1].split(",").map((d) => d.trim().replace(/['"]/g, "")).filter((d) => d);
    }
    return images;
  }
  /**
   * Extract environment variables configuration
   */
  static extractEnvConfig(content) {
    const envSection = this.extractObjectProperty(content, "env");
    if (!envSection) {
      return void 0;
    }
    const env = {};
    const stringMatches = envSection.matchAll(/(\w+)\s*:\s*['"]([^'"]+)['"]/g);
    for (const match of stringMatches) {
      env[match[1]] = match[2];
    }
    return Object.keys(env).length > 0 ? env : void 0;
  }
  /**
   * Extract experimental features configuration
   */
  static extractExperimentalConfig(content) {
    const experimentalSection = this.extractObjectProperty(content, "experimental");
    if (!experimentalSection) {
      return void 0;
    }
    const experimental = {};
    const booleanFeatures = [
      "serverComponentsExternalPackages",
      "optimizeCss",
      "serverMinification",
      "webVitalsAttribution"
    ];
    for (const feature of booleanFeatures) {
      const value = this.extractBooleanProperty(experimentalSection, feature);
      if (value !== void 0) {
        experimental[feature] = value;
      }
    }
    return Object.keys(experimental).length > 0 ? experimental : void 0;
  }
  /**
   * Extract an object property from config content
   */
  static extractObjectProperty(content, property) {
    const regex = new RegExp(`${property}\\s*:\\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})`, "g");
    const match = regex.exec(content);
    return match ? match[1] : void 0;
  }
  /**
   * Check if middleware file exists in the project
   */
  static async checkMiddlewareExists(projectRoot) {
    const fs = await import("fs/promises");
    const possibleMiddlewarePaths = [
      path2.join(projectRoot, "middleware.js"),
      path2.join(projectRoot, "middleware.ts"),
      path2.join(projectRoot, "middleware.mjs"),
      path2.join(projectRoot, "middleware.mts"),
      path2.join(projectRoot, "src", "middleware.js"),
      path2.join(projectRoot, "src", "middleware.ts"),
      path2.join(projectRoot, "src", "middleware.mjs"),
      path2.join(projectRoot, "src", "middleware.mts")
    ];
    for (const middlewarePath of possibleMiddlewarePaths) {
      try {
        await fs.access(middlewarePath);
        return true;
      } catch {
      }
    }
    return false;
  }
  /**
   * Get all possible config file paths for a project
   */
  static getConfigFilePaths(projectPath) {
    return [
      path2.join(projectPath, "next.config.js"),
      path2.join(projectPath, "next.config.mjs"),
      path2.join(projectPath, "next.config.ts"),
      path2.join(projectPath, "next.config.mts"),
      path2.join(projectPath, "next.config.cjs")
    ];
  }
  /**
   * Find and parse the first available config file
   */
  static async findAndParseConfig(projectPath) {
    const configPaths = this.getConfigFilePaths(projectPath);
    for (const configPath of configPaths) {
      try {
        const fs = await import("fs/promises");
        await fs.access(configPath);
        return await this.parse(configPath);
      } catch {
      }
    }
    return void 0;
  }
  /**
   * Validate if a config object has any meaningful data
   */
  static isValidConfig(config) {
    if (!config) {
      return false;
    }
    return !!(config.basePath || config.distDir || config.trailingSlash !== void 0 || config.images || config.env || config.experimental || config.hasMiddleware);
  }
};
export {
  AppRouterParser,
  BaseAdapter,
  ConfigParser,
  JsonFormatter,
  MarkdownFormatter,
  NextIntrospect,
  NextJsAdapter,
  ObjectFormatter,
  PagesRouterParser,
  detectComponentType,
  detectRouterType,
  formatRoutePath,
  isNextJsProject,
  parseRouteSegment
};
