import {
  detectRouterType,
  filterExcludedFields,
  formatPathForDisplay,
  getPackageInfo,
  isNextJsProject,
  mergeRouteMetadata,
  parseMetadataFile,
  routesToArray,
  routesToNested,
  traverseDirectory
} from "./chunk-FVTFQSOJ.js";
import {
  MarkdownFormatter
} from "./chunk-UCQBORK3.js";

// src/adapters/BaseAdapter.ts
var BaseAdapter = class {
  /** Framework name */
  name;
  constructor(name) {
    this.name = name;
  }
  /**
   * Create a parser configuration with default values
   */
  createParserConfig(rootDir, mode, options) {
    return {
      rootDir,
      mode,
      include: options?.include || ["**/*"],
      exclude: options?.exclude || this.getDefaultExcludes(),
      maxDepth: options?.maxDepth || 10
    };
  }
  /**
   * Get default exclude patterns for file traversal
   */
  getDefaultExcludes() {
    return [
      "node_modules/**",
      ".git/**",
      ".next/**",
      "dist/**",
      "build/**",
      ".vercel/**",
      "coverage/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.d.ts",
      ".DS_Store",
      "Thumbs.db"
    ];
  }
  /**
   * Validate that a project path exists and is readable
   */
  async validateProjectPath(projectPath) {
    const fs = await import("fs/promises");
    try {
      const stats = await fs.stat(projectPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path ${projectPath} is not a directory`);
      }
    } catch (_error) {
      if (_error && typeof _error === "object" && "code" in _error && _error.code === "ENOENT") {
        throw new Error(`Project path ${projectPath} does not exist`);
      }
      const errorMessage = _error instanceof Error ? _error.message : String(_error);
      throw new Error(`Cannot access project path ${projectPath}: ${errorMessage}`);
    }
  }
  /**
   * Get framework version from package.json
   */
  async getFrameworkVersion(projectPath, packageName) {
    const fs = await import("fs/promises");
    const path3 = await import("path");
    try {
      const packageJsonPath = path3.join(projectPath, "package.json");
      const packageJson = await fs.readFile(packageJsonPath, "utf-8");
      const packageData = JSON.parse(packageJson);
      return packageData.dependencies?.[packageName] || packageData.devDependencies?.[packageName];
    } catch (_error) {
      return void 0;
    }
  }
  /**
   * Check if a directory exists
   */
  async directoryExists(dirPath) {
    const fs = await import("fs/promises");
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch (_error) {
      return false;
    }
  }
  /**
   * Check if a file exists
   */
  async fileExists(filePath) {
    const fs = await import("fs/promises");
    try {
      const stats = await fs.stat(filePath);
      return stats.isFile();
    } catch (_error) {
      return false;
    }
  }
  /**
   * Get common project information
   */
  async getBaseProjectInfo(projectPath, framework, version) {
    const fs = await import("fs/promises");
    const path3 = await import("path");
    let packageInfo;
    try {
      const packageJsonPath = path3.join(projectPath, "package.json");
      const packageJson = await fs.readFile(packageJsonPath, "utf-8");
      packageInfo = JSON.parse(packageJson);
    } catch (_error) {
    }
    return {
      framework,
      version: version || "unknown",
      rootDir: projectPath,
      packageInfo
    };
  }
  /**
   * Normalize file paths for consistent handling across platforms
   */
  async normalizePath(filePath) {
    const path3 = await import("path");
    return path3.resolve(filePath).replace(/\\/g, "/");
  }
  /**
   * Get relative path from project root
   */
  async getRelativePath(projectRoot, filePath) {
    const path3 = await import("path");
    return path3.relative(projectRoot, filePath).replace(/\\/g, "/");
  }
};

// src/adapters/NextJsAdapter.ts
import path from "path";
var NextJsAdapter = class extends BaseAdapter {
  constructor() {
    super("nextjs");
  }
  /**
   * Detect if this is a Next.js project
   */
  async detect(projectPath) {
    return await isNextJsProject(projectPath);
  }
  /**
   * Get Next.js project information
   */
  async getProjectInfo(projectPath, packageDisplayOptions) {
    await this.validateProjectPath(projectPath);
    const packageInfo = await getPackageInfo(
      projectPath,
      packageDisplayOptions
    );
    const nextVersion = packageInfo?.dependencies?.["next"] || packageInfo?.devDependencies?.["next"];
    const router = detectRouterType(projectPath);
    const config = await this.parseNextConfig(projectPath);
    const sourceDirs = {};
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
      rootDir: await this.normalizePath(projectPath),
      config,
      packageInfo,
      sourceDirs
    };
  }
  /**
   * Get all routes for the Next.js project
   */
  async getRoutes(projectPath, mode) {
    const projectInfo = await this.getProjectInfo(projectPath);
    const routes = [];
    if (projectInfo.router === "app" || projectInfo.router === "both") {
      const appRoutes = await this.getAppRouterRoutes(projectPath, mode);
      routes.push(...appRoutes);
    }
    if (projectInfo.router === "pages" || projectInfo.router === "both") {
      const pagesRoutes = await this.getPagesRouterRoutes(projectPath, mode);
      routes.push(...pagesRoutes);
    }
    return routes;
  }
  /**
   * Parse Next.js configuration files
   */
  async parseNextConfig(projectPath) {
    const configFiles = [
      "next.config.js",
      "next.config.mjs",
      "next.config.ts",
      "next.config.mts",
      "next.config.cjs"
    ];
    for (const configFile of configFiles) {
      const configPath = path.join(projectPath, configFile);
      if (await this.fileExists(configPath)) {
        try {
          return {
            hasMiddleware: await this.fileExists(
              path.join(projectPath, "middleware.js")
            ) || await this.fileExists(
              path.join(projectPath, "middleware.ts")
            ) || await this.fileExists(
              path.join(projectPath, "src/middleware.js")
            ) || await this.fileExists(
              path.join(projectPath, "src/middleware.ts")
            )
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(
            `Warning: Could not parse Next.js config ${configFile}:`,
            errorMessage
          );
        }
      }
    }
    return void 0;
  }
  /**
   * Get App Router routes
   */
  async getAppRouterRoutes(projectPath, _mode) {
    const routes = [];
    let appDir = null;
    if (await this.directoryExists(path.join(projectPath, "app"))) {
      appDir = path.join(projectPath, "app");
    } else if (await this.directoryExists(path.join(projectPath, "src", "app"))) {
      appDir = path.join(projectPath, "src", "app");
    }
    if (!appDir) {
      return routes;
    }
    try {
      const entries = await traverseDirectory(appDir, 10, 0, [
        "node_modules/**",
        ".next/**",
        "**/*.test.*",
        "**/*.spec.*"
      ]);
      for (const entry of entries) {
        if (entry.isDirectory) {
          continue;
        }
        if (this.isAppRouterSpecialFile(entry.name)) {
          const relativeToApp = path.relative(appDir, entry.path);
          const routePath = this.convertFilePathToRoute(relativeToApp);
          routes.push({
            path: routePath,
            filePath: entry.path,
            pattern: "static",
            // Will be determined by parser
            router: "app"
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(
        "Warning: Could not analyze App Router routes:",
        errorMessage
      );
    }
    return routes;
  }
  /**
   * Get Pages Router routes
   */
  async getPagesRouterRoutes(projectPath, _mode) {
    const routes = [];
    let pagesDir = null;
    if (await this.directoryExists(path.join(projectPath, "pages"))) {
      pagesDir = path.join(projectPath, "pages");
    } else if (await this.directoryExists(path.join(projectPath, "src", "pages"))) {
      pagesDir = path.join(projectPath, "src", "pages");
    }
    if (!pagesDir) {
      return routes;
    }
    try {
      const entries = await traverseDirectory(pagesDir, 10, 0, [
        "node_modules/**",
        ".next/**",
        "**/*.test.*",
        "**/*.spec.*"
      ]);
      for (const entry of entries) {
        if (entry.isDirectory) {
          continue;
        }
        if (this.isPagesRouterFile(entry.name)) {
          const relativeToPages = path.relative(pagesDir, entry.path);
          const routePath = this.convertPagesPathToRoute(relativeToPages);
          routes.push({
            path: routePath,
            filePath: entry.path,
            pattern: "static",
            // Will be determined by parser
            router: "pages",
            pagesRouter: {
              isApiRoute: routePath.startsWith("/api/"),
              isSpecialPage: false
            }
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(
        "Warning: Could not analyze Pages Router routes:",
        errorMessage
      );
    }
    return routes;
  }
  /**
   * Check if a file is a special App Router file
   */
  isAppRouterSpecialFile(filename) {
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
      "route.js"
    ];
    return specialFiles.includes(filename);
  }
  /**
   * Check if a file is a valid Pages Router file
   */
  isPagesRouterFile(filename) {
    if (filename.endsWith(".d.ts") || filename.includes(".test.") || filename.includes(".spec.")) {
      return false;
    }
    const validExtensions = [".tsx", ".jsx", ".js", ".ts"];
    return validExtensions.some((ext) => filename.endsWith(ext));
  }
  /**
   * Convert App Router file path to route path
   */
  convertFilePathToRoute(relativePath) {
    let routePath = relativePath.replace(
      /\/(page|route|layout|loading|error|not-found|template|default)(\..*)?$/,
      ""
    );
    const segments = routePath.split("/").filter((segment) => segment.length > 0);
    const filteredSegments = segments.filter(
      (segment) => !(segment.startsWith("(") && segment.endsWith(")"))
    );
    const finalRoutePath = filteredSegments.join("/");
    if (finalRoutePath === "") {
      return "/";
    }
    return `/${finalRoutePath}`;
  }
  /**
   * Convert Pages Router file path to route path
   */
  convertPagesPathToRoute(relativePath) {
    let routePath = relativePath.replace(/^pages\//, "").replace(/^src\/pages\//, "");
    routePath = routePath.replace(/\..*$/, "");
    if (routePath.endsWith("/index")) {
      routePath = routePath.slice(0, -6);
    } else if (routePath === "index") {
      routePath = "";
    }
    if (routePath === "") {
      return "/";
    }
    return `/${routePath}`;
  }
};

// src/formatters/ObjectFormatter.ts
var ObjectFormatter = class {
  /**
   * Format the introspection result as a JavaScript object
   */
  format(result) {
    return result;
  }
  /**
   * Get the output format type
   */
  getFormatType() {
    return "object";
  }
};

// src/formatters/JsonFormatter.ts
var JsonFormatter = class {
  indent;
  constructor(indent = 2) {
    this.indent = indent;
  }
  /**
   * Format the introspection result as JSON
   */
  format(result) {
    return JSON.stringify(result, null, this.indent);
  }
  /**
   * Get the output format type
   */
  getFormatType() {
    return "json";
  }
  /**
   * Set the indentation level
   */
  setIndent(indent) {
    this.indent = Math.max(0, indent);
  }
  /**
   * Get the current indentation level
   */
  getIndent() {
    return this.indent;
  }
};

// src/NextIntrospect.ts
import path2 from "path";

// src/formatters/TypeScriptFormatter.ts
var TypeScriptFormatter = class {
  indent;
  includeTypes;
  includeObject;
  namespace;
  constructor(options = {}) {
    this.indent = options.indent ?? 2;
    this.includeTypes = options.includeTypes ?? true;
    this.includeObject = options.includeObject ?? true;
    this.namespace = options.namespace ?? "Routes";
  }
  /**
   * Format the introspection result as TypeScript
   */
  format(result) {
    const routes = Array.isArray(result.routes) ? result.routes : [];
    const routeStructure = this.buildRouteStructure(routes);
    let output = "";
    output += this.generateHeader(result.project);
    if (this.includeTypes) {
      output += this.generateTypes(routeStructure);
    }
    if (this.includeObject) {
      output += this.generateRouteObject(routeStructure);
    }
    return output;
  }
  /**
   * Get the output format type
   */
  getFormatType() {
    return "typescript";
  }
  /**
   * Build nested route structure from flat routes array
   */
  buildRouteStructure(routes) {
    const structure = {};
    const sortedRoutes = [...routes].sort((a, b) => b.path.length - a.path.length);
    for (const route of sortedRoutes) {
      if (route.path.startsWith("/api/") || route.path.includes("/_")) {
        continue;
      }
      const pathParts = this.parseRoutePath(route.path);
      let current = structure;
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        const isLast = i === pathParts.length - 1;
        if (isLast) {
          current[part] = route.path;
        } else {
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
      }
    }
    return structure;
  }
  /**
   * Parse route path into dot-accessible parts
   */
  parseRoutePath(path3) {
    const cleanPath = path3.startsWith("/") ? path3.slice(1) : path3;
    if (cleanPath === "") {
      return ["index"];
    }
    return cleanPath.split("/").map((part) => {
      if (part.startsWith("[") && part.endsWith("]")) {
        const paramName = part.slice(1, -1);
        return `$${paramName}`;
      }
      if (part.startsWith("[...") && part.endsWith("]")) {
        const paramName = part.slice(4, -1);
        return `$${paramName}`;
      }
      if (part.startsWith("[[...") && part.endsWith("]]")) {
        const paramName = part.slice(5, -2);
        return `$${paramName}`;
      }
      return part;
    });
  }
  /**
   * Generate file header with metadata
   */
  generateHeader(project) {
    const lines = [
      "/**",
      ` * Generated route types for ${project.framework} project`,
      ` * Framework: ${project.framework} ${project.version}`,
      ` * Root directory: ${project.rootDir}`,
      " *",
      " * This file provides type-safe access to your application routes.",
      " * Use the Routes object to access route paths with dot notation.",
      " */",
      ""
    ];
    return lines.join("\n");
  }
  /**
   * Generate TypeScript type definitions
   */
  generateTypes(routeStructure) {
    const indentStr = " ".repeat(this.indent);
    let output = `export declare namespace ${this.namespace} {
`;
    const generateTypeRecursive = (obj, depth = 1) => {
      const entries = Object.entries(obj);
      if (entries.length === 0) return "";
      let result = "";
      for (const [key, value] of entries) {
        const currentIndent = indentStr.repeat(depth);
        if (typeof value === "string") {
          result += `${currentIndent}${key}: string;
`;
        } else if (typeof value === "object") {
          result += `${currentIndent}${key}: {
`;
          result += generateTypeRecursive(value, depth + 1);
          result += `${currentIndent}};
`;
        }
      }
      return result;
    };
    output += generateTypeRecursive(routeStructure);
    output += "}\n\n";
    return output;
  }
  /**
   * Generate the actual route object
   */
  generateRouteObject(routeStructure) {
    const indentStr = " ".repeat(this.indent);
    let output = `export const routes: ${this.namespace} = `;
    const generateObjectRecursive = (obj, depth = 1) => {
      const entries = Object.entries(obj);
      if (entries.length === 0) return "{}";
      let result = "{\n";
      for (const [key, value] of entries) {
        const currentIndent = indentStr.repeat(depth);
        if (typeof value === "string") {
          result += `${currentIndent}${key}: "${value}",
`;
        } else if (typeof value === "object") {
          result += `${currentIndent}${key}: `;
          result += generateObjectRecursive(value, depth + 1);
          result += ",\n";
        }
      }
      result = result.replace(/,\n$/, "\n");
      result += `${indentStr.repeat(depth - 1)}}`;
      return result;
    };
    output += generateObjectRecursive(routeStructure);
    output += ";\n";
    return output;
  }
};

// src/NextIntrospect.ts
var NextIntrospect = class {
  projectPath;
  options;
  projectInfo = null;
  routes = [];
  analyzed = false;
  // Formatters
  formatters = {
    object: new ObjectFormatter(),
    json: new JsonFormatter(),
    markdown: new MarkdownFormatter(),
    typescript: new TypeScriptFormatter()
  };
  /**
   * Create a new NextIntrospect instance
   */
  constructor(projectPath, options = {}) {
    this.projectPath = path2.resolve(projectPath);
    this.options = {
      mode: "comprehensive",
      maxDepth: 10,
      followSymlinks: false,
      ...options
    };
  }
  /**
   * Analyze the Next.js project
   */
  async analyze() {
    const startTime = Date.now();
    if (!await this.isValidProject()) {
      throw new Error(`Invalid Next.js project: ${this.projectPath}`);
    }
    const adapter = new NextJsAdapter();
    this.projectInfo = await adapter.getProjectInfo(
      this.projectPath,
      this.options.packageDisplay
    );
    this.routes = await adapter.getRoutes(this.projectPath, this.options.mode);
    if (this.options.metadata?.file) {
      try {
        const metadata = await parseMetadataFile(this.options.metadata.file);
        this.routes = mergeRouteMetadata(this.routes, metadata);
        this.options.metadata.entries = metadata;
      } catch (error) {
        console.warn(
          `Warning: Could not load metadata file ${this.options.metadata.file}:`,
          error
        );
      }
    }
    this.routes = this.formatRoutePaths(this.routes, this.projectInfo);
    this.analyzed = true;
    const endTime = Date.now();
    const _duration = endTime - startTime;
    this.projectInfo = {
      ...this.projectInfo
      // Add any additional analysis metadata if needed
    };
    return this.projectInfo;
  }
  /**
   * Get all detected routes
   */
  getRoutes() {
    if (!this.analyzed) {
      throw new Error(
        "Project must be analyzed first. Call analyze() before getRoutes()."
      );
    }
    return this.routes;
  }
  /**
   * Get the complete introspection result
   */
  getResult() {
    if (!this.analyzed || !this.projectInfo) {
      throw new Error(
        "Project must be analyzed first. Call analyze() before getResult()."
      );
    }
    const routes = this.options.outputFormat?.nested ? routesToNested(
      this.routes,
      this.options.outputFormat.includeEmptySegments
    ) : this.routes;
    const result = {
      project: this.projectInfo,
      routes,
      metadata: {
        analyzedAt: /* @__PURE__ */ new Date(),
        duration: 0,
        // Would need to track this properly
        filesProcessed: this.routes.length,
        // Approximation
        mode: this.options.mode
      }
    };
    if (this.options.outputFormat?.excludeFields && this.options.outputFormat.excludeFields.length > 0) {
      return filterExcludedFields(
        result,
        this.options.outputFormat.excludeFields
      );
    }
    return result;
  }
  /**
   * Format the results using the specified formatter
   */
  format(format) {
    const result = this.getResult();
    const formatter = this.formatters[format];
    if (!formatter) {
      throw new Error(`Unknown format: ${format}`);
    }
    return formatter.format(result);
  }
  /**
   * Set the analysis mode
   */
  setMode(mode) {
    this.options.mode = mode;
    if (this.analyzed) {
      this.analyzed = false;
      this.routes = [];
    }
  }
  /**
   * Get the current analysis mode
   */
  getMode() {
    return this.options.mode;
  }
  /**
   * Get project information
   */
  getProjectInfo() {
    return this.projectInfo;
  }
  /**
   * Check if the project has been analyzed
   */
  isAnalyzed() {
    return this.analyzed;
  }
  /**
   * Get analysis options
   */
  getOptions() {
    return { ...this.options };
  }
  /**
   * Format route paths according to display options
   */
  formatRoutePaths(routes, projectInfo) {
    if (!this.options.pathDisplay) {
      return routes;
    }
    return routes.map((route) => {
      const formattedRoute = { ...route };
      if (this.options.pathDisplay.showFilePaths === true) {
        formattedRoute.filePath = formatPathForDisplay(
          route.filePath,
          projectInfo.rootDir,
          projectInfo.sourceDirs || {},
          this.options.pathDisplay
        );
      }
      if (route.path.includes("../") || route.path.includes(projectInfo.rootDir)) {
        formattedRoute.path = formatPathForDisplay(
          route.path,
          projectInfo.rootDir,
          projectInfo.sourceDirs || {},
          this.options.pathDisplay
        );
      }
      return formattedRoute;
    });
  }
  /**
   * Update analysis options
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    if (this.analyzed) {
      this.analyzed = false;
      this.routes = [];
    }
  }
  /**
   * Get routes filtered by router type
   */
  getRoutesByRouter(router) {
    return this.getRoutes().filter((route) => route.router === router);
  }
  /**
   * Get API routes (Pages Router only)
   */
  getApiRoutes() {
    return this.getRoutes().filter(
      (route) => route.router === "pages" && route.pagesRouter?.isApiRoute
    );
  }
  /**
   * Get special pages (Pages Router only)
   */
  getSpecialPages() {
    return this.getRoutes().filter(
      (route) => route.router === "pages" && route.pagesRouter?.isSpecialPage
    );
  }
  /**
   * Get dynamic routes
   */
  getDynamicRoutes() {
    return this.getRoutes().filter((route) => route.pattern !== "static");
  }
  /**
   * Get static routes
   */
  getStaticRoutes() {
    return this.getRoutes().filter((route) => route.pattern === "static");
  }
  /**
   * Export results to a file
   */
  async exportToFile(filePath, format = "json") {
    const fs = await import("fs/promises");
    const path3 = await import("path");
    const result = this.format(format);
    const content = typeof result === "string" ? result : JSON.stringify(result, null, 2);
    const fullPath = path3.resolve(filePath);
    await fs.writeFile(fullPath, content, "utf-8");
  }
  /**
   * Merge an existing introspection JSON file with new metadata
   */
  async mergeWithJson(jsonFilePath, metadata) {
    const fs = await import("fs/promises");
    const jsonContent = await fs.readFile(jsonFilePath, "utf-8");
    const existingResult = JSON.parse(jsonContent);
    const existingRoutes = Array.isArray(existingResult.routes) ? existingResult.routes : this.flattenNestedRoutes(existingResult.routes);
    let mergedRoutes;
    if (metadata && typeof metadata === "object" && "routes" in metadata) {
      const newResult = metadata;
      const newRoutes = Array.isArray(newResult.routes) ? newResult.routes : this.flattenNestedRoutes(newResult.routes);
      const routeMap = /* @__PURE__ */ new Map();
      existingRoutes.forEach((route) => {
        routeMap.set(route.path, { ...route });
      });
      newRoutes.forEach((route) => {
        if (routeMap.has(route.path)) {
          routeMap.set(route.path, { ...routeMap.get(route.path), ...route });
        } else {
          routeMap.set(route.path, route);
        }
      });
      mergedRoutes = Array.from(routeMap.values());
    } else {
      const metadataEntries = metadata;
      const { mergeRouteMetadata: mergeRouteMetadata2 } = await import("./utils-DHPAGBCI.js");
      mergedRoutes = mergeRouteMetadata2(existingRoutes, metadataEntries);
    }
    return {
      ...existingResult,
      routes: mergedRoutes,
      metadata: {
        ...existingResult.metadata,
        mergedAt: /* @__PURE__ */ new Date(),
        mergeSource: jsonFilePath
      }
    };
  }
  /**
   * Flatten nested routes back to array format
   */
  flattenNestedRoutes(nestedRoutes) {
    return routesToArray(nestedRoutes);
  }
  /**
   * Validate that the project path is a valid Next.js project
   */
  async isValidProject() {
    try {
      const fs = await import("fs/promises");
      await fs.access(this.projectPath);
      return await isNextJsProject(this.projectPath);
    } catch (_error) {
      return false;
    }
  }
  /**
   * Re-analyze the project (useful when files have changed)
   */
  async reanalyze() {
    this.analyzed = false;
    this.routes = [];
    this.projectInfo = null;
    return await this.analyze();
  }
};

export {
  BaseAdapter,
  NextJsAdapter,
  ObjectFormatter,
  JsonFormatter,
  NextIntrospect
};
