#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import { NextIntrospect } from "./NextIntrospect.js";
import type { OutputFormat, OutputMode } from "./types.js";

/**
 * CLI Options interface for type safety
 */
interface CLIOptions {
  format: OutputFormat;
  mode: OutputMode;
  output?: string;
  indent?: number;
  quiet: boolean;
  pathStyle: "absolute" | "relative-to-project" | "relative-to-app" | "relative-to-pages" | "strip-prefix";
  stripPrefix?: string;
  stripPrefixes: string[];
  showFilePaths: boolean;
  packageSummary: boolean;
  includeScripts: boolean;
  includeDeps: boolean;
  nested: boolean;
  includeEmptySegments: boolean;
  excludeFields?: string;
  metadata?: string;
  watch: boolean;
}

/**
 * Validate and sanitize file path
 */
function validateFilePath(filePath: string, description: string): string {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error(`Invalid ${description}: must be a non-empty string`);
  }

  // Prevent path traversal attacks
  const resolvedPath = path.resolve(filePath);
  const normalizedPath = path.normalize(resolvedPath);

  if (!normalizedPath.startsWith(resolvedPath)) {
    throw new Error(`Invalid ${description}: path traversal detected`);
  }

  return resolvedPath;
}

/**
 * Validate project directory exists and is accessible
 */
function validateProjectDirectory(projectPath: string): void {
  try {
    const stats = fs.statSync(projectPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${projectPath}`);
    }

    // Try to access the directory
    fs.accessSync(projectPath, fs.constants.R_OK);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Cannot access project directory: ${error.message}`);
    }
    throw new Error(`Cannot access project directory: ${projectPath}`);
  }
}

/**
 * Validate output file path (create parent directories if needed)
 */
function validateOutputPath(outputPath: string): string {
  const resolvedPath = validateFilePath(outputPath, 'output path');

  // Check if parent directory exists and is writable
  const parentDir = path.dirname(resolvedPath);
  try {
    const stats = fs.statSync(parentDir);
    if (!stats.isDirectory()) {
      throw new Error(`Parent path is not a directory: ${parentDir}`);
    }
    fs.accessSync(parentDir, fs.constants.W_OK);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Cannot write to output directory: ${error.message}`);
    }
    throw new Error(`Cannot write to output directory: ${parentDir}`);
  }

  return resolvedPath;
}

const program = new Command();

/**
 * Collect multiple --strip-prefixes values
 */
function collectPrefixes(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}

/**
 * Run analysis once and output results
 */
async function runAnalysisOnce(
  projectPath: string,
  options: CLIOptions,
  startTime: number,
): Promise<void> {
  // Build configuration options
  const pathDisplay: {
    style: CLIOptions['pathStyle'];
    showFilePaths: boolean;
    stripPrefix?: string;
  } = {
    style: options.pathStyle,
    showFilePaths: options.showFilePaths || false,
  };

  if (options.pathStyle === "strip-prefix" && options.stripPrefix) {
    pathDisplay.stripPrefix = options.stripPrefix;
  }

  // Build package display options
  const packageDisplay: {
    includeFullDetails?: boolean;
    includeScripts?: boolean;
    includeDependencies?: boolean;
  } = {};
  if (options.packageSummary) {
    packageDisplay.includeFullDetails = false;
    packageDisplay.includeScripts = options.includeScripts || false;
    packageDisplay.includeDependencies = options.includeDeps || false;
  }

  // Build output format options
  const outputFormat: {
    nested?: boolean;
    includeEmptySegments?: boolean;
    excludeFields?: string[];
    stripPrefixes?: string[];
  } = {};
  if (options.nested) {
    outputFormat.nested = true;
    outputFormat.includeEmptySegments = options.includeEmptySegments || false;
  }

  // Parse exclude fields
  if (options.excludeFields) {
    outputFormat.excludeFields = options.excludeFields
      .split(",")
      .map((field: string) => field.trim())
      .filter((field: string) => field.length > 0);
  }

  // Parse strip prefixes (accumulated by Commander.js)
  if (options.stripPrefixes && options.stripPrefixes.length > 0) {
    outputFormat.stripPrefixes = options.stripPrefixes
      .map((prefix: string) => prefix.trim())
      .filter((prefix: string) => prefix.length > 0);
  }

  // Build metadata options
  const metadata: {
    file?: string;
  } = {};
  if (options.metadata) {
    metadata.file = options.metadata;
  }

  // Show progress
  if (!options.quiet) {
    console.log(chalk.blue(`🔍 Analyzing Next.js project: ${projectPath}`));
    console.log(
      chalk.gray(
        `Mode: ${options.mode}, Format: ${options.format}, Path style: ${options.pathStyle}`,
      ),
    );
  }

  // Create introspector instance
  const introspect = new NextIntrospect(projectPath, {
    mode: options.mode as OutputMode,
    pathDisplay,
    packageDisplay,
    outputFormat,
    metadata,
  });

  // Analyze project
  const projectInfo = await introspect.analyze();

  if (!options.quiet) {
    console.log(chalk.green(`✅ Analysis complete!`));
    console.log(
      chalk.gray(`Framework: ${projectInfo.framework} ${projectInfo.version}`),
    );
    console.log(chalk.gray(`Router: ${formatRouterType(projectInfo.router)}`));
  }

  // Format results
  let output: string | object;

  if (options.format === "json" && options.indent !== undefined) {
    // Special handling for JSON with custom indentation
    const result = introspect.getResult();
    output = JSON.stringify(result, null, options.indent);
  } else {
    output = introspect.format(options.format as OutputFormat);
  }

  // Output results
  if (options.output) {
    // Write to file
    await introspect.exportToFile(
      options.output,
      options.format as OutputFormat,
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (!options.quiet) {
      console.log(chalk.green(`💾 Results written to: ${options.output}`));
      console.log(chalk.gray(`Analysis completed in ${duration}ms`));
    }
  } else {
    // Print to console
    if (typeof output === "string") {
      console.log(output);
    } else {
      // For object format, pretty print JSON
      console.log(JSON.stringify(output, null, 2));
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (!options.quiet) {
      console.log(chalk.gray(`\nAnalysis completed in ${duration}ms`));
    }
  }
}

/**
 * Run analysis in watch mode
 */
async function runInWatchMode(
  projectPath: string,
  options: CLIOptions,
): Promise<void> {
  if (!options.quiet) {
    console.log(chalk.blue(`👀 Starting watch mode for: ${projectPath}`));
    console.log(chalk.gray("Press Ctrl+C to stop watching"));
    console.log("");
  }

  // Run initial analysis
  const startTime = Date.now();
  await runAnalysisOnce(projectPath, options, startTime);

  // Set up file watching
  const fs = await import("fs");
  const watchPath = path.resolve(projectPath);

  // Watch mode state for proper cleanup
  const watchState = {
    timeoutId: null as NodeJS.Timeout | null,
    watcher: null as fs.FSWatcher | null,
    isRunning: false,
    isShuttingDown: false,
  };

  try {
    watchState.watcher = fs.watch(
      watchPath,
      { recursive: true },
      (eventType, filename) => {
        // Skip if shutting down
        if (watchState.isShuttingDown) return;

        // Ignore events without filenames or non-route files
        if (!filename) return;

        const filePath = path.join(watchPath, filename);

        // Skip files we don't care about
        if (
          filePath.includes("node_modules") ||
          filePath.includes(".next") ||
          filePath.includes(".git") ||
          filePath.includes(".turbo") ||
          !/\.(js|jsx|ts|tsx|json)$/.test(filePath)
        ) {
          return;
        }

        // Debounce changes
        if (watchState.timeoutId) {
          clearTimeout(watchState.timeoutId);
        }

        watchState.timeoutId = setTimeout(async () => {
          if (watchState.isRunning || watchState.isShuttingDown) return; // Prevent overlapping runs
          watchState.isRunning = true;

          try {
            if (!options.quiet) {
              console.log("");
              console.log(chalk.yellow(`📝 File changed: ${filename}`));
              console.log(chalk.blue("🔄 Re-running analysis..."));
            }

            const analysisStartTime = Date.now();
            await runAnalysisOnce(
              projectPath,
              { ...options, quiet: true },
              analysisStartTime,
            );

            if (!options.quiet) {
              console.log(chalk.green("✅ Analysis updated"));
            }
          } catch (error) {
            console.error(chalk.red("❌ Watch mode error:"), error);
          } finally {
            watchState.isRunning = false;
          }
        }, 300); // 300ms debounce
      },
    );

    // Handle process termination with proper cleanup
    const cleanup = () => {
      if (watchState.isShuttingDown) return;
      watchState.isShuttingDown = true;

      if (watchState.timeoutId) {
        clearTimeout(watchState.timeoutId);
        watchState.timeoutId = null;
      }

      if (watchState.watcher) {
        watchState.watcher.close();
        watchState.watcher = null;
      }

      if (!options.quiet) {
        console.log("");
        console.log(chalk.gray("👋 Watch mode stopped"));
      }

      // Exit gracefully
      process.exit(0);
    };

    // Handle multiple termination signals
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("SIGHUP", cleanup); // Handle terminal close

    // Handle uncaught exceptions in watch mode
    process.on("uncaughtException", (error) => {
      console.error(chalk.red("❌ Uncaught exception in watch mode:"), error);
      cleanup();
    });

    process.on("unhandledRejection", (reason, _promise) => {
      console.error(chalk.red("❌ Unhandled rejection in watch mode:"), reason);
      cleanup();
    });

    // Keep the process running
    return new Promise(() => {}); // Never resolves, runs until interrupted
  } catch (error) {
    // Cleanup on setup failure
    if (watchState.watcher) {
      watchState.watcher.close();
    }
    if (watchState.timeoutId) {
      clearTimeout(watchState.timeoutId);
    }
    throw error;
  }
}

// CLI Configuration
program
  .name("next-introspect")
  .description("Next.js project introspection tool")
  .version("0.3.17");

// Main introspect command
program
  .command("introspect <projectPath>")
  .description("Introspect a Next.js project")
  .option(
    "-f, --format <format>",
    "Output format (object, json, markdown, typescript)",
    "object",
  )
  .option(
    "-m, --mode <mode>",
    "Analysis mode (basic, detailed, comprehensive)",
    "comprehensive",
  )
  .option("-o, --output <file>", "Write output to file instead of console")
  .option("--indent <number>", "JSON indentation (default: 2)", parseInt, 2)
  .option("--quiet", "Suppress progress messages")
  .option(
    "--path-style <style>",
    "Path display style (absolute, relative-to-project, relative-to-app, relative-to-pages, strip-prefix)",
    "absolute",
  )
  .option(
    "--strip-prefix <prefix>",
    "Prefix to strip from paths when using strip-prefix style",
  )
  .option(
    "--strip-prefixes <prefix>",
    "Prefix to strip from route paths (can be used multiple times)",
    collectPrefixes,
    [],
  )
  .option(
    "--show-file-paths",
    "Format file paths according to the path style (default: show absolute paths)",
  )
  .option(
    "--package-summary",
    "Show only package.json summary (name, version, counts) instead of full details",
  )
  .option(
    "--include-scripts",
    "Include scripts section in output (only works with --package-summary)",
  )
  .option(
    "--include-deps",
    "Include dependencies/devDependencies in output (only works with --package-summary)",
  )
  .option(
    "--nested",
    "Output routes in nested hierarchical JSON structure instead of flat array",
  )
  .option(
    "--include-empty-segments",
    "Include empty path segments in nested structure (only works with --nested)",
  )
  .option(
    "--exclude-fields <fields>",
    "Comma-separated list of fields to exclude from route objects (e.g., 'filePath,pattern,router')",
  )
  .option(
    "--metadata <file>",
    "Path to metadata file (JSON or TOML) with titles and descriptions for routes",
  )
  .option(
    "-w, --watch",
    "Watch mode: continuously monitor for file changes and re-run analysis",
  )
  .action(async (projectPath: string, options: any) => {
    const startTime = Date.now();

    try {
      // Validate and sanitize project path
      const validatedProjectPath = validateFilePath(projectPath, 'project path');
      validateProjectDirectory(validatedProjectPath);

      // Validate output path if provided
      if (options.output) {
        options.output = validateOutputPath(options.output);
      }

      // Validate metadata file if provided
      if (options.metadata) {
        options.metadata = validateFilePath(options.metadata, 'metadata file');
        if (!fs.existsSync(options.metadata)) {
          throw new Error(`Metadata file does not exist: ${options.metadata}`);
        }
      }

      // Validate format
      const validFormats: OutputFormat[] = [
        "object",
        "json",
        "markdown",
        "typescript",
      ];
      if (!validFormats.includes(options.format)) {
        throw new Error(`Invalid format '${options.format}'. Valid formats: ${validFormats.join(", ")}`);
      }

      // Validate mode
      const validModes: OutputMode[] = ["basic", "detailed", "comprehensive"];
      if (!validModes.includes(options.mode)) {
        throw new Error(`Invalid mode '${options.mode}'. Valid modes: ${validModes.join(", ")}`);
      }

      // Validate path style
      const validPathStyles = [
        "absolute",
        "relative-to-project",
        "relative-to-app",
        "relative-to-pages",
        "strip-prefix",
      ];
      if (!validPathStyles.includes(options.pathStyle)) {
        throw new Error(`Invalid path style '${options.pathStyle}'. Valid styles: ${validPathStyles.join(", ")}`);
      }

      // Validate indent if provided
      if (options.indent !== undefined && (typeof options.indent !== 'number' || options.indent < 0)) {
        throw new Error('Indent must be a non-negative number');
      }

      // Run analysis once or start watch mode
      if (options.watch) {
        await runInWatchMode(validatedProjectPath, options);
      } else {
        await runAnalysisOnce(validatedProjectPath, options, startTime);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(chalk.red("❌ Error:"), errorMessage);

      if (errorMessage.includes("Invalid Next.js project")) {
        console.error(
          chalk.yellow(
            "\n💡 Make sure the path points to a valid Next.js project with:",
          ),
        );
        console.error(
          chalk.yellow("   - A package.json with Next.js dependency"),
        );
        console.error(chalk.yellow("   - An app/ or pages/ directory"));
        console.error(chalk.yellow("   - A next.config.js file (optional)"));
      }

      process.exit(1);
    }
  });

// Merge command
program
  .command("merge <jsonFile> <metadataFile>")
  .description("Merge an existing introspection JSON file with metadata")
  .option(
    "-o, --output <file>",
    "Write merged output to file instead of console",
  )
  .option(
    "-f, --format <format>",
    "Output format for merged result (object, json, markdown, typescript)",
    "json",
  )
  .option("--indent <number>", "JSON indentation (default: 2)", parseInt, 2)
  .option(
    "--exclude-fields <fields>",
    "Comma-separated list of fields to exclude from route objects",
  )
  .action(async (jsonFile: string, metadataFile: string, options: any) => {
    const startTime = Date.now();

    try {
      // Validate input files
      const validatedJsonFile = validateFilePath(jsonFile, 'JSON file');
      const validatedMetadataFile = validateFilePath(metadataFile, 'metadata file');

      if (!fs.existsSync(validatedJsonFile)) {
        throw new Error(`JSON file does not exist: ${validatedJsonFile}`);
      }

      if (!fs.existsSync(validatedMetadataFile)) {
        throw new Error(`Metadata file does not exist: ${validatedMetadataFile}`);
      }

      // Validate output path if provided
      if (options.output) {
        options.output = validateOutputPath(options.output);
      }

      // Validate indent if provided
      if (options.indent !== undefined && (typeof options.indent !== 'number' || options.indent < 0)) {
        throw new Error('Indent must be a non-negative number');
      }

      console.log(chalk.blue(`🔄 Merging ${validatedJsonFile} with ${validatedMetadataFile}`));

      // Load metadata file
      const metadataContent = fs.readFileSync(validatedMetadataFile, "utf-8");
      let metadata: any;

      if (validatedMetadataFile.endsWith(".json")) {
        metadata = JSON.parse(metadataContent);
      } else if (validatedMetadataFile.endsWith(".toml")) {
        // For now, just try to parse as JSON, TOML support can be added later
        try {
          metadata = JSON.parse(metadataContent);
        } catch {
          throw new Error("TOML parsing not yet implemented. Use JSON format.");
        }
      } else {
        throw new Error("Unsupported metadata file format. Use .json");
      }

      // Create introspector with exclude fields option
      const outputFormat: any = {};
      if (options.excludeFields) {
        outputFormat.excludeFields = options.excludeFields
          .split(",")
          .map((field: string) => field.trim())
          .filter((field: string) => field.length > 0);
      }

      const introspect = new NextIntrospect("./dummy", {
        outputFormat:
          Object.keys(outputFormat).length > 0 ? outputFormat : undefined,
      });
      const mergedResult = await introspect.mergeWithJson(validatedJsonFile, metadata);

      // Apply field filtering if specified
      let finalResult = mergedResult;
      if (outputFormat.excludeFields && outputFormat.excludeFields.length > 0) {
        const { filterExcludedFields } = await import("./utils.js");
        finalResult = filterExcludedFields(
          mergedResult,
          outputFormat.excludeFields,
        );
      }

      // Output result
      if (options.output) {
        const fs = await import("fs/promises");
        const path = await import("path");
        const fullPath = path.resolve(options.output);

        if (options.format === "json") {
          await fs.writeFile(
            fullPath,
            JSON.stringify(finalResult, null, options.indent || 2),
            "utf-8",
          );
        } else {
          // For other formats, we'd need to format the result
          const formatted =
            options.format === "markdown"
              ? new (await import("./formatters/MarkdownFormatter.js"))
                  .MarkdownFormatter().format(finalResult)
              : JSON.stringify(finalResult, null, options.indent || 2);
          await fs.writeFile(fullPath, formatted, "utf-8");
        }

        console.log(
          chalk.green(`✅ Merged result written to: ${options.output}`),
        );
      } else {
        if (options.format === "json") {
          console.log(JSON.stringify(finalResult, null, options.indent || 2));
        } else if (options.format === "markdown") {
          const formatted = new (
            await import("./formatters/MarkdownFormatter.js")
          ).MarkdownFormatter().format(finalResult);
          console.log(formatted);
        } else {
          console.log(finalResult);
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(chalk.gray(`\nMerge completed in ${duration}ms`));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(chalk.red("❌ Error:"), errorMessage);
      process.exit(1);
    }
  });

// Add examples to help
program.addHelpText(
  "after",
  `
Examples:
  $ next-introspect introspect /path/to/nextjs/project
  $ next-introspect introspect /path/to/nextjs/project --format json
  $ next-introspect introspect /path/to/nextjs/project --mode basic --output routes.json
  $ next-introspect introspect /path/to/nextjs/project --format markdown --output ROUTES.md
  $ next-introspect introspect /path/to/nextjs/project --path-style relative-to-project
  $ next-introspect introspect /path/to/nextjs/project --path-style strip-prefix --strip-prefix "/../../apps/app/src/"
  $ next-introspect introspect /path/to/nextjs/project --package-summary
  $ next-introspect introspect /path/to/nextjs/project --nested --format json
  $ next-introspect introspect /path/to/nextjs/project --exclude-fields "filePath,pattern,router" --format json
  $ next-introspect introspect /path/to/nextjs/project --metadata metadata.json --format markdown
  $ next-introspect introspect /path/to/nextjs/project --format json --indent 4 --quiet

  $ next-introspect merge routes.json metadata.json --output merged.json
  $ next-introspect merge routes.json metadata.json --exclude-fields "filePath" --output clean.json
  $ next-introspect merge routes.json metadata.json --format markdown --output merged.md

Commands:
  introspect <projectPath>    Analyze a Next.js project
  merge <jsonFile> <metadataFile>    Merge existing JSON with metadata

Output Formats:
  object     Raw JavaScript object (default)
  json       JSON formatted output
  markdown   Markdown documentation

Analysis Modes:
  basic        Basic route information (paths, patterns)
  detailed     Include component types and special files
  comprehensive Include all metadata, exports, and data fetching methods

Path Display Styles:
  absolute            Show full absolute paths (default)
  relative-to-project  Show paths relative to project root
  relative-to-app      Show paths relative to app directory
  relative-to-pages    Show paths relative to pages directory
  strip-prefix         Strip custom prefix from paths

Package Display Options:
  --package-summary    Show only package.json summary (name, version, counts)
  --include-scripts    Include scripts section in summary
  --include-deps       Include dependencies/devDependencies in summary

Output Format Options:
  --nested                    Output routes in nested hierarchical structure
  --include-empty-segments    Include empty path segments in nested structure
  --exclude-fields <fields>   Exclude specified fields from route objects

Metadata Options:
  --metadata <file>           Load route metadata from JSON or TOML file
`,
);

// Error handling for missing arguments
program.on("command:*", (unknownCommand) => {
  console.error(chalk.red(`Unknown command: ${unknownCommand[0]}`));
  console.error(
    chalk.yellow("Use --help to see available commands and options"),
  );
  process.exit(1);
});

// Handle no arguments
if (process.argv.length === 2) {
  program.help();
}

// Parse arguments
program.parse();

/**
 * Format router type for display
 */
function formatRouterType(router: string): string {
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
