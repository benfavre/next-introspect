# Next.js Introspect

[![npm version](https://badge.fury.io/js/next-introspect.svg)](https://badge.fury.io/js/next-introspect)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://benfavre.github.io/next-introspect/)

A comprehensive Next.js project introspection tool that analyzes routing structures, detects framework configurations, and provides detailed metadata about your Next.js application.

📖 **[Read the Full Documentation](https://benfavre.github.io/next-introspect/)**

## 🚀 Quick Start

**Install globally for CLI usage:**
```bash
npm install -g next-introspect
# or
bun add -g next-introspect
```

**Analyze your Next.js project:**
```bash
next-introspect introspect . --format typescript --output routes.ts
```

**Use in your code:**
```typescript
import { routes } from './routes';

const postUrl = routes.blog.posts.byId({ id: "123" });
// → "/blog/posts/123"
```

## ✨ Features

- **Framework Detection**: Automatically detects Next.js projects and router types (App Router, Pages Router, or both)
- **Route Analysis**: Comprehensive analysis of all routes including dynamic routes, API routes, and special pages
- **Multiple Output Formats**: Export results as JavaScript objects, JSON, or Markdown documentation
- **Analysis Modes**: Choose between basic, detailed, or comprehensive analysis levels
- **App Router Support**: Full support for Next.js 13+ App Router with special files, route groups, and metadata
- **Pages Router Support**: Complete analysis of traditional Pages Router with API routes and data fetching
- **Configuration Parsing**: Extracts Next.js configuration and project metadata
- **CLI Tool**: Command-line interface for quick analysis and file export
- **TypeScript**: Full TypeScript support with comprehensive type definitions

## 🚀 Installation

### Global Installation (CLI)

```bash
bun add -g next-introspect
# or
npm install -g next-introspect
```

### Local Installation (Programmatic)

```bash
bun add next-introspect
# or
npm install next-introspect
```

## 📖 Usage

### Command Line Interface

#### Basic Usage

```bash
# Analyze current directory
next-introspect introspect .

# Analyze specific project
next-introspect introspect /path/to/nextjs/project
```

#### Output Formats

```bash
# Export as JSON
next-introspect introspect . --format json --output routes.json

# Generate Markdown documentation
next-introspect introspect . --format markdown --output ROUTES.md

# Generate TypeScript types for type-safe route access
next-introspect introspect . --format typescript --output routes.ts

# Pretty-printed JSON with custom indentation
next-introspect introspect . --format json --indent 4
```

#### Analysis Modes

```bash
# Basic analysis (fastest)
next-introspect introspect . --mode basic

# Detailed analysis (includes component types)
next-introspect introspect . --mode detailed

# Comprehensive analysis (includes all metadata and exports)
next-introspect introspect . --mode comprehensive
```

#### Path Display Options

```bash
# Show paths relative to project root
next-introspect introspect . --path-style relative-to-project --show-file-paths

# Show paths relative to app directory
next-introspect introspect . --path-style relative-to-app --show-file-paths

# Strip custom prefix from paths
next-introspect introspect . --path-style strip-prefix --strip-prefix "src/app" --show-file-paths

# Combine with other options
next-introspect introspect . --format json --path-style relative-to-project --show-file-paths --output routes.json
```

#### Advanced Options

```bash
# Quiet mode (suppress progress messages)
next-introspect introspect . --quiet --output result.json

# Full command with all options
next-introspect introspect /path/to/project \
  --format markdown \
  --mode comprehensive \
  --output project-routes.md
```

#### Watch Mode

Watch mode continuously monitors your Next.js project for file changes and automatically re-runs the analysis when routes, components, or configuration files are modified.

```bash
# Start watch mode with default settings
next-introspect introspect . --watch

# Watch mode with custom format and output
next-introspect introspect . --watch --format typescript --output routes.ts

# Watch mode with quiet output (only show changes)
next-introspect introspect . --watch --quiet --output routes.json

# Combine with other options
next-introspect introspect . --watch --mode comprehensive --format markdown --output ROUTES.md
```

### Features

- **Automatic Re-analysis**: Re-runs analysis whenever relevant files change
- **Smart Filtering**: Only watches route-related files (ignores node_modules, .next, etc.)
- **Debounced Updates**: Prevents excessive re-runs during rapid file changes
- **Clean Output**: Shows file change notifications and analysis results
- **Graceful Shutdown**: Properly handles Ctrl+C to stop watching

### Watched File Types

Watch mode monitors these file extensions for changes:
- `.js`, `.jsx`, `.ts`, `.tsx` - Route components and API handlers
- `.json` - Package.json and configuration files
- Configuration files - `next.config.*`, `tsconfig.json`, etc.

### Ignored Directories

The following directories are automatically ignored:
- `node_modules/` - Dependencies
- `.next/` - Build output
- `.git/` - Version control
- `dist/` - Distribution files
- `build/` - Build artifacts

### Usage Examples

```bash
# Development workflow: Watch for changes during development
next-introspect introspect . --watch --format typescript --output src/routes.ts

# Documentation: Auto-update route documentation
next-introspect introspect . --watch --format markdown --output docs/ROUTES.md

# CI/CD: Monitor route changes in deployment pipeline
next-introspect introspect . --watch --quiet --output routes.json
```

### Programmatic API

```typescript
import { NextIntrospect } from 'next-introspect';

// Create introspector instance
const introspect = new NextIntrospect('/path/to/nextjs/project', {
  mode: 'comprehensive'
});

// Analyze project
const projectInfo = await introspect.analyze();

// Get routes
const routes = introspect.getRoutes();

// Format results
const jsonResult = introspect.format('json');
const markdownResult = introspect.format('markdown');
const typescriptResult = introspect.format('typescript');
const objectResult = introspect.format('object');

// Export to file
await introspect.exportToFile('routes.json', 'json');

// Change analysis mode
introspect.setMode('detailed');
await introspect.reanalyze();
```

#### Advanced API Usage

```typescript
import { NextIntrospect } from 'next-introspect';

const introspect = new NextIntrospect('./my-nextjs-app');

// Get comprehensive result
const result = await introspect.analyze();

// Filter routes by type
const appRoutes = introspect.getRoutesByRouter('app');
const pagesRoutes = introspect.getRoutesByRouter('pages');
const apiRoutes = introspect.getApiRoutes();
const dynamicRoutes = introspect.getDynamicRoutes();
const specialPages = introspect.getSpecialPages();

// Access raw project info
const projectInfo = introspect.getProjectInfo();
console.log(`Framework: ${projectInfo.framework} ${projectInfo.version}`);
console.log(`Router: ${projectInfo.router}`);
```

## 📊 Analysis Modes

### Basic Mode
- Route paths and patterns
- Dynamic segment detection
- Router type identification
- **Fastest analysis**

### Detailed Mode
- Everything in basic mode
- Component types (server/client)
- Special files detection
- Route group and parallel route identification

### Comprehensive Mode
- Everything in detailed mode
- Exported functions and metadata
- Data fetching methods (getStaticProps, getServerSideProps, etc.)
- Next.js configuration parsing
- **Most detailed but slower**

## 🎯 Path Display Styles

The package provides flexible path display options to customize how file paths are shown in the output.

### Route Groups

**Important**: Next.js route groups (folders wrapped in parentheses like `(dashboard)`) are **not** part of the actual URL path. They are organizational only. The package correctly excludes route groups from the `path` field while preserving them in the `filePath` field.

**Example:**
- File: `src/app/(dashboard)/customer/page.tsx`
- Route Path: `/customer` ✅
- File Path: `src/app/(dashboard)/customer/page.tsx` ✅

### Available Styles

- **`absolute`** (default): Show full absolute paths
- **`relative-to-project`**: Show paths relative to the project root directory
- **`relative-to-app`**: Show paths relative to the app directory (`src/app` or `app/`)
- **`relative-to-pages`**: Show paths relative to the pages directory (`src/pages` or `pages/`)
- **`strip-prefix`**: Strip a custom prefix from paths

### Usage

```typescript
// Programmatic usage
const introspect = new NextIntrospect('./my-app', {
  pathDisplay: {
    style: 'relative-to-project',
    showFilePaths: true
  }
});
```

### Examples

```bash
# Default: absolute paths
next-introspect introspect .
# filePath: "/full/path/to/project/src/app/page.tsx"

# Relative to project root
next-introspect introspect . --path-style relative-to-project --show-file-paths
# filePath: "src/app/page.tsx"

# Relative to app directory
next-introspect introspect . --path-style relative-to-app --show-file-paths
# filePath: "page.tsx"

# Strip custom prefix
next-introspect introspect . --path-style strip-prefix --strip-prefix "src/" --show-file-paths
# filePath: "app/page.tsx"

# Package.json summary (much more concise)
next-introspect introspect . --package-summary

# Include scripts in summary
next-introspect introspect . --package-summary --include-scripts

# Include dependencies in summary
next-introspect introspect . --package-summary --include-deps
```

## 📝 Route Metadata

Add human-readable titles and descriptions to your routes by providing a metadata file.

### JSON Format

```json
[
  {
    "magazine.publisher": {
      "title": "Magazine Publisher",
      "description": "Manage magazine publishing workflows"
    }
  },
  {
    "magazine.publisher.templates": {
      "title": "Publisher Templates",
      "description": "Templates for magazine publishing",
      "category": "admin"
    }
  }
]
```

### TOML Format

```toml
[magazine.publisher]
title = "Magazine Publisher"
description = "Manage magazine publishing workflows"

[magazine.publisher.templates]
title = "Publisher Templates"
description = "Templates for magazine publishing"
category = "admin"
```

### Usage

```bash
# Exclude specific fields from output
next-introspect introspect . --exclude-fields "filePath,pattern,router" --format json

# Combine with other options
next-introspect introspect . --exclude-fields "filePath" --metadata routes.json --format markdown

# Use JSON metadata file
next-introspect introspect . --metadata routes.json --format markdown

# Use TOML metadata file
next-introspect introspect . --metadata routes.toml --format json
```

## 🔀 Merging Existing Results

Merge existing introspection JSON files with additional metadata without re-analyzing the project.

### Programmatic Usage

```typescript
// Merge metadata into existing results
const introspect = new NextIntrospect('./dummy', {});
const mergedResult = await introspect.mergeWithJson('existing-routes.json', {
  'magazine.publisher': {
    title: 'Magazine Publisher',
    description: 'Manage magazine publishing workflows'
  }
});

// Merge full introspection results
const mergedResult = await introspect.mergeWithJson('routes1.json', otherIntrospectionResult);
```

### CLI Usage

```bash
# Merge JSON file with metadata
next-introspect merge routes.json metadata.json --output merged.json

# Merge and output as Markdown
next-introspect merge routes.json metadata.json --format markdown --output merged.md

# Merge with different indentation
next-introspect merge routes.json metadata.json --indent 4
```

### Use Cases

- **Incremental Updates**: Add metadata to existing route analysis
- **Collaborative Workflows**: Different team members add different types of metadata
- **Automation**: CI/CD pipelines can add environment-specific metadata
- **Version Control**: Keep route analysis and human-readable metadata separate

### Key Matching

Metadata is matched to routes using multiple strategies:
1. **Exact path match**: `/magazine/publisher`
2. **Dot notation**: `magazine.publisher` (path segments joined with dots)
3. **Router prefix**: `app.magazine.publisher` (with router type prefix)

## 🎯 Output Formats

## 🏗️ Nested Route Structure

The `--nested` option transforms the flat route array into a hierarchical JSON structure that mirrors your application's URL paths.

### Flat Structure (Default)

```json
{
  "routes": [
    { "path": "/customer/shipping/notifications", "router": "app" },
    { "path": "/customer/shipping", "router": "app" },
    { "path": "/magazine", "router": "app" }
  ]
}
```

### Nested Structure (`--nested`)

```json
{
  "routes": {
    "customer": {
      "shipping": {
        "notifications": { "router": "app", "filePath": "..." },
        "": { "router": "app", "filePath": "..." }  // /customer/shipping route
      }
    },
    "magazine": { "router": "app", "filePath": "..." }
  }
}
```

### Benefits

- **Visual hierarchy**: See your route structure at a glance
- **Path relationships**: Understand parent-child route relationships
- **Easier navigation**: Programmatically traverse route trees
- **URL mirroring**: Structure matches actual application URLs

### Options

- **`--nested`**: Enable nested output format
- **`--include-empty-segments`**: Include empty path segments (for root routes)

## 🔷 TypeScript Output Format

The `--format typescript` option generates **tree-shakable** TypeScript code that provides **type-safe route access** using dot notation. Each top-level route is exported as a named export for optimal bundler tree-shaking.

### Generated Structure

```typescript
// Ultra-granular named exports for maximum tree-shaking
export const blog = {
  index: { path: "/blog" },
  posts: {
    byId: { path: "/blog/posts/[id]", get: ({ id }: { id: string }) => `/blog/posts/${id}` },
    bySlugRest: { path: "/blog/posts/[...slug]", get: ({ slug }: { slug: string[] }) => `/blog/posts/${slug.join('/')}` }
  }
};
export const blog_posts = {
  byId: { path: "/blog/posts/[id]", get: ({ id }: { id: string }) => `/blog/posts/${id}` },
  bySlugRest: { path: "/blog/posts/[...slug]", get: ({ slug }: { slug: string[] }) => `/blog/posts/${slug.join('/')}` }
};
export const blog_posts_byId = {
  path: "/blog/posts/[id]",
  get: ({ id }: { id: string }) => `/blog/posts/${id}`
};
export const blog_posts_bySlugRest = {
  path: "/blog/posts/[...slug]",
  get: ({ slug }: { slug: string[] }) => `/blog/posts/${slug.join('/')}`
};
export const settings = { socialAccounts: { path: "/settings/social-accounts" } };
export const settings_socialAccounts = { path: "/settings/social-accounts" };

// Getter-based routes object mirroring the structure (tree-shakable)
export const routes = {
  get blog() {
    return {
  get posts() {
    return {
  get byId() {
    return blog_posts_byId;
  }
    };
  }
    };
  },
  get settings() {
    return {
  get socialAccounts() {
    return settings_socialAccounts;
  }
    };
  }
} as const;

// Default export for convenience
export default routes;
```

// Additional named exports for individual routes
export const fournisseur = {
  byVendorId: {
    path: "/fournisseur/[vendorId]",  // Dynamic segment [vendorId]
    get: ({ vendorId }: { vendorId: string }) => `/fournisseur/${vendorId}`
  },
  login: {
    path: "/fournisseur/login"
  },
  session: {
    path: "/fournisseur/session"
  }
};

export const fournisseur_byVendorId = fournisseur.byVendorId;

export const sites = {
  avivre_com: {
    path: "/sites/avivre.com"  // /sites/avivre.com → dots become underscores
  },
  gestionEnt_fr: {
    path: "/sites/gestion-ent.fr"  // /sites/gestion-ent.fr → camelCase + underscores
  }
};

export type Routes = typeof routes;
```

### Usage in Your Code

```typescript
// Maximum tree-shaking: import only what you need
import { blog_posts_byId } from './routes';

// Only the specific route is included in your bundle
const postUrl = blog_posts_byId.get({ id: "123" });     // "/blog/posts/123"

// Ultra tree-shakable imports (recommended for minimal bundles)
import { fournisseur_byVendorId } from './routes';       // Only imports this specific route
const url1 = fournisseur_byVendorId({ vendorId: "123" }); // "/fournisseur/123"

// Tree-shakable section imports
import { blog_posts } from './routes';                   // Includes posts.byId
import { blog } from './routes';                         // Includes entire blog tree

// Convenient dot notation (still tree-shakable!)
import { routes } from './routes';
const postUrl = routes.blog.posts.byId({ id: "123" });  // IntelliSense: "URL: /blog/posts/<id>"
const vendorUrl = routes.fournisseur.byVendorId({ vendorId: "abc" }); // IntelliSense: "URL: /fournisseur/<vendorId>"

// Access the path template
const postTemplate = routes.blog.posts.byId.path;       // "/blog/posts/[id]"

// Traditional get method still available (backward compatibility)
const altUrl = routes.blog.posts.byId.get({ id: "123" }); // Same result

// Use with Next.js Link or router.push
<Link href={routes.blog.posts.byId.get({ id: postId })}>
  View Post
</Link>

// TypeScript will infer the correct types automatically
function navigateTo(route: string) {
  // route is typed as a union of all possible route strings
}
```

### Features

- **Type Safety**: Full TypeScript intellisense and compile-time checking through `as const`
- **Dot Notation**: Access routes using familiar JavaScript object notation
- **Consistent API**: All routes have a `path` property for uniform access
- **Parameterized Routes**: Dynamic routes include type-safe getter methods (e.g., `byId.get({ id: "123" })`)
- **Special Character Handling**: Hyphens become camelCase, dots become underscores
- **Route Filtering**: Only includes actual navigable routes (page.tsx files), excludes special Next.js files
- **Catch-All Route Support**: `[...slug]` becomes `bySlugRest`, `[[...slug]]` becomes `bySlugOptional`
- **Auto-completion**: IDEs provide full auto-completion for all routes and parameters
- **No Runtime Overhead**: Pure TypeScript `as const` assertions, zero runtime cost
- **IDE IntelliSense**: JSDoc comments show expected URL patterns (e.g., `URL: /fournisseur/<vendorId>`)
- **Parameter Validation**: Compile-time checking of required route parameters
- **Maintainable**: Automatically stays in sync with your route structure

### Benefits

- **🚀 Ultra-Granular Tree-Shaking**: Every route exported individually + direct references in routes object
- **📦 Minimal Bundle Size**: Direct references enable tree-shaking even with dot notation
- **🚀 True Tree-Shaking**: Bundlers eliminate unused routes regardless of import style
- **📞 Callable Routes**: Parameterized routes are directly callable: `byId({ id: "123" })`
- **🎯 Maximum Flexibility**: Import at any granularity from individual routes to entire sections
- **🔄 Backward Compatible**: Existing `.get()` method still works for gradual migration
- **🏗️ Structural Mirroring**: The `routes` object perfectly mirrors your route hierarchy

### Command Examples

```bash
# Generate TypeScript route definitions
next-introspect introspect . --format typescript --output routes.ts

# Generate with custom namespace
next-introspect introspect . --format typescript --namespace "AppRoutes" --output app-routes.ts

# Combine with other options
next-introspect introspect . --format typescript --mode comprehensive --output routes.ts
```

### Programmatic Generation

```typescript
import { NextIntrospect } from 'next-introspect';

const introspect = new NextIntrospect('./my-app');
await introspect.analyze();

// Generate TypeScript routes
const typescriptCode = introspect.format('typescript');
await introspect.exportToFile('routes.ts', 'typescript');
```

This format is perfect for applications that need type-safe route references throughout the codebase, providing both runtime values and compile-time type checking.

## 🚫 Excluding Fields

Remove unwanted fields from the output to create cleaner, more focused results.

### Available Options

- **`--exclude-fields <fields>`**: Comma-separated list of fields to exclude from route objects
- **`--strip-prefixes <prefixes>`**: Strip multiple prefixes from route paths (TypeScript format only)

### Common Exclusions

```bash
# Remove file system information
next-introspect introspect . --exclude-fields "filePath" --format json
```

## 🎯 Strip Prefixes from Route Paths

The `--strip-prefixes` option allows you to remove common prefixes from route paths when generating TypeScript route definitions. This is useful for creating route definitions that are relative to specific sections of your application. **Prefix stripping only affects the final path values in the output - the route structure and hierarchy remain unchanged.** All resulting paths will have a leading slash (/).

### Usage

```bash
# Strip single prefix
next-introspect introspect . --format typescript --strip-prefixes "/sites/" --output routes.ts

# Strip multiple prefixes (comma-separated in single option)
next-introspect introspect . --format typescript --strip-prefixes "/sites/,/default/,/api/" --output routes.ts

# Strip multiple prefixes (multiple --strip-prefixes flags) - RECOMMENDED
next-introspect introspect . --format typescript \
  --strip-prefixes "/sites/" \
  --strip-prefixes "/default/" \
  --strip-prefixes "/api/" \
  --output routes.ts

# Use regex patterns (surrounded by double forward slashes)
next-introspect introspect . --format typescript --strip-prefixes "//\/sites\/[^\/]+\///" --output routes.ts
```

### Example: Multi-Tenant Site Routes

```bash
# Strip /sites/ prefix (preserves site-specific hierarchy and structure)
# Before stripping: /sites/avivre.com/magazine/extrait-133-janvier-fevrier-2024
# After stripping: /avivre.com/magazine/extrait-133-janvier-fevrier-2024
# Structure preserved: routes.sites.avivre_com.magazine.extrait_133JanvierFevrier_2024.path
next-introspect introspect . --format typescript --strip-prefixes "/sites/" --output routes.ts

# Use regex to strip /sites/{any-site}/ entirely (flattens to root level)
# Before stripping: /sites/avivre.com/magazine/extrait-133-janvier-fevrier-2024
# After stripping: /magazine/extrait-133-janvier-fevrier-2024
# Result: routes.magazine.extrait_133JanvierFevrier_2024.path
next-introspect introspect . --format typescript --strip-prefixes "//\/sites\/[^\/]+\///" --output routes.ts
```

### Example: Application Section Routes

```bash
# Strip common prefixes to create section-specific route definitions
next-introspect introspect . --format typescript \
  --strip-prefixes "/default/,/crm/,/customer/,/guide/,/invoice/,/annuaire/,/qr/,/fournisseur/,/shop/,/support/,/publisher/,/hr/,/pos/" \
  --output routes.ts
```

### Generated Output

**Before stripping:**
```typescript
export const routes = {
  sites: {
    avivre_com: {
      magazine: {
        extrait_133JanvierFevrier_2024: {
          path: "/sites/avivre.com/magazine/extrait-133-janvier-fevrier-2024"
        }
      }
    }
  }
}
```

**After stripping `/sites/`:**
```typescript
export const routes = {
  avivre_com: {
    magazine: {
      extrait_133JanvierFevrier_2024: {
        path: "avivre.com/magazine/extrait-133-janvier-fevrier-2024"
      }
    }
  }
}
```

**After stripping `/sites/[^/]+//` (regex):**
```typescript
export const routes = {
  magazine: {
    extrait_133JanvierFevrier_2024: {
      path: "magazine/extrait-133-janvier-fevrier-2024"
    }
  }
}
```

### Use Cases

- **Multi-tenant applications**: Strip `/sites/` or `/tenants/` prefixes
- **API routes**: Remove `/api/` prefixes for cleaner client-side route definitions
- **Section-specific routing**: Create route definitions scoped to specific app sections
- **Deployment flexibility**: Generate routes that work in different deployment contexts

**Before (with all fields):**
```json
{
  "path": "/customer/shipping",
  "filePath": "/app/src/app/customer/shipping/page.tsx",
  "pattern": "static",
  "router": "app"
}
```

**After (excluding filePath,pattern,router):**
```json
{
  "path": "/customer/shipping"
}
```

### Programmatic Usage

```typescript
const introspect = new NextIntrospect('./project', {
  outputFormat: {
    excludeFields: ['filePath', 'pattern', 'router']
  }
});
```

## 🎯 Output Formats

### JSON Format

```json
{
  "project": {
    "framework": "nextjs",
    "version": "14.0.0",
    "router": "app",
    "rootDir": "/path/to/project",
    "sourceDirs": {
      "app": "app"
    }
  },
  "routes": [
    {
      "path": "/",
      "filePath": "/path/to/project/app/page.tsx",
      "pattern": "static",
      "router": "app",
      "appRouter": {
        "segment": "",
        "specialFiles": {
          "page": true,
          "layout": true
        },
        "componentTypes": {
          "page": "server",
          "layout": "server"
        }
      }
    }
  ],
  "metadata": {
    "analyzedAt": "2024-01-15T10:30:00.000Z",
    "duration": 245,
    "filesProcessed": 12,
    "mode": "comprehensive"
  }
}
```

### Markdown Format

```markdown
# Next.js Project Introspection

## Project Information
- **Framework**: nextjs 14.0.0
- **Router Type**: App Router
- **Root Directory**: /path/to/project

## Routes Overview
- **Total Routes**: 8
- **App Router Routes**: 8
- **Pages Router Routes**: 0
- **API Routes**: 0
- **Dynamic Routes**: 2

## App Router Routes

### /
- **Pattern**: Static
- **Special Files**: `layout`, `page`
- **Components**: layout: server, page: server

### /about
- **Pattern**: Static
- **Special Files**: `page`
- **Components**: page: server

### /products/[slug]
- **Pattern**: Dynamic
- **Dynamic Segments**: `slug`
- **Special Files**: `page`
- **Components**: page: server
```

### JavaScript Object Format

Returns the complete `IntrospectionResult` object with full TypeScript typing for programmatic use.

## 🏗️ Architecture

The package is built with a modular architecture:

### Core Components

- **`NextIntrospect`**: Main class providing the public API
- **`FrameworkAdapter`**: Abstract base for framework-specific analysis
- **`NextJsAdapter`**: Next.js implementation of framework adapter
- **Parsers**: Specialized parsers for different routing systems
  - `AppRouterParser`: Analyzes `app/` directory structure
  - `PagesRouterParser`: Analyzes `pages/` directory structure
  - `ConfigParser`: Parses Next.js configuration files
- **Formatters**: Convert results to different output formats
  - `ObjectFormatter`: Raw JavaScript object
  - `JsonFormatter`: JSON serialization
  - `MarkdownFormatter`: Documentation generation

### Extensibility

The adapter pattern allows adding support for other frameworks. Custom adapters can be created to support any web framework with routing capabilities.

## 🛠️ Creating Custom Adapters

You can extend next-introspect to support other frameworks by creating custom adapters. This section provides a comprehensive guide to building your own framework adapter.

### Adapter Interface

All adapters must implement the `FrameworkAdapter` interface:

```typescript
interface FrameworkAdapter {
  /** Framework name (e.g., 'remix', 'nuxt', 'sveltekit') */
  name: string;

  /** Detect if this framework is present in the project */
  detect(projectPath: string): Promise<boolean>;

  /** Get project information specific to this framework */
  getProjectInfo(projectPath: string): Promise<ProjectInfo>;

  /** Get routes for this framework */
  getRoutes(projectPath: string, mode: OutputMode): Promise<RouteInfo[]>;
}
```

### Step-by-Step Guide

#### 1. Create Your Adapter Class

Extend `BaseAdapter` for common functionality:

```typescript
import { BaseAdapter } from 'next-introspect';
import type { ProjectInfo, RouteInfo, OutputMode } from 'next-introspect';

export class MyFrameworkAdapter extends BaseAdapter {
  constructor() {
    super('myframework'); // Framework name
  }

  // Implement required methods...
}
```

#### 2. Implement Detection Logic

The `detect()` method should check for framework-specific files or dependencies:

```typescript
async detect(projectPath: string): Promise<boolean> {
  // Check for package.json dependency
  const version = await this.getFrameworkVersion(projectPath, 'my-framework');
  if (version) return true;

  // Check for framework-specific files
  const hasConfig = await this.fileExists(path.join(projectPath, 'my.config.js'));
  const hasRoutes = await this.directoryExists(path.join(projectPath, 'routes'));

  return hasConfig || hasRoutes;
}
```

#### 3. Implement Project Info

The `getProjectInfo()` method should gather framework-specific information:

```typescript
async getProjectInfo(projectPath: string): Promise<ProjectInfo> {
  // Validate project path
  await this.validateProjectPath(projectPath);

  // Get framework version
  const version = await this.getFrameworkVersion(projectPath, 'my-framework');

  // Detect configuration
  const config = await this.parseFrameworkConfig(projectPath);

  // Determine source directories
  const sourceDirs: Record<string, string> = {};
  if (await this.directoryExists(path.join(projectPath, 'routes'))) {
    sourceDirs.routes = 'routes';
  }
  if (await this.directoryExists(path.join(projectPath, 'src', 'routes'))) {
    sourceDirs.routes = 'src/routes';
  }

  return {
    framework: 'myframework',
    version: version || 'unknown',
    rootDir: await this.normalizePath(projectPath),
    config,
    sourceDirs,
  };
}
```

#### 4. Implement Route Analysis

The `getRoutes()` method should analyze the framework's routing structure:

```typescript
async getRoutes(projectPath: string, mode: OutputMode): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = [];

  // Get parser configuration
  const config = this.createParserConfig(projectPath, mode, {
    include: ['routes/**/*', 'src/routes/**/*'],
    exclude: ['**/*.test.*', '**/*.spec.*']
  });

  // Analyze routes directory
  const routesDir = await this.findRoutesDirectory(projectPath);
  if (routesDir) {
    const directoryRoutes = await this.parseRoutesDirectory(routesDir, config);
    routes.push(...directoryRoutes);
  }

  return routes;
}
```

### Helper Methods

#### Configuration Parsing

```typescript
private async parseFrameworkConfig(projectPath: string): Promise<any> {
  const fs = await import('fs/promises');
  const path = await import('path');

  try {
    const configPath = path.join(projectPath, 'my.config.js');
    const configContent = await fs.readFile(configPath, 'utf-8');

    // Parse configuration (implement your parsing logic)
    return this.parseConfigFile(configContent);
  } catch (_error) {
    return {}; // Return default config
  }
}
```

#### Route Directory Discovery

```typescript
private async findRoutesDirectory(projectPath: string): Promise<string | null> {
  const candidateDirs = [
    path.join(projectPath, 'routes'),
    path.join(projectPath, 'src', 'routes'),
    path.join(projectPath, 'app', 'routes')
  ];

  for (const dir of candidateDirs) {
    if (await this.directoryExists(dir)) {
      return dir;
    }
  }

  return null;
}
```

#### Route Parsing

```typescript
private async parseRoutesDirectory(
  routesDir: string,
  config: ParserConfig
): Promise<RouteInfo[]> {
  const routes: RouteInfo[] = [];

  // Use the traverseDirectory utility
  const fs = await import('fs/promises');
  const path = await import('path');

  const entries = await fs.readdir(routesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Handle nested routes
      const nestedRoutes = await this.parseNestedRoutes(
        path.join(routesDir, entry.name),
        config
      );
      routes.push(...nestedRoutes);
    } else if (entry.isFile() && this.isRouteFile(entry.name)) {
      // Handle route files
      const route = await this.parseRouteFile(
        path.join(routesDir, entry.name),
        config
      );
      if (route) routes.push(route);
    }
  }

  return routes;
}
```

### Utility Methods

```typescript
private isRouteFile(filename: string): boolean {
  // Define which files are considered routes
  return filename.endsWith('.tsx') ||
         filename.endsWith('.jsx') ||
         filename.endsWith('.ts') ||
         filename.endsWith('.js');
}

private parseRouteFile(filePath: string, config: ParserConfig): Promise<RouteInfo | null> {
  // Implement route file parsing logic
  const relativePath = await this.getRelativePath(config.rootDir, filePath);
  const routePath = this.convertFilePathToRoute(relativePath);

  return {
    path: routePath,
    filePath: relativePath,
    router: 'myframework',
    pattern: 'static', // or 'dynamic' based on analysis
  };
}

private convertFilePathToRoute(filePath: string): string {
  // Convert file path to route path
  // e.g., 'routes/users/[id].tsx' → '/users/[id]'
  return filePath
    .replace(/^routes\//, '/')
    .replace(/^src\/routes\//, '/')
    .replace(/\.tsx?$/, '')
    .replace(/\.jsx?$/, '')
    .replace(/\/index$/, '/'); // index files become directory routes
}
```

### Complete Example: Remix Adapter

```typescript
import { BaseAdapter } from 'next-introspect';
import type { ProjectInfo, RouteInfo, OutputMode } from 'next-introspect';

export class RemixAdapter extends BaseAdapter {
  constructor() {
    super('remix');
  }

  async detect(projectPath: string): Promise<boolean> {
    const hasRemix = await this.getFrameworkVersion(projectPath, 'remix');
    const hasRoutes = await this.directoryExists(path.join(projectPath, 'app', 'routes'));
    return Boolean(hasRemix || hasRoutes);
  }

  async getProjectInfo(projectPath: string): Promise<ProjectInfo> {
    await this.validateProjectPath(projectPath);

    const version = await this.getFrameworkVersion(projectPath, 'remix');
    const baseInfo = await this.getBaseProjectInfo(projectPath, 'remix', version);

    return {
      ...baseInfo,
      framework: 'remix',
      version: version || 'unknown',
      rootDir: await this.normalizePath(projectPath),
      sourceDirs: {
        routes: 'app/routes'
      }
    };
  }

  async getRoutes(projectPath: string, mode: OutputMode): Promise<RouteInfo[]> {
    const routesDir = path.join(projectPath, 'app', 'routes');
    const routes: RouteInfo[] = [];

    if (!await this.directoryExists(routesDir)) {
      return routes;
    }

    const config = this.createParserConfig(projectPath, mode, {
      include: ['app/routes/**/*'],
      exclude: ['**/*.test.*', '**/*.spec.*']
    });

    // Parse routes recursively
    const parsedRoutes = await this.parseRemixRoutes(routesDir, config);
    routes.push(...parsedRoutes);

    return routes;
  }

  private async parseRemixRoutes(
    routesDir: string,
    config: ParserConfig
  ): Promise<RouteInfo[]> {
    const routes: RouteInfo[] = [];
    const fs = await import('fs/promises');
    const path = await import('path');

    const entries = await fs.readdir(routesDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(routesDir, entry.name);

      if (entry.isDirectory()) {
        const nestedRoutes = await this.parseRemixRoutes(fullPath, config);
        routes.push(...nestedRoutes);
      } else if (this.isRouteFile(entry.name)) {
        const route = await this.createRemixRoute(fullPath, config);
        if (route) routes.push(route);
      }
    }

    return routes;
  }

  private async createRemixRoute(
    filePath: string,
    config: ParserConfig
  ): Promise<RouteInfo | null> {
    const relativePath = await this.getRelativePath(config.rootDir, filePath);

    // Convert Remix route convention to URL path
    let routePath = relativePath
      .replace(/^app\/routes\//, '/')
      .replace(/\.tsx?$/, '')
      .replace(/\.jsx?$/, '');

    // Handle Remix route patterns
    routePath = routePath
      .replace(/\$/g, ':') // $param → :param
      .replace(/\[([^\]]+)\]/g, ':$1') // [param] → :param
      .replace(/\.([^.]+)\.tsx?$/, '/$1'); // nested.route.tsx → /nested/route

    // Remove index from path
    routePath = routePath.replace(/\/index$/, '/');

    return {
      path: routePath || '/',
      filePath: relativePath,
      router: 'remix',
      pattern: routePath.includes(':') ? 'dynamic' : 'static'
    };
  }
}
```

### Integration with NextIntrospect

Once you've created your adapter, you can use it programmatically:

```typescript
import { NextIntrospect } from 'next-introspect';
import { MyFrameworkAdapter } from './MyFrameworkAdapter';

// Create introspector with custom adapter
const introspect = new NextIntrospect('./my-project', {
  adapters: [new MyFrameworkAdapter()]
});

// Analyze project
const result = await introspect.analyze();
console.log(`Found ${result.routes.length} routes in ${result.project.framework}`);
```

### Testing Your Adapter

Create comprehensive tests for your adapter:

```typescript
import { describe, it, expect } from 'vitest';
import { MyFrameworkAdapter } from './MyFrameworkAdapter';

describe('MyFrameworkAdapter', () => {
  const adapter = new MyFrameworkAdapter();

  describe('detect', () => {
    it('should detect framework projects', async () => {
      const detected = await adapter.detect('./test-project');
      expect(detected).toBe(true);
    });

    it('should not detect non-framework projects', async () => {
      const detected = await adapter.detect('./empty-project');
      expect(detected).toBe(false);
    });
  });

  describe('getProjectInfo', () => {
    it('should return project information', async () => {
      const info = await adapter.getProjectInfo('./test-project');
      expect(info.framework).toBe('myframework');
      expect(info.version).toBeDefined();
    });
  });

  describe('getRoutes', () => {
    it('should analyze routes correctly', async () => {
      const routes = await adapter.getRoutes('./test-project', 'detailed');
      expect(Array.isArray(routes)).toBe(true);
      expect(routes[0]).toHaveProperty('path');
      expect(routes[0]).toHaveProperty('filePath');
    });
  });
});
```

### Best Practices

1. **Framework Detection**: Check for both dependencies and framework-specific files
2. **Error Handling**: Use try-catch blocks and provide meaningful error messages
3. **Path Normalization**: Use `this.normalizePath()` and `this.getRelativePath()` for cross-platform compatibility
4. **Configuration Parsing**: Handle both JavaScript and JSON configuration files
5. **Route Patterns**: Accurately identify static, dynamic, and catch-all routes
6. **Testing**: Create comprehensive tests covering different project structures
7. **Documentation**: Document your adapter's specific requirements and limitations


## 🔧 Configuration Options

### IntrospectionOptions

```typescript
interface IntrospectionOptions {
  mode?: 'basic' | 'detailed' | 'comprehensive';
  include?: string[];     // File patterns to include
  exclude?: string[];     // File patterns to exclude
  maxDepth?: number;      // Maximum directory depth
  ignorePatterns?: string[]; // Additional ignore patterns
  followSymlinks?: boolean;  // Follow symbolic links
}
```

### Default Configuration

```typescript
const defaultOptions: IntrospectionOptions = {
  mode: 'comprehensive',
  maxDepth: 10,
  followSymlinks: false,
  exclude: [
    'node_modules/**',
    '.next/**',
    'dist/**',
    'build/**',
    '**/*.test.*',
    '**/*.spec.*'
  ]
};
```

## 📝 Route Patterns Detected

### App Router Patterns

- **Static Routes**: `app/page.tsx` → `/`
- **Dynamic Routes**: `app/products/[id]/page.tsx` → `/products/[id]`
- **Catch-all Routes**: `app/docs/[...slug]/page.tsx` → `/docs/[...slug]`
- **Optional Catch-all**: `app/shop/[[...categories]]/page.tsx` → `/shop/[[...categories]]`
- **Route Groups**: `app/(group)/page.tsx` → `/` (group not in URL)
- **Parallel Routes**: `app/@modal/page.tsx` → Parallel route slot
- **Intercepting Routes**: `app/(.)product/page.tsx` → Intercepting route

### Pages Router Patterns

- **Static Routes**: `pages/about.tsx` → `/about`
- **Dynamic Routes**: `pages/posts/[id].tsx` → `/posts/[id]`
- **API Routes**: `pages/api/users.ts` → `/api/users`
- **Special Pages**: `pages/_app.tsx`, `pages/_error.tsx`

## 🎨 Special Files Detected

### App Router Special Files

- `page.tsx/jsx/js/ts` - Route page component
- `layout.tsx/jsx/js/ts` - Shared layout component
- `loading.tsx/jsx/js/ts` - Loading UI component
- `error.tsx/jsx/js/ts` - Error boundary component
- `not-found.tsx/jsx/js/ts` - 404 page component
- `template.tsx/jsx/js/ts` - Re-rendered layout template
- `default.tsx/jsx/js/ts` - Parallel route fallback
- `route.ts/js` - API route handler

### Pages Router Special Files

- `_app.tsx/jsx/js/ts` - Custom App component
- `_document.tsx/jsx/js/ts` - Custom Document component
- `_error.tsx/jsx/js/ts` - Custom error page
- `404.tsx/jsx/js/ts` - Custom 404 page
- `500.tsx/jsx/js/ts` - Custom 500 page

## 🚀 Development

### Building

```bash
# Build the package
bun run build

# Development build with watch mode
bun run dev
```

### Testing

```bash
# Type checking
bun run type-check

# Run tests (when implemented)
bun run test
```

### Adding New Features

1. **New Output Format**: Extend the `Formatter` interface in `src/formatters/`
2. **New Framework Adapter**: See the comprehensive guide in the "Creating Custom Adapters" section above
3. **New Parser**: Create a parser class with static methods in `src/parsers/`

## 🤝 Contributing

This package is developed by [Webdesign29](https://www.webdesign29.net/) for the community. We welcome contributions from everyone!

### How to Contribute

1. **Fork the repository** on GitHub
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** and ensure tests pass
4. **Submit a pull request** with a clear description

### Development

```bash
# Install dependencies
bun install

# Run tests
bun run test

# Build the project
bun run build

# Development mode
bun run dev
```

### Contributing Adapters

If you've created an adapter for a popular framework, consider contributing it back to the project:

1. Create a new file in `src/adapters/YourFrameworkAdapter.ts`
2. Add comprehensive tests in `tests/adapters/`
3. Update the main `index.ts` to export your adapter
4. Add documentation to the README
5. Submit a pull request

This extensibility makes next-introspect a powerful tool for analyzing routing structures across the entire JavaScript ecosystem.

### Issues & Feature Requests

- **Bug reports**: Please use the GitHub issue tracker
- **Feature requests**: Open an issue with the "enhancement" label
- **Questions**: Check the documentation or ask in discussions

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Built with Next.js routing knowledge and patterns
- Inspired by various code analysis and documentation tools
- Uses Commander.js for CLI functionality
