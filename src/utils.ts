import { promises as fs, existsSync } from 'fs';
import path from 'path';
import type {
  FileEntry,
  RouteSegment,
  ComponentType,
  RouterType,
  PackageInfo,
  IntrospectionOptions,
  RouteInfo,
  RouteMetadata
} from './types.js';

/**
 * Recursively traverse a directory and return all files/directories
 */
export async function traverseDirectory(
  dirPath: string,
  maxDepth: number = 10,
  currentDepth: number = 0,
  ignorePatterns: string[] = []
): Promise<FileEntry[]> {
  if (currentDepth >= maxDepth) {
    return [];
  }

  const entries: FileEntry[] = [];

  try {
    const items = await fs.readdir(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativePath = path.relative(process.cwd(), fullPath);

      // Check ignore patterns
      if (ignorePatterns.some(pattern => {
        return new RegExp(pattern.replace(/\*/g, '.*')).test(relativePath);
      })) {
        continue;
      }

      const stats = await fs.stat(fullPath);
      const extension = path.extname(item).slice(1);

      const entry: FileEntry = {
        path: fullPath,
        relativePath,
        isDirectory: stats.isDirectory(),
        name: item,
        parentPath: dirPath,
        ...(extension && { extension })
      };

      entries.push(entry);

      // Recursively traverse directories
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
    // Ignore directories we can't read (permission issues, etc.)
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Warning: Could not read directory ${dirPath}:`, errorMessage);
  }

  return entries;
}

/**
 * Check if a directory is a Next.js project
 */
export async function isNextJsProject(projectPath: string): Promise<boolean> {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const packageJson = await fs.readFile(packageJsonPath, 'utf-8');
    const packageData = JSON.parse(packageJson);

    // Check for Next.js dependency
    const hasNextJs = packageData.dependencies?.['next'] || packageData.devDependencies?.['next'];

    // Check for Next.js config files
    const configFiles = ['next.config.js', 'next.config.mjs', 'next.config.ts'];
    const hasConfigFile = configFiles.some(file =>
      existsSync(path.join(projectPath, file))
    );

    // Check for source directories
    const hasAppDir = existsSync(path.join(projectPath, 'app'));
    const hasPagesDir = existsSync(path.join(projectPath, 'pages'));

    return hasNextJs || hasConfigFile || hasAppDir || hasPagesDir;
  // eslint-disable-next-line no-unused-vars
  } catch (_error) {
    return false;
  }
}

/**
 * Get package.json information
 */
export async function getPackageInfo(
  projectPath: string,
  options?: { includeFullDetails?: boolean; includeScripts?: boolean; includeDependencies?: boolean }
): Promise<PackageInfo | undefined> {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return undefined;
  }

  try {
    const packageJson = await fs.readFile(packageJsonPath, 'utf-8');
    const fullPackageInfo = JSON.parse(packageJson);

    // If full details are requested or no options specified, return everything
    if (options?.includeFullDetails !== false) {
      return fullPackageInfo;
    }

    // Create summarized version
    const summary: any = {
      name: fullPackageInfo.name,
      version: fullPackageInfo.version,
    };

    // Include scripts if requested
    if (options?.includeScripts) {
      summary.scripts = fullPackageInfo.scripts;
    } else if (fullPackageInfo.scripts) {
      summary.scriptsCount = Object.keys(fullPackageInfo.scripts).length;
    }

    // Include dependencies if requested
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

    // Always include important metadata
    if (fullPackageInfo.private !== undefined) summary.private = fullPackageInfo.private;
    if (fullPackageInfo.type) summary.type = fullPackageInfo.type;
    if (fullPackageInfo.packageManager) summary.packageManager = fullPackageInfo.packageManager;

    return summary;
  // eslint-disable-next-line no-unused-vars
  } catch (_error) {
    return undefined;
  }
}

/**
 * Parse a route segment and extract its properties
 */
export function parseRouteSegment(segment: string): RouteSegment {
  // Route group: (groupName)
  if (segment.startsWith('(') && segment.endsWith(')')) {
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

  // Intercepting routes: (.) (..) (...) (....)
  if (segment.startsWith('(') && segment.endsWith(')') &&
      ['.', '..', '...', '....'].includes(segment.slice(1, -1))) {
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

  // Parallel routes: @folder
  if (segment.startsWith('@')) {
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

  // Dynamic routes: [param]
  if (segment.startsWith('[') && segment.endsWith(']')) {
    const inner = segment.slice(1, -1);

    // Optional catch-all: [[...param]]
    if (inner.startsWith('[...') && inner.endsWith(']')) {
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

    // Catch-all: [...param]
    if (inner.startsWith('...')) {
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

    // Regular dynamic: [param]
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

  // Static segment
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

/**
 * Convert file system segments to URL path segments
 */
export function formatRoutePath(segments: RouteSegment[]): string {
  const urlSegments: string[] = [];

  for (const segment of segments) {
    // Skip route groups, intercepting routes, and parallel routes in URL
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

  return `/${urlSegments.filter(s => s !== 'page' && s !== 'route').join('/')}`;
}

/**
 * Detect if a component is a client or server component
 */
export function detectComponentType(fileContent: string): ComponentType {
  // Check for 'use client' directive at the top of the file
  const lines = fileContent.split('\n');
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    if (line === "'use client';" || line === '"use client";') {
      return 'client';
    }
    // Stop checking after encountering actual code
    if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*') && !line.startsWith('import') && !line.startsWith('export')) {
      break;
    }
  }

  return 'server';
}

/**
 * Extract exports from TypeScript/JavaScript file content
 */
export function extractExports(fileContent: string): Record<string, boolean> {
  const exports: Record<string, boolean> = {};

  // Named exports: export const/function/class/interface
  const namedExportRegex = /export\s+(?:const|function|class|interface|type)\s+(\w+)/g;
  let match;
  while ((match = namedExportRegex.exec(fileContent)) !== null) {
    exports[match[1]] = true;
  }

  // Named exports: export { name }
  const exportFromRegex = /export\s*{\s*([^}]+)\s*}/g;
  while ((match = exportFromRegex.exec(fileContent)) !== null) {
    const exportList = match[1];
    const exportNames = exportList.split(',').map(name => name.trim().split(' as ')[0].trim());
    exportNames.forEach(name => {
      if (name) exports[name] = true;
    });
  }

  // Default export
  if (/export\s+default/.test(fileContent)) {
    exports.default = true;
  }

  return exports;
}

/**
 * Get router type from project structure
 */
export function detectRouterType(projectPath: string): RouterType {
  const hasAppDir = existsSync(path.join(projectPath, 'app')) || existsSync(path.join(projectPath, 'src', 'app'));
  const hasPagesDir = existsSync(path.join(projectPath, 'pages')) || existsSync(path.join(projectPath, 'src', 'pages'));

  if (hasAppDir && hasPagesDir) {
    return 'both';
  } else if (hasAppDir) {
    return 'app';
  } else if (hasPagesDir) {
    return 'pages';
  } else {
    // Default to app router for newer Next.js projects
    return 'app';
  }
}

/**
 * Check if a file is a special Next.js file
 */
export function isSpecialNextJsFile(filename: string): boolean {
  const specialFiles = [
    'page.tsx', 'page.jsx', 'page.js', 'page.ts',
    'layout.tsx', 'layout.jsx', 'layout.js', 'layout.ts',
    'loading.tsx', 'loading.jsx', 'loading.js', 'loading.ts',
    'error.tsx', 'error.jsx', 'error.js', 'error.ts',
    'not-found.tsx', 'not-found.jsx', 'not-found.js', 'not-found.ts',
    'template.tsx', 'template.jsx', 'template.js', 'template.ts',
    'default.tsx', 'default.jsx', 'default.js', 'default.ts',
    'route.ts', 'route.js',
    '_app.tsx', '_app.jsx', '_app.js', '_app.ts',
    '_document.tsx', '_document.jsx', '_document.js', '_document.ts',
    '_error.tsx', '_error.jsx', '_error.js', '_error.ts',
    '404.tsx', '404.jsx', '404.js', '404.ts',
    '500.tsx', '500.jsx', '500.js', '500.ts'
  ];

  return specialFiles.includes(filename);
}

/**
 * Get special file type from filename
 */
export function getSpecialFileType(filename: string): string | undefined {
  const fileMap: Record<string, string> = {
    'page.tsx': 'page', 'page.jsx': 'page', 'page.js': 'page', 'page.ts': 'page',
    'layout.tsx': 'layout', 'layout.jsx': 'layout', 'layout.js': 'layout', 'layout.ts': 'layout',
    'loading.tsx': 'loading', 'loading.jsx': 'loading', 'loading.js': 'loading', 'loading.ts': 'loading',
    'error.tsx': 'error', 'error.jsx': 'error', 'error.js': 'error', 'error.ts': 'error',
    'not-found.tsx': 'not-found', 'not-found.jsx': 'not-found', 'not-found.js': 'not-found', 'not-found.ts': 'not-found',
    'template.tsx': 'template', 'template.jsx': 'template', 'template.js': 'template', 'template.ts': 'template',
    'default.tsx': 'default', 'default.jsx': 'default', 'default.js': 'default', 'default.ts': 'default',
    'route.ts': 'route', 'route.js': 'route',
    '_app.tsx': 'app', '_app.jsx': 'app', '_app.js': 'app', '_app.ts': 'app',
    '_document.tsx': 'document', '_document.jsx': 'document', '_document.js': 'document', '_document.ts': 'document',
    '_error.tsx': 'error', '_error.jsx': 'error', '_error.js': 'error', '_error.ts': 'error',
    '404.tsx': '404', '404.jsx': '404', '404.js': '404', '404.ts': '404',
    '500.tsx': '500', '500.jsx': '500', '500.js': '500', '500.ts': '500'
  };

  return fileMap[filename];
}

/**
 * Read file content safely
 */
export async function readFileContent(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Warning: Could not read file ${filePath}:`, errorMessage);
    return null;
  }
}

/**
 * Check if path matches any of the patterns
 */
export function matchesPattern(pathStr: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
    return regex.test(pathStr);
  });
}

/**
 * Normalize file path for consistent handling
 */
export function normalizePath(filePath: string): string {
  return path.resolve(filePath).replace(/\\/g, '/');
}

/**
 * Get relative path from project root
 */
export function getRelativePath(projectRoot: string, filePath: string): string {
  return path.relative(projectRoot, filePath).replace(/\\/g, '/');
}

/**
 * Format a path according to display options
 */
export function formatPathForDisplay(
  filePath: string,
  projectRoot: string,
  sourceDirs: { app?: string; pages?: string },
  pathDisplay?: IntrospectionOptions['pathDisplay']
): string {
  if (!pathDisplay || pathDisplay.style === 'absolute') {
    return filePath;
  }

  switch (pathDisplay.style) {
    case 'relative-to-project':
      return getRelativePath(projectRoot, filePath);

    case 'relative-to-app':
      if (sourceDirs.app) {
        const appDir = path.join(projectRoot, sourceDirs.app);
        const relative = path.relative(appDir, filePath).replace(/\\/g, '/');
        return relative.startsWith('..') ? filePath : relative;
      }
      return filePath;

    case 'relative-to-pages':
      if (sourceDirs.pages) {
        const pagesDir = path.join(projectRoot, sourceDirs.pages);
        const relative = path.relative(pagesDir, filePath).replace(/\\/g, '/');
        return relative.startsWith('..') ? filePath : relative;
      }
      return filePath;

    case 'strip-prefix':
      if (pathDisplay.stripPrefix) {
        const normalizedPath = filePath.replace(/\\/g, '/');
        if (normalizedPath.includes(pathDisplay.stripPrefix)) {
          return normalizedPath.split(pathDisplay.stripPrefix)[1] || normalizedPath;
        }
      }
      return filePath;

    default:
      return filePath;
  }
}

/**
 * Convert flat route array to nested hierarchical structure
 */
export function routesToNested(routes: RouteInfo[], _includeEmptySegments: boolean = true): Record<string, any> {
  const result: Record<string, any> = {};

  for (const route of routes) {
    // Remove leading slash and split by '/'
    const pathSegments = route.path.startsWith('/')
      ? route.path.slice(1).split('/').filter((segment: string) => segment.length > 0)
      : route.path.split('/').filter((segment: string) => segment.length > 0);

    let current = result;

    // Navigate/create the nested structure
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      const isLastSegment = i === pathSegments.length - 1;

      if (!current[segment]) {
        current[segment] = {};
      }

      if (isLastSegment) {
        // Last segment gets the route info
        current[segment] = {
          ...route,
          // Remove the path since it's now represented by the hierarchy
          path: undefined
        };
      } else {
        current = current[segment];
      }
    }

    // Handle routes that map to the root (like "/")
    if (pathSegments.length === 0 || route.path === '/') {
      result[''] = {
        ...route,
        path: undefined
      };
    }
  }

  return result;
}

/**
 * Convert nested routes back to flat array format
 */
export function routesToArray(nestedRoutes: Record<string, any>): RouteInfo[] {
  const result: RouteInfo[] = [];

  function traverse(obj: Record<string, any>, currentPath: string[] = []) {
    for (const [key, value] of Object.entries(obj)) {
      const newPath = [...currentPath, key];

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Check if this is a route object (has router property)
        if (value.router) {
          // Restore the path property
          const path = newPath.filter(segment => segment !== '').join('/');
          result.push({
            ...value,
            path: path ? `/${path}` : '/'
          });
        } else {
          // Continue traversing
          traverse(value, newPath);
        }
      }
    }
  }

  traverse(nestedRoutes);
  return result;
}

/**
 * Recursively filter out excluded fields from objects
 */
export function filterExcludedFields(obj: any, excludeFields: string[]): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => filterExcludedFields(item, excludeFields));
  }

  const filtered: any = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip excluded fields
    if (excludeFields.includes(key)) {
      continue;
    }

    // Recursively filter nested objects
    filtered[key] = filterExcludedFields(value, excludeFields);
  }

  return filtered;
}

/**
 * Parse metadata from JSON or TOML file
 */
export async function parseMetadataFile(filePath: string): Promise<Record<string, RouteMetadata>> {
  if (!existsSync(filePath)) {
    throw new Error(`Metadata file not found: ${filePath}`);
  }

  const content = await fs.readFile(filePath, 'utf-8');
  const ext = path.extname(filePath).toLowerCase();

  let metadata: Record<string, RouteMetadata> = {};

  if (ext === '.json') {
    // Parse JSON format
    const jsonData = JSON.parse(content);

    // Handle array format: [{ "magazine.publisher": { title: "...", desc: "..." } }]
    if (Array.isArray(jsonData)) {
      for (const item of jsonData) {
        if (typeof item === 'object' && item !== null) {
          Object.assign(metadata, item);
        }
      }
    } else if (typeof jsonData === 'object') {
      metadata = jsonData;
    }
  } else if (ext === '.toml') {
    // Parse TOML format
    metadata = parseTomlMetadata(content);
  } else {
    throw new Error(`Unsupported metadata file format: ${ext}. Use .json or .toml`);
  }

  return metadata;
}

/**
 * Parse TOML metadata content
 */
function parseTomlMetadata(content: string): Record<string, RouteMetadata> {
  const metadata: Record<string, RouteMetadata> = {};
  const lines = content.split('\n');
  let currentSection = '';
  let currentKey = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) continue;

    // Section header: [section.name]
    if (line.startsWith('[') && line.endsWith(']')) {
      currentSection = line.slice(1, -1);
      currentKey = currentSection;
      metadata[currentKey] = {};
      continue;
    }

    // Key-value pair: key = "value"
    if (line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const cleanKey = key.trim();
      let value = valueParts.join('=').trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (currentKey && metadata[currentKey]) {
        // Map common keys
        if (cleanKey === 'title') {
          metadata[currentKey].title = value;
        } else if (cleanKey === 'desc' || cleanKey === 'description') {
          metadata[currentKey].description = value;
        } else {
          // Store as custom metadata
          metadata[currentKey][cleanKey] = value;
        }
      }
    }
  }

  return metadata;
}

/**
 * Merge metadata into routes based on path matching
 */
export function mergeRouteMetadata(
  routes: RouteInfo[],
  metadata: Record<string, RouteMetadata>
): RouteInfo[] {
  return routes.map(route => {
    // Try different key formats to match metadata

    // 1. Exact path match (e.g., "/magazine/publisher")
    let metadataKey = route.path;

    // 2. Dot notation for nested paths (e.g., "magazine.publisher")
    if (!metadata[metadataKey]) {
      const pathSegments = route.path.startsWith('/')
        ? route.path.slice(1).split('/').filter(s => s.length > 0)
        : route.path.split('/').filter(s => s.length > 0);
      metadataKey = pathSegments.join('.');
    }

    // 3. Router-specific prefixes
    if (!metadata[metadataKey]) {
      const pathWithoutSlash = route.path.startsWith('/') ? route.path.slice(1) : route.path;
      metadataKey = `${route.router}.${pathWithoutSlash}`;
    }

    // Apply metadata if found
    if (metadata[metadataKey]) {
      return {
        ...route,
        metadata: { ...metadata[metadataKey] }
      };
    }

    return route;
  });
}
