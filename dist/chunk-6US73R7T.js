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
  stripPrefixes;
  constructor(options = {}) {
    this.indent = options.indent ?? 2;
    this.stripPrefixes = options.stripPrefixes || [];
  }
  /**
   * Format the introspection result as TypeScript
   */
  format(result) {
    const routes = Array.isArray(result.routes) ? result.routes : [];
    const routeStructure = this.buildRouteStructure(routes);
    let output = "";
    output += this.generateHeader(result.project);
    output += this.generateRouteObject(routeStructure);
    return output;
  }
  /**
   * Get the output format type
   */
  getFormatType() {
    return "typescript";
  }
  /**
   * Strip prefixes from a route path
   */
  stripPathPrefixes(path3) {
    if (this.stripPrefixes.length === 0) {
      return path3;
    }
    for (const prefix of this.stripPrefixes) {
      if (prefix.startsWith("//") && prefix.endsWith("//") && prefix.length > 4) {
        const regexPattern = prefix.slice(2, -2);
        const regex = new RegExp(`^${regexPattern}`);
        const match = path3.match(regex);
        if (match) {
          const stripped = path3.slice(match[0].length);
          return stripped.startsWith("/") ? stripped : `/${stripped}`;
        }
      } else {
        if (path3.startsWith(prefix)) {
          const stripped = path3.slice(prefix.length);
          return stripped.startsWith("/") ? stripped : `/${stripped}`;
        }
      }
    }
    return path3;
  }
  /**
   * Build nested route structure from flat routes array
   */
  buildRouteStructure(routes) {
    const structure = {};
    const sortedRoutes = [...routes].sort(
      (a, b) => b.path.length - a.path.length
    );
    for (const route of sortedRoutes) {
      if (route.path.startsWith("/api/") || route.path.includes("/_")) {
        continue;
      }
      const fileName = route.filePath.split("/").pop()?.toLowerCase();
      const isPageFile = fileName && (fileName === "page.tsx" || fileName === "page.ts" || fileName === "page.jsx" || fileName === "page.js");
      if (!isPageFile) {
        continue;
      }
      const pathParts = this.parseRoutePath(route.path);
      let current = structure;
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        const isLast = i === pathParts.length - 1;
        if (isLast) {
          if (current[part] && typeof current[part] === "object") {
            current[part].index = route.path;
          } else if (current[part] && typeof current[part] === "string") {
            const existingPath = current[part];
            current[part] = {
              index: existingPath,
              [part]: route.path
              // This shouldn't happen, but handle it
            };
          } else {
            current[part] = route.path;
          }
        } else {
          if (!current[part]) {
            current[part] = {};
          } else if (typeof current[part] === "string") {
            const existingPath = current[part];
            current[part] = { index: existingPath };
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
      if (part.startsWith("[[...") && part.endsWith("]]")) {
        const paramName = part.slice(5, -2);
        return `by${paramName.charAt(0).toUpperCase()}${paramName.slice(1)}Optional`;
      }
      if (part.startsWith("[...") && part.endsWith("]")) {
        const paramName = part.slice(4, -1);
        return `by${paramName.charAt(0).toUpperCase()}${paramName.slice(1)}Rest`;
      }
      if (part.startsWith("[") && part.endsWith("]")) {
        const paramName = part.slice(1, -1);
        return `by${paramName.charAt(0).toUpperCase()}${paramName.slice(1)}`;
      }
      return this.sanitizeKeyName(part);
    });
  }
  /**
   * Sanitize route segment names to be valid JavaScript identifiers
   */
  sanitizeKeyName(name) {
    if (name.startsWith("by")) {
      return name;
    }
    let sanitized = name;
    sanitized = sanitized.replace(
      /-([a-z])/g,
      (_, letter) => letter.toUpperCase()
    );
    sanitized = sanitized.replace(/[^a-zA-Z0-9_$]/g, "_");
    if (!/^[a-zA-Z_$]/.test(sanitized)) {
      sanitized = `_${sanitized}`;
    }
    return sanitized;
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
   * Generate the actual route object with inferred types and helper methods
   */
  generateRouteObject(routeStructure) {
    const _indentStr = " ".repeat(this.indent);
    let output = "// Named exports for granular tree-shaking\n";
    const allExports = [];
    this.collectAllExports(routeStructure, [], allExports);
    for (const exp of allExports) {
      const exportName = this.pathToExportName(exp.path);
      output += `export const ${exportName} = `;
      output += this.generateValueRecursive(exp.value);
      output += ";\n";
    }
    output += "\n// Direct-reference routes object for dot notation (ultra tree-shakable)\n";
    output += "export const routes = ";
    output += this.generateGetterObjectRecursive(routeStructure, []);
    output += " as const;\n\n";
    output += "// Default export for convenience\n";
    output += "export default routes;\n";
    return output;
  }
  /**
   * Collect all exportable items from the route structure
   */
  collectAllExports(obj, currentPath, exports) {
    for (const [key, value] of Object.entries(obj)) {
      const newPath = [...currentPath, key];
      if (typeof value === "string") {
        exports.push({
          name: this.pathToExportName(newPath),
          path: newPath,
          value: obj[key]
          // The full route object (string for simple routes, object for parameterized)
        });
      } else if (typeof value === "object" && value !== null) {
        exports.push({
          name: this.pathToExportName(newPath),
          path: newPath,
          value
        });
        this.collectAllExports(value, newPath, exports);
      }
    }
  }
  /**
   * Convert a path array to a valid export name
   */
  pathToExportName(path3) {
    const name = path3.join("_");
    const reservedKeywords = /* @__PURE__ */ new Set([
      "default",
      "const",
      "let",
      "var",
      "function",
      "class",
      "interface",
      "type",
      "enum",
      "namespace",
      "module",
      "export",
      "import",
      "from",
      "as",
      "if",
      "else",
      "for",
      "while",
      "do",
      "switch",
      "case",
      "break",
      "continue",
      "return",
      "try",
      "catch",
      "finally",
      "throw",
      "new",
      "this",
      "super",
      "extends",
      "implements",
      "public",
      "private",
      "protected",
      "static",
      "readonly",
      "abstract",
      "async",
      "await",
      "yield",
      "typeof",
      "instanceof",
      "in",
      "of",
      "true",
      "false",
      "null",
      "undefined",
      "void",
      "never",
      "any",
      "unknown",
      "string",
      "number",
      "boolean",
      "object",
      "symbol",
      "bigint"
    ]);
    if (reservedKeywords.has(name)) {
      return `${name}_route`;
    }
    return name;
  }
  /**
   * Generate a simple value (string or object) without complex recursion
   */
  generateValueRecursive(value) {
    if (typeof value === "string") {
      if (value.includes("[") && value.includes("]")) {
        const params = this.extractParamsFromRoute(value);
        const paramNames = params.join(", ");
        const paramTypes = params.map((p) => `${p}: string`).join(", ");
        const strippedPath = this.stripPathPrefixes(value);
        const templateExample = this.buildTemplateExample(strippedPath, params);
        let result = "(() => {\n";
        result += `  /**
`;
        result += `   * @param {object} params - Route parameters
`;
        result += `   * @returns {string} URL: ${templateExample}
`;
        result += `   */
`;
        result += `  const func = ({ ${paramNames} }: { ${paramTypes} }): string => \`${this.buildTemplateString(strippedPath, params)}\`;
`;
        result += `  func.path = "${strippedPath}";
`;
        result += `  return func as typeof func & { path: string };
`;
        result += "})()";
        return result;
      } else {
        return `"${this.stripPathPrefixes(value)}"`;
      }
    }
    if (typeof value === "object" && value !== null) {
      if (value.path && typeof value.path === "string") {
        const strippedPath = this.stripPathPrefixes(value.path);
        if (value.get) {
          const params = this.extractParamsFromRoute(value.path);
          const paramObj = params.map((p) => `${p}: string`).join(", ");
          const templateExample = this.buildTemplateExample(
            strippedPath,
            params
          );
          let result2 = "(() => {\n";
          result2 += `  /**
`;
          result2 += `   * @param {object} params - Route parameters
`;
          result2 += `   * @returns {string} URL: ${templateExample}
`;
          result2 += `   */
`;
          result2 += `  const func = ({ ${paramObj} }: { ${paramObj} }) => \`${this.buildTemplateString(strippedPath, params)}\`;
`;
          result2 += `  func.path = "${strippedPath}";
`;
          result2 += `  return func as typeof func & { path: string };
`;
          result2 += "})()";
          return result2;
        } else {
          return `{ path: "${strippedPath}" }`;
        }
      }
      const entries = Object.entries(value);
      if (entries.length === 0) return "{}";
      let result = "{\n";
      for (const [key, val] of entries) {
        if (key === "index") {
          result += `  path: "${this.stripPathPrefixes(val)}"`;
        } else {
          result += `  ${key}: `;
          if (typeof val === "string") {
            result += `"${this.stripPathPrefixes(val)}"`;
          } else if (typeof val === "object" && val !== null) {
            result += this.generateValueRecursive(val);
          } else {
            result += String(val);
          }
        }
        result += ",\n";
      }
      result = result.replace(/,\n$/, "\n");
      result += "}";
      return result;
    }
    return String(value);
  }
  /**
   * Build TypeScript template literal type for better IDE inference
   */
  buildTemplateType(path3, _params) {
    let result = "`";
    result += path3.replace(/\[([^\]]+)\]/g, () => {
      return "${string}";
    });
    result += "`";
    return result;
  }
  /**
   * Build a human-readable example of the URL pattern
   */
  buildTemplateExample(path3, params) {
    let result = path3;
    params.forEach((param) => {
      const bracketParam = `[${param}]`;
      const exampleParam = `<${param}>`;
      result = result.replace(bracketParam, exampleParam);
    });
    return result;
  }
  /**
   * Generate direct-reference object that mirrors the structure (tree-shakable)
   */
  generateGetterObjectRecursive(obj, currentPath) {
    const entries = Object.entries(obj);
    if (entries.length === 0) return "{}";
    let result = "{\n";
    for (const [key, value] of entries) {
      const newPath = [...currentPath, key];
      const exportName = this.pathToExportName(newPath);
      if (typeof value === "string" || typeof value === "object" && value && value.path) {
        result += `  ${key}: ${exportName},
`;
      } else if (typeof value === "object" && value !== null) {
        result += `  ${key}: ${this.generateGetterObjectRecursive(value, newPath)},
`;
      }
    }
    result = result.replace(/,\n$/, "\n");
    result += "}";
    return result;
  }
  generateObjectRecursive(obj, depth = 1) {
    const indentStr = " ".repeat(this.indent);
    const entries = Object.entries(obj);
    if (entries.length === 0) return "{}";
    let result = "{\n";
    for (const [key, value] of entries) {
      const currentIndent = indentStr.repeat(depth);
      if (key === "index" && typeof value === "string") {
        result += `${currentIndent}path: "${this.stripPathPrefixes(value)}",
`;
        continue;
      }
      if (typeof value === "string") {
        if (value.includes("[") && value.includes("]")) {
          const params = this.extractParamsFromRoute(value);
          const paramNames = params.join(", ");
          const paramTypes = params.map((p) => `${p}: string`).join(", ");
          const strippedPath = this.stripPathPrefixes(value);
          result += `${currentIndent}${key}: {
`;
          result += `${currentIndent}${indentStr}path: "${strippedPath}",
`;
          result += `${currentIndent}${indentStr}get: ({ ${paramNames} }: { ${paramTypes} }) => \`${this.buildTemplateString(strippedPath, params)}\`,
`;
          result += `${currentIndent}},
`;
        } else {
          result += `${currentIndent}${key}: {
`;
          result += `${currentIndent}${indentStr}path: "${this.stripPathPrefixes(value)}",
`;
          result += `${currentIndent}},
`;
        }
      } else if (typeof value === "object") {
        if (value.index && Object.keys(value).length === 1) {
          result += `${currentIndent}${key}: {
`;
          result += `${currentIndent}${indentStr}path: "${this.stripPathPrefixes(value.index)}",
`;
          result += `${currentIndent}},
`;
        } else {
          result += `${currentIndent}${key}: `;
          result += this.generateObjectRecursive(value, depth + 1);
          result += ",\n";
        }
      }
    }
    result = result.replace(/,\n$/, "\n");
    result += `${indentStr.repeat(depth - 1)}}`;
    return result;
  }
  /**
   * Extract parameter names from a route string
   */
  extractParamsFromRoute(route) {
    const paramMatches = route.match(/\[([^\]]+)\]/g);
    if (!paramMatches) return [];
    return paramMatches.map((match) => {
      const param = match.slice(1, -1);
      if (param.startsWith("...")) {
        return param.slice(3);
      }
      if (param.startsWith("[[...")) {
        return param.slice(5, -2);
      }
      return param;
    });
  }
  /**
   * Build a template string from a route with parameters
   */
  buildTemplateString(route, params) {
    let template = route;
    params.forEach((param) => {
      const bracketParam = `[${param}]`;
      const templateVar = `\${${param}}`;
      template = template.replace(bracketParam, templateVar);
    });
    return template;
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
    let formatter = this.formatters[format];
    if (!formatter) {
      throw new Error(`Unknown format: ${format}`);
    }
    if (format === "typescript" && this.options.outputFormat?.stripPrefixes) {
      formatter = new TypeScriptFormatter({
        stripPrefixes: this.options.outputFormat.stripPrefixes
      });
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
