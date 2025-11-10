var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

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
    const fs2 = await import("fs/promises");
    const path4 = await import("path");
    try {
      const stats = await fs2.stat(projectPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path ${projectPath} is not a directory`);
      }
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        throw new Error(`Project path ${projectPath} does not exist`);
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Cannot access project path ${projectPath}: ${errorMessage}`);
    }
  }
  /**
   * Get framework version from package.json
   */
  async getFrameworkVersion(projectPath, packageName) {
    const fs2 = await import("fs/promises");
    const path4 = await import("path");
    try {
      const packageJsonPath = path4.join(projectPath, "package.json");
      const packageJson = await fs2.readFile(packageJsonPath, "utf-8");
      const packageData = JSON.parse(packageJson);
      return packageData.dependencies?.[packageName] || packageData.devDependencies?.[packageName];
    } catch (error) {
      return void 0;
    }
  }
  /**
   * Check if a directory exists
   */
  async directoryExists(dirPath) {
    const fs2 = await import("fs/promises");
    try {
      const stats = await fs2.stat(dirPath);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }
  /**
   * Check if a file exists
   */
  async fileExists(filePath) {
    const fs2 = await import("fs/promises");
    try {
      const stats = await fs2.stat(filePath);
      return stats.isFile();
    } catch (error) {
      return false;
    }
  }
  /**
   * Get common project information
   */
  async getBaseProjectInfo(projectPath, framework, version) {
    const fs2 = await import("fs/promises");
    const path4 = await import("path");
    let packageInfo;
    try {
      const packageJsonPath = path4.join(projectPath, "package.json");
      const packageJson = await fs2.readFile(packageJsonPath, "utf-8");
      packageInfo = JSON.parse(packageJson);
    } catch (error) {
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
  normalizePath(filePath) {
    const path4 = __require("path");
    return path4.resolve(filePath).replace(/\\/g, "/");
  }
  /**
   * Get relative path from project root
   */
  getRelativePath(projectRoot, filePath) {
    const path4 = __require("path");
    return path4.relative(projectRoot, filePath).replace(/\\/g, "/");
  }
};

// src/utils.ts
import { promises as fs, existsSync } from "fs";
import path from "path";
async function traverseDirectory(dirPath, maxDepth = 10, currentDepth = 0, ignorePatterns = []) {
  if (currentDepth >= maxDepth) {
    return [];
  }
  const entries = [];
  try {
    const items = await fs.readdir(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativePath = path.relative(process.cwd(), fullPath);
      if (ignorePatterns.some((pattern) => {
        return new RegExp(pattern.replace(/\*/g, ".*")).test(relativePath);
      })) {
        continue;
      }
      const stats = await fs.stat(fullPath);
      const extension = path.extname(item).slice(1);
      const entry = {
        path: fullPath,
        relativePath,
        isDirectory: stats.isDirectory(),
        name: item,
        parentPath: dirPath,
        ...extension && { extension }
      };
      entries.push(entry);
      if (stats.isDirectory()) {
        const subEntries = await traverseDirectory(
          fullPath,
          maxDepth,
          currentDepth + 1,
          ignorePatterns
        );
        entries.push(...subEntries);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Warning: Could not read directory ${dirPath}:`, errorMessage);
  }
  return entries;
}
async function isNextJsProject(projectPath) {
  const packageJsonPath = path.join(projectPath, "package.json");
  if (!existsSync(packageJsonPath)) {
    return false;
  }
  try {
    const packageJson = await fs.readFile(packageJsonPath, "utf-8");
    const packageData = JSON.parse(packageJson);
    const hasNextJs = packageData.dependencies?.["next"] || packageData.devDependencies?.["next"];
    const configFiles = ["next.config.js", "next.config.mjs", "next.config.ts"];
    const hasConfigFile = configFiles.some(
      (file) => existsSync(path.join(projectPath, file))
    );
    const hasAppDir = existsSync(path.join(projectPath, "app"));
    const hasPagesDir = existsSync(path.join(projectPath, "pages"));
    return hasNextJs || hasConfigFile || hasAppDir || hasPagesDir;
  } catch (error) {
    return false;
  }
}
async function getPackageInfo(projectPath) {
  const packageJsonPath = path.join(projectPath, "package.json");
  if (!existsSync(packageJsonPath)) {
    return void 0;
  }
  try {
    const packageJson = await fs.readFile(packageJsonPath, "utf-8");
    return JSON.parse(packageJson);
  } catch (error) {
    return void 0;
  }
}
function parseRouteSegment(segment) {
  if (segment.startsWith("(") && segment.endsWith(")")) {
    return {
      name: segment,
      isDynamic: false,
      isCatchAll: false,
      isOptionalCatchAll: false,
      isRouteGroup: true,
      isIntercepting: false,
      isParallel: false
    };
  }
  if (segment.startsWith("(") && segment.endsWith(")") && [".", "..", "...", "...."].includes(segment.slice(1, -1))) {
    return {
      name: segment,
      isDynamic: false,
      isCatchAll: false,
      isOptionalCatchAll: false,
      isRouteGroup: false,
      isIntercepting: true,
      isParallel: false
    };
  }
  if (segment.startsWith("@")) {
    return {
      name: segment,
      isDynamic: false,
      isCatchAll: false,
      isOptionalCatchAll: false,
      isRouteGroup: false,
      isIntercepting: false,
      isParallel: true
    };
  }
  if (segment.startsWith("[") && segment.endsWith("]")) {
    const inner = segment.slice(1, -1);
    if (inner.startsWith("[...") && inner.endsWith("]")) {
      const paramName = inner.slice(4, -1);
      return {
        name: segment,
        isDynamic: true,
        isCatchAll: true,
        isOptionalCatchAll: true,
        isRouteGroup: false,
        isIntercepting: false,
        isParallel: false,
        paramName
      };
    }
    if (inner.startsWith("...")) {
      const paramName = inner.slice(3);
      return {
        name: segment,
        isDynamic: true,
        isCatchAll: true,
        isOptionalCatchAll: false,
        isRouteGroup: false,
        isIntercepting: false,
        isParallel: false,
        paramName
      };
    }
    return {
      name: segment,
      isDynamic: true,
      isCatchAll: false,
      isOptionalCatchAll: false,
      isRouteGroup: false,
      isIntercepting: false,
      isParallel: false,
      paramName: inner
    };
  }
  return {
    name: segment,
    isDynamic: false,
    isCatchAll: false,
    isOptionalCatchAll: false,
    isRouteGroup: false,
    isIntercepting: false,
    isParallel: false
  };
}
function formatRoutePath(segments) {
  const urlSegments = [];
  for (const segment of segments) {
    if (segment.isRouteGroup || segment.isIntercepting || segment.isParallel) {
      continue;
    }
    if (segment.isDynamic) {
      if (segment.isOptionalCatchAll) {
        urlSegments.push(`[[...${segment.paramName}]]`);
      } else if (segment.isCatchAll) {
        urlSegments.push(`[...${segment.paramName}]`);
      } else {
        urlSegments.push(`[${segment.paramName}]`);
      }
    } else {
      urlSegments.push(segment.name);
    }
  }
  return "/" + urlSegments.filter((s) => s !== "page" && s !== "route").join("/");
}
function detectComponentType(fileContent) {
  const lines = fileContent.split("\n");
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    if (line === "'use client';" || line === '"use client";') {
      return "client";
    }
    if (line && !line.startsWith("//") && !line.startsWith("/*") && !line.startsWith("*") && !line.startsWith("import") && !line.startsWith("export")) {
      break;
    }
  }
  return "server";
}
function extractExports(fileContent) {
  const exports = {};
  const namedExportRegex = /export\s+(?:const|function|class|interface|type)\s+(\w+)/g;
  let match;
  while ((match = namedExportRegex.exec(fileContent)) !== null) {
    exports[match[1]] = true;
  }
  const exportFromRegex = /export\s*{\s*([^}]+)\s*}/g;
  while ((match = exportFromRegex.exec(fileContent)) !== null) {
    const exportList = match[1];
    const exportNames = exportList.split(",").map((name) => name.trim().split(" as ")[0].trim());
    exportNames.forEach((name) => {
      if (name) exports[name] = true;
    });
  }
  if (/export\s+default/.test(fileContent)) {
    exports.default = true;
  }
  return exports;
}
function detectRouterType(projectPath) {
  const hasAppDir = existsSync(path.join(projectPath, "app"));
  const hasPagesDir = existsSync(path.join(projectPath, "pages"));
  if (hasAppDir && hasPagesDir) {
    return "both";
  } else if (hasAppDir) {
    return "app";
  } else if (hasPagesDir) {
    return "pages";
  } else {
    return "app";
  }
}
function isSpecialNextJsFile(filename) {
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
    "_app.tsx",
    "_app.jsx",
    "_app.js",
    "_app.ts",
    "_document.tsx",
    "_document.jsx",
    "_document.js",
    "_document.ts",
    "_error.tsx",
    "_error.jsx",
    "_error.js",
    "_error.ts",
    "404.tsx",
    "404.jsx",
    "404.js",
    "404.ts",
    "500.tsx",
    "500.jsx",
    "500.js",
    "500.ts"
  ];
  return specialFiles.includes(filename);
}
function getSpecialFileType(filename) {
  const fileMap = {
    "page.tsx": "page",
    "page.jsx": "page",
    "page.js": "page",
    "page.ts": "page",
    "layout.tsx": "layout",
    "layout.jsx": "layout",
    "layout.js": "layout",
    "layout.ts": "layout",
    "loading.tsx": "loading",
    "loading.jsx": "loading",
    "loading.js": "loading",
    "loading.ts": "loading",
    "error.tsx": "error",
    "error.jsx": "error",
    "error.js": "error",
    "error.ts": "error",
    "not-found.tsx": "not-found",
    "not-found.jsx": "not-found",
    "not-found.js": "not-found",
    "not-found.ts": "not-found",
    "template.tsx": "template",
    "template.jsx": "template",
    "template.js": "template",
    "template.ts": "template",
    "default.tsx": "default",
    "default.jsx": "default",
    "default.js": "default",
    "default.ts": "default",
    "route.ts": "route",
    "route.js": "route",
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
  return fileMap[filename];
}
async function readFileContent(filePath) {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Warning: Could not read file ${filePath}:`, errorMessage);
    return null;
  }
}

// src/adapters/NextJsAdapter.ts
import path2 from "path";
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
  async getProjectInfo(projectPath) {
    await this.validateProjectPath(projectPath);
    const packageInfo = await getPackageInfo(projectPath);
    const nextVersion = packageInfo?.dependencies?.["next"] || packageInfo?.devDependencies?.["next"];
    const router = detectRouterType(projectPath);
    const config = await this.parseNextConfig(projectPath);
    const sourceDirs = {};
    if (await this.directoryExists(path2.join(projectPath, "app"))) {
      sourceDirs.app = "app";
    }
    if (await this.directoryExists(path2.join(projectPath, "pages"))) {
      sourceDirs.pages = "pages";
    }
    if (await this.directoryExists(path2.join(projectPath, "src", "app"))) {
      sourceDirs.app = "src/app";
    }
    if (await this.directoryExists(path2.join(projectPath, "src", "pages"))) {
      sourceDirs.pages = "src/pages";
    }
    return {
      framework: "nextjs",
      version: nextVersion || "unknown",
      router,
      rootDir: this.normalizePath(projectPath),
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
      const configPath = path2.join(projectPath, configFile);
      if (await this.fileExists(configPath)) {
        try {
          return {
            hasMiddleware: await this.fileExists(path2.join(projectPath, "middleware.js")) || await this.fileExists(path2.join(projectPath, "middleware.ts")) || await this.fileExists(path2.join(projectPath, "src/middleware.js")) || await this.fileExists(path2.join(projectPath, "src/middleware.ts"))
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`Warning: Could not parse Next.js config ${configFile}:`, errorMessage);
        }
      }
    }
    return void 0;
  }
  /**
   * Get App Router routes
   */
  async getAppRouterRoutes(projectPath, mode) {
    const routes = [];
    let appDir = null;
    if (await this.directoryExists(path2.join(projectPath, "app"))) {
      appDir = path2.join(projectPath, "app");
    } else if (await this.directoryExists(path2.join(projectPath, "src", "app"))) {
      appDir = path2.join(projectPath, "src", "app");
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
          const routePath = this.convertFilePathToRoute(entry.relativePath);
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
      console.warn("Warning: Could not analyze App Router routes:", errorMessage);
    }
    return routes;
  }
  /**
   * Get Pages Router routes
   */
  async getPagesRouterRoutes(projectPath, mode) {
    const routes = [];
    let pagesDir = null;
    if (await this.directoryExists(path2.join(projectPath, "pages"))) {
      pagesDir = path2.join(projectPath, "pages");
    } else if (await this.directoryExists(path2.join(projectPath, "src", "pages"))) {
      pagesDir = path2.join(projectPath, "src", "pages");
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
          const routePath = this.convertPagesPathToRoute(entry.relativePath);
          routes.push({
            path: routePath,
            filePath: entry.path,
            pattern: "static",
            // Will be determined by parser
            router: "pages"
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn("Warning: Could not analyze Pages Router routes:", errorMessage);
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
    let routePath = relativePath.replace(/^app\//, "").replace(/^src\/app\//, "");
    routePath = routePath.replace(/\/(page|route|layout|loading|error|not-found|template|default)(\..*)?$/, "");
    if (routePath === "") {
      return "/";
    }
    return "/" + routePath;
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
    return "/" + routePath;
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

// src/formatters/MarkdownFormatter.ts
var MarkdownFormatter = class {
  /**
   * Format the introspection result as Markdown
   */
  format(result) {
    const lines = [];
    lines.push("# Next.js Project Introspection");
    lines.push("");
    lines.push("## Project Information");
    lines.push("");
    lines.push(`- **Framework**: ${result.project.framework} ${result.project.version}`);
    lines.push(`- **Router Type**: ${this.formatRouterType(result.project.router)}`);
    lines.push(`- **Root Directory**: \`${result.project.rootDir}\``);
    if (result.project.sourceDirs) {
      lines.push(`- **App Directory**: \`${result.project.sourceDirs.app || "N/A"}\``);
      lines.push(`- **Pages Directory**: \`${result.project.sourceDirs.pages || "N/A"}\``);
    }
    lines.push(`- **Analysis Mode**: ${result.metadata.mode}`);
    lines.push(`- **Files Processed**: ${result.metadata.filesProcessed}`);
    lines.push(`- **Analysis Duration**: ${result.metadata.duration}ms`);
    lines.push(`- **Analyzed At**: ${result.metadata.analyzedAt.toISOString()}`);
    lines.push("");
    if (result.project.config) {
      lines.push("## Configuration");
      lines.push("");
      this.addConfigSection(lines, result.project.config);
      lines.push("");
    }
    const routeStats = this.getRouteStatistics(result.routes);
    lines.push("## Routes Overview");
    lines.push("");
    lines.push(`- **Total Routes**: ${result.routes.length}`);
    lines.push(`- **App Router Routes**: ${routeStats.appRouter}`);
    lines.push(`- **Pages Router Routes**: ${routeStats.pagesRouter}`);
    lines.push(`- **API Routes**: ${routeStats.apiRoutes}`);
    lines.push(`- **Dynamic Routes**: ${routeStats.dynamicRoutes}`);
    lines.push("");
    if (routeStats.appRouter > 0) {
      lines.push("## App Router Routes");
      lines.push("");
      this.addAppRouterRoutes(lines, result.routes);
      lines.push("");
    }
    if (routeStats.pagesRouter > 0) {
      lines.push("## Pages Router Routes");
      lines.push("");
      this.addPagesRouterRoutes(lines, result.routes);
      lines.push("");
    }
    if (routeStats.apiRoutes > 0) {
      lines.push("## API Routes");
      lines.push("");
      this.addApiRoutes(lines, result.routes);
      lines.push("");
    }
    return lines.join("\n");
  }
  /**
   * Get the output format type
   */
  getFormatType() {
    return "markdown";
  }
  /**
   * Format router type for display
   */
  formatRouterType(router) {
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
  addConfigSection(lines, config) {
    if (config.basePath) {
      lines.push(`- **Base Path**: \`${config.basePath}\``);
    }
    if (config.distDir) {
      lines.push(`- **Distribution Directory**: \`${config.distDir}\``);
    }
    if (config.trailingSlash !== void 0) {
      lines.push(`- **Trailing Slash**: ${config.trailingSlash ? "Enabled" : "Disabled"}`);
    }
    if (config.images?.domains?.length) {
      lines.push(`- **Image Domains**: ${config.images.domains.map((d) => `\`${d}\``).join(", ")}`);
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
  getRouteStatistics(routes) {
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
  addAppRouterRoutes(lines, routes) {
    const appRoutes = routes.filter((r) => r.router === "app");
    for (const route of appRoutes) {
      lines.push(`### \`${route.path}\``);
      lines.push("");
      if (route.dynamicSegments?.length) {
        lines.push(`- **Dynamic Segments**: ${route.dynamicSegments.map((s) => `\`${s}\``).join(", ")}`);
      }
      if (route.catchAllSegment) {
        lines.push(`- **Catch-all Segment**: \`${route.catchAllSegment}\``);
      }
      lines.push(`- **Pattern**: ${this.formatRoutePattern(route.pattern)}`);
      if (route.appRouter?.specialFiles) {
        const specialFiles = Object.entries(route.appRouter.specialFiles).filter(([_, present]) => present).map(([file, _]) => `\`${file}\``);
        if (specialFiles.length > 0) {
          lines.push(`- **Special Files**: ${specialFiles.join(", ")}`);
        }
      }
      if (route.appRouter?.isRouteGroup) {
        lines.push("- **Route Group**: Yes");
      }
      if (route.appRouter?.isInterceptingRoute) {
        lines.push("- **Intercepting Route**: Yes");
      }
      if (route.appRouter?.isParallelRoute) {
        lines.push("- **Parallel Route**: Yes");
      }
      if (route.appRouter?.componentTypes) {
        const componentInfo = Object.entries(route.appRouter.componentTypes).filter(([_, type]) => type !== "unknown").map(([file, type]) => `${file}: ${type}`);
        if (componentInfo.length > 0) {
          lines.push(`- **Components**: ${componentInfo.join(", ")}`);
        }
      }
      if (route.appRouter?.exports) {
        const exports = Object.entries(route.appRouter.exports).filter(([_, present]) => present).map(([exp, _]) => `\`${exp}\``);
        if (exports.length > 0) {
          lines.push(`- **Exports**: ${exports.join(", ")}`);
        }
      }
      lines.push("");
    }
  }
  /**
   * Add Pages Router routes section
   */
  addPagesRouterRoutes(lines, routes) {
    const pagesRoutes = routes.filter(
      (r) => r.router === "pages" && !r.pagesRouter?.isApiRoute && !r.pagesRouter?.isSpecialPage
    );
    for (const route of pagesRoutes) {
      lines.push(`### \`${route.path}\``);
      lines.push("");
      if (route.dynamicSegments?.length) {
        lines.push(`- **Dynamic Segments**: ${route.dynamicSegments.map((s) => `\`${s}\``).join(", ")}`);
      }
      if (route.catchAllSegment) {
        lines.push(`- **Catch-all Segment**: \`${route.catchAllSegment}\``);
      }
      lines.push(`- **Pattern**: ${this.formatRoutePattern(route.pattern)}`);
      if (route.pagesRouter?.componentType && route.pagesRouter.componentType !== "unknown") {
        lines.push(`- **Component Type**: ${route.pagesRouter.componentType}`);
      }
      if (route.pagesRouter?.dataFetching) {
        const methods = Object.entries(route.pagesRouter.dataFetching).filter(([_, present]) => present).map(([method, _]) => `\`${method}\``);
        if (methods.length > 0) {
          lines.push(`- **Data Fetching**: ${methods.join(", ")}`);
        }
      }
      lines.push("");
    }
  }
  /**
   * Add API routes section
   */
  addApiRoutes(lines, routes) {
    const apiRoutes = routes.filter((r) => r.pagesRouter?.isApiRoute);
    for (const route of apiRoutes) {
      lines.push(`### \`${route.path}\``);
      lines.push("");
      if (route.dynamicSegments?.length) {
        lines.push(`- **Dynamic Segments**: ${route.dynamicSegments.map((s) => `\`${s}\``).join(", ")}`);
      }
      lines.push(`- **Pattern**: ${this.formatRoutePattern(route.pattern)}`);
      if (route.pagesRouter?.componentType && route.pagesRouter.componentType !== "unknown") {
        lines.push(`- **Component Type**: ${route.pagesRouter.componentType}`);
      }
      lines.push("");
    }
  }
  /**
   * Format route pattern for display
   */
  formatRoutePattern(pattern) {
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
};

// src/NextIntrospect.ts
import path3 from "path";
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
    markdown: new MarkdownFormatter()
  };
  /**
   * Create a new NextIntrospect instance
   */
  constructor(projectPath, options = {}) {
    this.projectPath = path3.resolve(projectPath);
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
    this.projectInfo = await adapter.getProjectInfo(this.projectPath);
    this.routes = await adapter.getRoutes(this.projectPath, this.options.mode);
    this.analyzed = true;
    const endTime = Date.now();
    const duration = endTime - startTime;
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
      throw new Error("Project must be analyzed first. Call analyze() before getRoutes().");
    }
    return this.routes;
  }
  /**
   * Get the complete introspection result
   */
  getResult() {
    if (!this.analyzed || !this.projectInfo) {
      throw new Error("Project must be analyzed first. Call analyze() before getResult().");
    }
    return {
      project: this.projectInfo,
      routes: this.routes,
      metadata: {
        analyzedAt: /* @__PURE__ */ new Date(),
        duration: 0,
        // Would need to track this properly
        filesProcessed: this.routes.length,
        // Approximation
        mode: this.options.mode
      }
    };
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
    const fs2 = await import("fs/promises");
    const path4 = await import("path");
    const result = this.format(format);
    const content = typeof result === "string" ? result : JSON.stringify(result, null, 2);
    const fullPath = path4.resolve(filePath);
    await fs2.writeFile(fullPath, content, "utf-8");
  }
  /**
   * Validate that the project path is a valid Next.js project
   */
  async isValidProject() {
    try {
      const fs2 = await import("fs/promises");
      await fs2.access(this.projectPath);
      return await isNextJsProject(this.projectPath);
    } catch (error) {
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
  traverseDirectory,
  isNextJsProject,
  parseRouteSegment,
  formatRoutePath,
  detectComponentType,
  extractExports,
  detectRouterType,
  isSpecialNextJsFile,
  getSpecialFileType,
  readFileContent,
  NextJsAdapter,
  ObjectFormatter,
  JsonFormatter,
  MarkdownFormatter,
  NextIntrospect
};
