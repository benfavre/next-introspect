import type {
  Formatter,
  IntrospectionResult,
  OutputFormat,
  RouteInfo,
  ProjectInfo,
} from "../types.js";

/**
 * TypeScript Formatter - Generates type-safe route access via dot notation
 *
 * Creates TypeScript interfaces and objects that allow accessing routes using
 * dot notation like routes.home, routes.api.users, routes.blog.posts.$id
 */
export class TypeScriptFormatter implements Formatter {
  private indent: number;
  private stripPrefixes: string[];

  constructor(options: { indent?: number; stripPrefixes?: string[] } = {}) {
    this.indent = options.indent ?? 2;
    this.stripPrefixes = options.stripPrefixes || [];
  }

  /**
   * Format the introspection result as TypeScript
   */
  format(result: IntrospectionResult): string {
    const routes = Array.isArray(result.routes) ? result.routes : [];
    const routeStructure = this.buildRouteStructure(routes);

    let output = "";

    // Add file header
    output += this.generateHeader(result.project);

    // Generate route object with inferred types
    output += this.generateRouteObject(routeStructure);

    return output;
  }

  /**
   * Get the output format type
   */
  getFormatType(): OutputFormat {
    return "typescript";
  }

  /**
   * Strip prefixes from a route path
   */
  private stripPathPrefixes(path: string): string {
    if (this.stripPrefixes.length === 0) {
      return path;
    }

    for (const prefix of this.stripPrefixes) {
      // Check if prefix is a regex pattern (surrounded by //)
      if (
        prefix.startsWith("//") &&
        prefix.endsWith("//") &&
        prefix.length > 4
      ) {
        // Remove the surrounding double slashes to get the regex pattern
        const regexPattern = prefix.slice(2, -2);
        const regex = new RegExp(`^${regexPattern}`);
        const match = path.match(regex);
        if (match) {
          const stripped = path.slice(match[0].length);
          return stripped.startsWith("/") ? stripped : `/${stripped}`;
        }
      } else {
        // Regular string prefix matching
        if (path.startsWith(prefix)) {
          const stripped = path.slice(prefix.length);
          return stripped.startsWith("/") ? stripped : `/${stripped}`;
        }
      }
    }

    return path;
  }

  /**
   * Build nested route structure from flat routes array
   */
  private buildRouteStructure(routes: RouteInfo[]): Record<string, any> {
    const structure: Record<string, any> = {};

    // Sort routes by path length (longest first) to build nested structure properly
    const sortedRoutes = [...routes].sort(
      (a, b) => b.path.length - a.path.length,
    );

    for (const route of sortedRoutes) {
      // Skip non-route files and API routes for the main route structure
      if (route.path.startsWith("/api/") || route.path.includes("/_")) {
        continue;
      }

      // Only include actual route files (page.tsx files), not special Next.js files
      const fileName = route.filePath.split("/").pop()?.toLowerCase();
      const isPageFile =
        fileName &&
        (fileName === "page.tsx" ||
          fileName === "page.ts" ||
          fileName === "page.jsx" ||
          fileName === "page.js");

      if (!isPageFile) {
        continue;
      }

      // Build structure using original path to maintain hierarchy
      const pathParts = this.parseRoutePath(route.path);
      let current = structure;

      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        const isLast = i === pathParts.length - 1;

        if (isLast) {
          // Last part - store the full path
          if (current[part] && typeof current[part] === "object") {
            // If this key already exists as an object (from nested routes),
            // we need to add an index property for the parent route
            current[part].index = route.path;
          } else if (current[part] && typeof current[part] === "string") {
            // If this key exists as a string (shorter route processed first),
            // convert to object structure
            const existingPath = current[part];
            current[part] = {
              index: existingPath,
              [part]: route.path, // This shouldn't happen, but handle it
            };
          } else {
            // Normal case - set the route path
            current[part] = route.path;
          }
        } else {
          // Intermediate part - create nested object
          if (!current[part]) {
            current[part] = {};
          } else if (typeof current[part] === "string") {
            // If this path part was previously set as a string (shorter route),
            // we need to convert it to an object and move the string to an index property
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
  private parseRoutePath(path: string): string[] {
    // Remove leading slash
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;

    if (cleanPath === "") {
      return ["index"];
    }

    // Split by slash and handle dynamic segments
    return cleanPath.split("/").map((part) => {
      // Handle optional catch-all segments like [[...slug]] - check first (most specific)
      if (part.startsWith("[[...") && part.endsWith("]]")) {
        const paramName = part.slice(5, -2);
        return `by${paramName.charAt(0).toUpperCase()}${paramName.slice(1)}Optional`;
      }
      // Handle catch-all segments like [...slug] - check second
      if (part.startsWith("[...") && part.endsWith("]")) {
        const paramName = part.slice(4, -1);
        return `by${paramName.charAt(0).toUpperCase()}${paramName.slice(1)}Rest`;
      }
      // Handle regular dynamic segments like [id] - check last (most general)
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
  private sanitizeKeyName(name: string): string {
    // Handle dynamic segments (already formatted as byParamName)
    if (name.startsWith("by")) {
      return name;
    }

    // For regular route segments, replace invalid characters
    let sanitized = name;

    // Replace hyphens with camelCase
    sanitized = sanitized.replace(/-([a-z])/g, (_, letter) =>
      letter.toUpperCase(),
    );

    // Replace other invalid characters with underscores
    sanitized = sanitized.replace(/[^a-zA-Z0-9_$]/g, "_");

    // Ensure it starts with a valid character
    if (!/^[a-zA-Z_$]/.test(sanitized)) {
      sanitized = `_${sanitized}`;
    }

    return sanitized;
  }

  /**
   * Generate file header with metadata
   */
  private generateHeader(project: ProjectInfo): string {
    const lines = [
      "/**",
      ` * Generated route types for ${project.framework} project`,
      ` * Framework: ${project.framework} ${project.version}`,
      ` * Root directory: ${project.rootDir}`,
      " *",
      " * This file provides type-safe access to your application routes.",
      " * Use the Routes object to access route paths with dot notation.",
      " */",
      "",
    ];

    return lines.join("\n");
  }

  /**
   * Generate the actual route object with inferred types and helper methods
   */
  private generateRouteObject(routeStructure: Record<string, any>): string {
    const _indentStr = " ".repeat(this.indent);

    let output = "// Named exports for granular tree-shaking\n";

    // Generate granular named exports for all route levels
    const allExports: Array<{ name: string; path: string[]; value: any }> = [];
    this.collectAllExports(routeStructure, [], allExports);

    // Generate exports for all collected items
    for (const exp of allExports) {
      const exportName = this.pathToExportName(exp.path);
      output += `export const ${exportName} = `;
      output += this.generateValueRecursive(exp.value);
      output += ";\n";
    }

    output +=
      "\n// Direct-reference routes object for dot notation (ultra tree-shakable)\n";
    output += "export const routes = ";
    output += this.generateGetterObjectRecursive(routeStructure, []);
    output += " as const;\n\n";

    // Generate default export
    output += "// Default export for convenience\n";
    output += "export default routes;\n";

    return output;
  }

  /**
   * Collect all exportable items from the route structure
   */
  private collectAllExports(
    obj: Record<string, any>,
    currentPath: string[],
    exports: Array<{ name: string; path: string[]; value: any }>,
  ): void {
    for (const [key, value] of Object.entries(obj)) {
      const newPath = [...currentPath, key];

      if (typeof value === "string") {
        // This is a route with a path - export it
        exports.push({
          name: this.pathToExportName(newPath),
          path: newPath,
          value: obj[key], // The full route object (string for simple routes, object for parameterized)
        });
      } else if (typeof value === "object" && value !== null) {
        // This is a nested object - export it and recurse
        exports.push({
          name: this.pathToExportName(newPath),
          path: newPath,
          value: value,
        });
        this.collectAllExports(value, newPath, exports);
      }
    }
  }

  /**
   * Convert a path array to a valid export name
   */
  private pathToExportName(path: string[]): string {
    const name = path.join("_");

    // Handle reserved JavaScript keywords
    const reservedKeywords = new Set([
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
      "bigint",
    ]);

    if (reservedKeywords.has(name)) {
      return `${name}_route`;
    }

    return name;
  }

  /**
   * Generate a simple value (string or object) without complex recursion
   */
  private generateValueRecursive(value: any): string {
    if (typeof value === "string") {
      // Check if this is a parameterized route (contains [param])
      if (value.includes("[") && value.includes("]")) {
        // Extract parameters from the route
        const params = this.extractParamsFromRoute(value);
        const paramNames = params.join(", ");
        const paramTypes = params.map((p) => `${p}: string`).join(", ");

        const strippedPath = this.stripPathPrefixes(value);

        // Create JSDoc comment for better IDE experience
        const templateExample = this.buildTemplateExample(strippedPath, params);

        let result = "(() => {\n";
        result += `  /**\n`;
        result += `   * @param {object} params - Route parameters\n`;
        result += `   * @returns {string} URL: ${templateExample}\n`;
        result += `   */\n`;
        result += `  const func = ({ ${paramNames} }: { ${paramTypes} }): string => \`${this.buildTemplateString(strippedPath, params)}\`;\n`;
        result += `  func.path = "${strippedPath}";\n`;
        result += `  return func as typeof func & { path: string };\n`;
        result += "})()";
        return result;
      } else {
        // Regular string route
        return `"${this.stripPathPrefixes(value)}"`;
      }
    }

    if (typeof value === "object" && value !== null) {
      // Check if this is a simple route object (only has index/base, possibly get)
      // vs a nested object (has other properties besides index/base/get)
      const hasOnlyRouteProps =
        Object.keys(value).every((k) =>
          ["index", "base", "get"].includes(k)
        );

      if (
        (value.index || value.base) &&
        typeof (value.index || value.base) === "string" &&
        hasOnlyRouteProps
      ) {
        // This is a simple route object with index/base and possibly get
        const routePath = value.index || value.base;
        const strippedPath = this.stripPathPrefixes(routePath);
        if (value.get) {
          // For parameterized routes, make the object callable
          // Extract parameters from the route path
          const params = this.extractParamsFromRoute(routePath);
          const paramObj = params.map((p) => `${p}: string`).join(", ");

          // Create JSDoc comment for better IDE experience
          const templateExample = this.buildTemplateExample(
            strippedPath,
            params,
          );

          let result = "(() => {\n";
          result += `  /**\n`;
          result += `   * @param {object} params - Route parameters\n`;
          result += `   * @returns {string} URL: ${templateExample}\n`;
          result += `   */\n`;
          result += `  const func = ({ ${paramObj} }: { ${paramObj} }) => \`${this.buildTemplateString(strippedPath, params)}\`;\n`;
          result += `  func.index = "${strippedPath}";\n`;
          result += `  return func as typeof func & { index: string };\n`;
          result += "})()";
          return result;
        } else {
          // Regular route object
          return `{ index: "${strippedPath}" }`;
        }
      }

      // Regular object - generate simple structure
      const entries = Object.entries(value);
      if (entries.length === 0) return "{}";

      // Sort entries: index first, then alphabetically
      const sortedEntries = entries.sort(([keyA], [keyB]) => {
        if (keyA === "index") return -1;
        if (keyB === "index") return 1;
        return keyA.localeCompare(keyB);
      });

      let result = "{\n";
      for (const [key, val] of sortedEntries) {
        if (key === "index") {
          // Handle index properties specially - use "index" as property name
          result += `  index: "${this.stripPathPrefixes(val as string)}"`;
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
  private buildTemplateType(path: string, _params: string[]): string {
    let result = "`";

    // Replace [param] with ${string}
    result += path.replace(/\[([^\]]+)\]/g, () => {
      return "${string}";
    });

    result += "`";
    return result;
  }

  /**
   * Build a human-readable example of the URL pattern
   */
  private buildTemplateExample(path: string, params: string[]): string {
    let result = path;

    // Replace [param] with <param> for readability
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
  private generateGetterObjectRecursive(
    obj: Record<string, any>,
    currentPath: string[],
  ): string {
    const entries = Object.entries(obj);
    if (entries.length === 0) return "{}";

    // Sort entries: index first, then alphabetically
    const sortedEntries = entries.sort(([keyA], [keyB]) => {
      if (keyA === "index" || keyA === "base") return -1;
      if (keyB === "index" || keyB === "base") return 1;
      return keyA.localeCompare(keyB);
    });

    let result = "{\n";

    for (const [key, value] of sortedEntries) {
      const newPath = [...currentPath, key];
      const exportName = this.pathToExportName(newPath);

      // Check if this is a simple route (only has index/base/get) vs nested object
      const isSimpleRoute =
        typeof value === "string" ||
        (typeof value === "object" &&
          value &&
          (value.index || value.base) &&
          Object.keys(value).every((k) =>
            ["index", "base", "get"].includes(k)
          ));

      if (isSimpleRoute) {
        // This is a leaf node (route) - directly reference the granular export
        result += `  ${key}: ${exportName},\n`;
      } else if (typeof value === "object" && value !== null) {
        // This is a nested object - recurse
        result += `  ${key}: ${this.generateGetterObjectRecursive(value, newPath)},\n`;
      }
    }

    result = result.replace(/,\n$/, "\n");
    result += "}";
    return result;
  }

  private generateObjectRecursive(obj: Record<string, any>, depth = 1): string {
    const indentStr = " ".repeat(this.indent);
    
    // Sort entries: index/base first, then alphabetically
    const entries = Object.entries(obj);
    if (entries.length === 0) return "{}";

    const sortedEntries = entries.sort(([keyA], [keyB]) => {
      // index and base come first
      if (keyA === "index" || keyA === "base") return -1;
      if (keyB === "index" || keyB === "base") return 1;
      // Then sort alphabetically
      return keyA.localeCompare(keyB);
    });

    let result = "{\n";

    for (const [key, value] of sortedEntries) {
      const currentIndent = indentStr.repeat(depth);

      // Handle index property specially - use "base" as property name
      if (key === "index" && typeof value === "string") {
        result += `${currentIndent}base: "${this.stripPathPrefixes(value)}",\n`;
        continue;
      }

      if (typeof value === "string") {
        // Check if this is a parameterized route (contains [param])
        if (value.includes("[") && value.includes("]")) {
          // Extract parameters from the route
          const params = this.extractParamsFromRoute(value);
          const paramNames = params.join(", ");
          const paramTypes = params.map((p) => `${p}: string`).join(", ");

          const strippedPath = this.stripPathPrefixes(value);
          result += `${currentIndent}${key}: {\n`;
          result += `${currentIndent}${indentStr}index: "${strippedPath}",\n`;
          result += `${currentIndent}${indentStr}get: ({ ${paramNames} }: { ${paramTypes} }) => \`${this.buildTemplateString(strippedPath, params)}\`,\n`;
          result += `${currentIndent}},\n`;
        } else {
          // Regular route - still wrap in object for consistency
          result += `${currentIndent}${key}: {\n`;
          result += `${currentIndent}${indentStr}index: "${this.stripPathPrefixes(value)}",\n`;
          result += `${currentIndent}},\n`;
        }
      } else if (typeof value === "object") {
        // Check if this is an index route or a regular nested object
        if (value.index && Object.keys(value).length === 1) {
          // This is purely an index route (shorter route that conflicts with nested routes)
          result += `${currentIndent}${key}: {\n`;
          result += `${currentIndent}${indentStr}base: "${this.stripPathPrefixes(value.index)}",\n`;
          result += `${currentIndent}},\n`;
        } else {
          // This is a nested object (may contain index + other properties)
          result += `${currentIndent}${key}: `;
          result += this.generateObjectRecursive(value, depth + 1);
          result += ",\n";
        }
      }
    }

    // Remove trailing comma and close
    result = result.replace(/,\n$/, "\n");
    result += `${indentStr.repeat(depth - 1)}}`;

    return result;
  }

  /**
   * Extract parameter names from a route string
   */
  private extractParamsFromRoute(route: string): string[] {
    const paramMatches = route.match(/\[([^\]]+)\]/g);
    if (!paramMatches) return [];

    return paramMatches.map((match) => {
      const param = match.slice(1, -1);
      // Handle catch-all and optional catch-all
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
  private buildTemplateString(route: string, params: string[]): string {
    let template = route;
    params.forEach((param) => {
      const bracketParam = `[${param}]`;
      const templateVar = `\${${param}}`;
      template = template.replace(bracketParam, templateVar);
    });
    return template;
  }
}
