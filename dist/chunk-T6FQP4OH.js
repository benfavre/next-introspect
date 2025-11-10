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
async function getPackageInfo(projectPath, options) {
  const packageJsonPath = path.join(projectPath, "package.json");
  if (!existsSync(packageJsonPath)) {
    return void 0;
  }
  try {
    const packageJson = await fs.readFile(packageJsonPath, "utf-8");
    const fullPackageInfo = JSON.parse(packageJson);
    if (options?.includeFullDetails !== false) {
      return fullPackageInfo;
    }
    const summary = {
      name: fullPackageInfo.name,
      version: fullPackageInfo.version
    };
    if (options?.includeScripts) {
      summary.scripts = fullPackageInfo.scripts;
    } else if (fullPackageInfo.scripts) {
      summary.scriptsCount = Object.keys(fullPackageInfo.scripts).length;
    }
    if (options?.includeDependencies) {
      if (fullPackageInfo.dependencies) {
        summary.dependencies = fullPackageInfo.dependencies;
      }
      if (fullPackageInfo.devDependencies) {
        summary.devDependencies = fullPackageInfo.devDependencies;
      }
    } else {
      if (fullPackageInfo.dependencies) {
        summary.dependenciesCount = Object.keys(fullPackageInfo.dependencies).length;
      }
      if (fullPackageInfo.devDependencies) {
        summary.devDependenciesCount = Object.keys(fullPackageInfo.devDependencies).length;
      }
    }
    if (fullPackageInfo.private !== void 0) summary.private = fullPackageInfo.private;
    if (fullPackageInfo.type) summary.type = fullPackageInfo.type;
    if (fullPackageInfo.packageManager) summary.packageManager = fullPackageInfo.packageManager;
    return summary;
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
  const hasAppDir = existsSync(path.join(projectPath, "app")) || existsSync(path.join(projectPath, "src", "app"));
  const hasPagesDir = existsSync(path.join(projectPath, "pages")) || existsSync(path.join(projectPath, "src", "pages"));
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
function matchesPattern(pathStr, patterns) {
  return patterns.some((pattern) => {
    const regex = new RegExp(pattern.replace(/\*/g, ".*").replace(/\?/g, "."));
    return regex.test(pathStr);
  });
}
function normalizePath(filePath) {
  return path.resolve(filePath).replace(/\\/g, "/");
}
function getRelativePath(projectRoot, filePath) {
  return path.relative(projectRoot, filePath).replace(/\\/g, "/");
}
function formatPathForDisplay(filePath, projectRoot, sourceDirs, pathDisplay) {
  if (!pathDisplay || pathDisplay.style === "absolute") {
    return filePath;
  }
  switch (pathDisplay.style) {
    case "relative-to-project":
      return getRelativePath(projectRoot, filePath);
    case "relative-to-app":
      if (sourceDirs.app) {
        const appDir = path.join(projectRoot, sourceDirs.app);
        const relative = path.relative(appDir, filePath).replace(/\\/g, "/");
        return relative.startsWith("..") ? filePath : relative;
      }
      return filePath;
    case "relative-to-pages":
      if (sourceDirs.pages) {
        const pagesDir = path.join(projectRoot, sourceDirs.pages);
        const relative = path.relative(pagesDir, filePath).replace(/\\/g, "/");
        return relative.startsWith("..") ? filePath : relative;
      }
      return filePath;
    case "strip-prefix":
      if (pathDisplay.stripPrefix) {
        const normalizedPath = filePath.replace(/\\/g, "/");
        if (normalizedPath.includes(pathDisplay.stripPrefix)) {
          return normalizedPath.split(pathDisplay.stripPrefix)[1] || normalizedPath;
        }
      }
      return filePath;
    default:
      return filePath;
  }
}
function routesToNested(routes, includeEmptySegments = true) {
  const result = {};
  for (const route of routes) {
    const pathSegments = route.path.startsWith("/") ? route.path.slice(1).split("/").filter((segment) => segment.length > 0) : route.path.split("/").filter((segment) => segment.length > 0);
    let current = result;
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      const isLastSegment = i === pathSegments.length - 1;
      if (!current[segment]) {
        current[segment] = {};
      }
      if (isLastSegment) {
        current[segment] = {
          ...route,
          // Remove the path since it's now represented by the hierarchy
          path: void 0
        };
      } else {
        current = current[segment];
      }
    }
    if (pathSegments.length === 0 || route.path === "/") {
      result[""] = {
        ...route,
        path: void 0
      };
    }
  }
  return result;
}
function routesToArray(nestedRoutes) {
  const result = [];
  function traverse(obj, currentPath = []) {
    for (const [key, value] of Object.entries(obj)) {
      const newPath = [...currentPath, key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        if (value.router) {
          const path2 = newPath.filter((segment) => segment !== "").join("/");
          result.push({
            ...value,
            path: path2 ? `/${path2}` : "/"
          });
        } else {
          traverse(value, newPath);
        }
      }
    }
  }
  traverse(nestedRoutes);
  return result;
}
async function parseMetadataFile(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Metadata file not found: ${filePath}`);
  }
  const content = await fs.readFile(filePath, "utf-8");
  const ext = path.extname(filePath).toLowerCase();
  let metadata = {};
  if (ext === ".json") {
    const jsonData = JSON.parse(content);
    if (Array.isArray(jsonData)) {
      for (const item of jsonData) {
        if (typeof item === "object" && item !== null) {
          Object.assign(metadata, item);
        }
      }
    } else if (typeof jsonData === "object") {
      metadata = jsonData;
    }
  } else if (ext === ".toml") {
    metadata = parseTomlMetadata(content);
  } else {
    throw new Error(`Unsupported metadata file format: ${ext}. Use .json or .toml`);
  }
  return metadata;
}
function parseTomlMetadata(content) {
  const metadata = {};
  const lines = content.split("\n");
  let currentSection = "";
  let currentKey = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("[") && line.endsWith("]")) {
      currentSection = line.slice(1, -1);
      currentKey = currentSection;
      metadata[currentKey] = {};
      continue;
    }
    if (line.includes("=")) {
      const [key, ...valueParts] = line.split("=");
      const cleanKey = key.trim();
      let value = valueParts.join("=").trim();
      if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      if (currentKey && metadata[currentKey]) {
        if (cleanKey === "title") {
          metadata[currentKey].title = value;
        } else if (cleanKey === "desc" || cleanKey === "description") {
          metadata[currentKey].description = value;
        } else {
          metadata[currentKey][cleanKey] = value;
        }
      }
    }
  }
  return metadata;
}
function mergeRouteMetadata(routes, metadata) {
  return routes.map((route) => {
    let metadataKey = route.path;
    if (!metadata[metadataKey]) {
      const pathSegments = route.path.startsWith("/") ? route.path.slice(1).split("/").filter((s) => s.length > 0) : route.path.split("/").filter((s) => s.length > 0);
      metadataKey = pathSegments.join(".");
    }
    if (!metadata[metadataKey]) {
      const pathWithoutSlash = route.path.startsWith("/") ? route.path.slice(1) : route.path;
      metadataKey = `${route.router}.${pathWithoutSlash}`;
    }
    if (metadata[metadataKey]) {
      return {
        ...route,
        metadata: { ...metadata[metadataKey] }
      };
    }
    return route;
  });
}

export {
  traverseDirectory,
  isNextJsProject,
  getPackageInfo,
  parseRouteSegment,
  formatRoutePath,
  detectComponentType,
  extractExports,
  detectRouterType,
  isSpecialNextJsFile,
  getSpecialFileType,
  readFileContent,
  matchesPattern,
  normalizePath,
  getRelativePath,
  formatPathForDisplay,
  routesToNested,
  routesToArray,
  parseMetadataFile,
  mergeRouteMetadata
};
