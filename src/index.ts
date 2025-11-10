// Main class
export { NextIntrospect } from './NextIntrospect.js';

// Types and interfaces
export type {
  // Core types
  OutputFormat,
  OutputMode,
  RouterType,
  ComponentType,
  RoutePattern,

  // Configuration
  IntrospectionOptions,

  // Project information
  ProjectInfo,
  NextConfig,
  PackageInfo,

  // Route information
  BaseRoute,
  RouteInfo,
  AppRouterRoute,
  PagesRouterRoute,

  // Results
  IntrospectionResult,

  // Framework adapters
  FrameworkAdapter,

  // Parser configuration
  ParserConfig,

  // Formatters
  Formatter,

  // File system
  FileEntry,

  // Route parsing
  RouteSegment
} from './types.js';

// Adapters
export { BaseAdapter } from './adapters/BaseAdapter.js';
export { NextJsAdapter } from './adapters/NextJsAdapter.js';

// Parsers
export { AppRouterParser } from './parsers/AppRouterParser.js';
export { PagesRouterParser } from './parsers/PagesRouterParser.js';
export { ConfigParser } from './parsers/ConfigParser.js';

// Formatters
export { ObjectFormatter } from './formatters/ObjectFormatter.js';
export { JsonFormatter } from './formatters/JsonFormatter.js';
export { MarkdownFormatter } from './formatters/MarkdownFormatter.js';

// Utility functions (most commonly used ones)
export {
  isNextJsProject,
  detectRouterType,
  parseRouteSegment,
  formatRoutePath,
  detectComponentType
} from './utils.js';

