#!/usr/bin/env node
import {
  NextIntrospect
} from "./chunk-7MC7YOXI.js";
import "./chunk-FVTFQSOJ.js";
import "./chunk-UCQBORK3.js";

// src/cli.ts
import { Command } from "commander";
import chalk from "chalk";
import path from "path";
var program = new Command();
function collectPrefixes(value, previous) {
  return previous.concat([value]);
}
async function runAnalysisOnce(projectPath, options, startTime) {
  const pathDisplay = {
    style: options.pathStyle,
    showFilePaths: options.showFilePaths || false
  };
  if (options.pathStyle === "strip-prefix" && options.stripPrefix) {
    pathDisplay.stripPrefix = options.stripPrefix;
  }
  const packageDisplay = {};
  if (options.packageSummary) {
    packageDisplay.includeFullDetails = false;
    packageDisplay.includeScripts = options.includeScripts || false;
    packageDisplay.includeDependencies = options.includeDeps || false;
  }
  const outputFormat = {};
  if (options.nested) {
    outputFormat.nested = true;
    outputFormat.includeEmptySegments = options.includeEmptySegments || false;
  }
  if (options.excludeFields) {
    outputFormat.excludeFields = options.excludeFields.split(",").map((field) => field.trim()).filter((field) => field.length > 0);
  }
  if (options.stripPrefixes && options.stripPrefixes.length > 0) {
    outputFormat.stripPrefixes = options.stripPrefixes.map((prefix) => prefix.trim()).filter((prefix) => prefix.length > 0);
  }
  const metadata = {};
  if (options.metadata) {
    metadata.file = options.metadata;
  }
  if (!options.quiet) {
    console.log(chalk.blue(`\u{1F50D} Analyzing Next.js project: ${projectPath}`));
    console.log(
      chalk.gray(
        `Mode: ${options.mode}, Format: ${options.format}, Path style: ${options.pathStyle}`
      )
    );
  }
  const introspect = new NextIntrospect(projectPath, {
    mode: options.mode,
    pathDisplay,
    packageDisplay,
    outputFormat,
    metadata
  });
  const projectInfo = await introspect.analyze();
  if (!options.quiet) {
    console.log(chalk.green(`\u2705 Analysis complete!`));
    console.log(
      chalk.gray(`Framework: ${projectInfo.framework} ${projectInfo.version}`)
    );
    console.log(chalk.gray(`Router: ${formatRouterType(projectInfo.router)}`));
  }
  let output;
  if (options.format === "json" && options.indent !== void 0) {
    const result = introspect.getResult();
    output = JSON.stringify(result, null, options.indent);
  } else {
    output = introspect.format(options.format);
  }
  if (options.output) {
    await introspect.exportToFile(
      options.output,
      options.format
    );
    const endTime = Date.now();
    const duration = endTime - startTime;
    if (!options.quiet) {
      console.log(chalk.green(`\u{1F4BE} Results written to: ${options.output}`));
      console.log(chalk.gray(`Analysis completed in ${duration}ms`));
    }
  } else {
    if (typeof output === "string") {
      console.log(output);
    } else {
      console.log(JSON.stringify(output, null, 2));
    }
    const endTime = Date.now();
    const duration = endTime - startTime;
    if (!options.quiet) {
      console.log(chalk.gray(`
Analysis completed in ${duration}ms`));
    }
  }
}
async function runInWatchMode(projectPath, options) {
  if (!options.quiet) {
    console.log(chalk.blue(`\u{1F440} Starting watch mode for: ${projectPath}`));
    console.log(chalk.gray("Press Ctrl+C to stop watching"));
    console.log("");
  }
  const startTime = Date.now();
  await runAnalysisOnce(projectPath, options, startTime);
  const fs = await import("fs");
  const watchPath = path.resolve(projectPath);
  let timeoutId = null;
  let isRunning = false;
  const watcher = fs.watch(
    watchPath,
    { recursive: true },
    (eventType, filename) => {
      if (!filename) return;
      const filePath = path.join(watchPath, filename);
      if (filePath.includes("node_modules") || filePath.includes(".next") || filePath.includes(".git") || !/\.(js|jsx|ts|tsx|json)$/.test(filePath)) {
        return;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(async () => {
        if (isRunning) return;
        isRunning = true;
        try {
          if (!options.quiet) {
            console.log("");
            console.log(chalk.yellow(`\u{1F4DD} File changed: ${filename}`));
            console.log(chalk.blue("\u{1F504} Re-running analysis..."));
          }
          const analysisStartTime = Date.now();
          await runAnalysisOnce(
            projectPath,
            { ...options, quiet: true },
            analysisStartTime
          );
          if (!options.quiet) {
            console.log(chalk.green("\u2705 Analysis updated"));
          }
        } catch (error) {
          console.error(chalk.red("\u274C Watch mode error:"), error);
        } finally {
          isRunning = false;
        }
      }, 300);
    }
  );
  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    watcher.close();
    if (!options.quiet) {
      console.log("");
      console.log(chalk.gray("\u{1F44B} Watch mode stopped"));
    }
    process.exit(0);
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  return new Promise(() => {
  });
}
program.name("next-introspect").description("Next.js project introspection tool").version("0.1.0");
program.command("introspect <projectPath>").description("Introspect a Next.js project").option(
  "-f, --format <format>",
  "Output format (object, json, markdown, typescript)",
  "object"
).option(
  "-m, --mode <mode>",
  "Analysis mode (basic, detailed, comprehensive)",
  "comprehensive"
).option("-o, --output <file>", "Write output to file instead of console").option("--indent <number>", "JSON indentation (default: 2)", parseInt, 2).option("--quiet", "Suppress progress messages").option(
  "--path-style <style>",
  "Path display style (absolute, relative-to-project, relative-to-app, relative-to-pages, strip-prefix)",
  "absolute"
).option(
  "--strip-prefix <prefix>",
  "Prefix to strip from paths when using strip-prefix style"
).option(
  "--strip-prefixes <prefix>",
  "Prefix to strip from route paths (can be used multiple times)",
  collectPrefixes,
  []
).option(
  "--show-file-paths",
  "Format file paths according to the path style (default: show absolute paths)"
).option(
  "--package-summary",
  "Show only package.json summary (name, version, counts) instead of full details"
).option(
  "--include-scripts",
  "Include scripts section in output (only works with --package-summary)"
).option(
  "--include-deps",
  "Include dependencies/devDependencies in output (only works with --package-summary)"
).option(
  "--nested",
  "Output routes in nested hierarchical JSON structure instead of flat array"
).option(
  "--include-empty-segments",
  "Include empty path segments in nested structure (only works with --nested)"
).option(
  "--exclude-fields <fields>",
  "Comma-separated list of fields to exclude from route objects (e.g., 'filePath,pattern,router')"
).option(
  "--metadata <file>",
  "Path to metadata file (JSON or TOML) with titles and descriptions for routes"
).option(
  "-w, --watch",
  "Watch mode: continuously monitor for file changes and re-run analysis"
).action(async (projectPath, options) => {
  const startTime = Date.now();
  try {
    const validFormats = [
      "object",
      "json",
      "markdown",
      "typescript"
    ];
    if (!validFormats.includes(options.format)) {
      console.error(
        chalk.red(
          `Error: Invalid format '${options.format}'. Valid formats: ${validFormats.join(", ")}`
        )
      );
      process.exit(1);
    }
    const validModes = ["basic", "detailed", "comprehensive"];
    if (!validModes.includes(options.mode)) {
      console.error(
        chalk.red(
          `Error: Invalid mode '${options.mode}'. Valid modes: ${validModes.join(", ")}`
        )
      );
      process.exit(1);
    }
    const validPathStyles = [
      "absolute",
      "relative-to-project",
      "relative-to-app",
      "relative-to-pages",
      "strip-prefix"
    ];
    if (!validPathStyles.includes(options.pathStyle)) {
      console.error(
        chalk.red(
          `Error: Invalid path style '${options.pathStyle}'. Valid styles: ${validPathStyles.join(", ")}`
        )
      );
      process.exit(1);
    }
    if (options.watch) {
      await runInWatchMode(projectPath, options);
    } else {
      await runAnalysisOnce(projectPath, options, startTime);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red("\u274C Error:"), errorMessage);
    if (errorMessage.includes("Invalid Next.js project")) {
      console.error(
        chalk.yellow(
          "\n\u{1F4A1} Make sure the path points to a valid Next.js project with:"
        )
      );
      console.error(
        chalk.yellow("   - A package.json with Next.js dependency")
      );
      console.error(chalk.yellow("   - An app/ or pages/ directory"));
      console.error(chalk.yellow("   - A next.config.js file (optional)"));
    }
    process.exit(1);
  }
});
program.command("merge <jsonFile> <metadataFile>").description("Merge an existing introspection JSON file with metadata").option(
  "-o, --output <file>",
  "Write merged output to file instead of console"
).option(
  "-f, --format <format>",
  "Output format for merged result (object, json, markdown, typescript)",
  "json"
).option("--indent <number>", "JSON indentation (default: 2)", parseInt, 2).option(
  "--exclude-fields <fields>",
  "Comma-separated list of fields to exclude from route objects"
).action(async (jsonFile, metadataFile, options) => {
  const startTime = Date.now();
  try {
    console.log(chalk.blue(`\u{1F504} Merging ${jsonFile} with ${metadataFile}`));
    const fs = await import("fs");
    const metadataContent = fs.readFileSync(metadataFile, "utf-8");
    let metadata;
    if (metadataFile.endsWith(".json")) {
      metadata = JSON.parse(metadataContent);
    } else if (metadataFile.endsWith(".toml")) {
      try {
        metadata = JSON.parse(metadataContent);
      } catch {
        console.error(
          chalk.red("\u274C TOML parsing not yet implemented. Use JSON format.")
        );
        process.exit(1);
      }
    } else {
      console.error(
        chalk.red("\u274C Unsupported metadata file format. Use .json")
      );
      process.exit(1);
    }
    const outputFormat = {};
    if (options.excludeFields) {
      outputFormat.excludeFields = options.excludeFields.split(",").map((field) => field.trim()).filter((field) => field.length > 0);
    }
    const introspect = new NextIntrospect("./dummy", {
      outputFormat: Object.keys(outputFormat).length > 0 ? outputFormat : void 0
    });
    const mergedResult = await introspect.mergeWithJson(jsonFile, metadata);
    let finalResult = mergedResult;
    if (outputFormat.excludeFields && outputFormat.excludeFields.length > 0) {
      const { filterExcludedFields } = await import("./utils-DHPAGBCI.js");
      finalResult = filterExcludedFields(
        mergedResult,
        outputFormat.excludeFields
      );
    }
    if (options.output) {
      const fs2 = await import("fs/promises");
      const path2 = await import("path");
      const fullPath = path2.resolve(options.output);
      if (options.format === "json") {
        await fs2.writeFile(
          fullPath,
          JSON.stringify(finalResult, null, options.indent || 2),
          "utf-8"
        );
      } else {
        const formatted = options.format === "markdown" ? new (await import("./MarkdownFormatter-M6INYMCA.js")).MarkdownFormatter().format(finalResult) : JSON.stringify(finalResult, null, options.indent || 2);
        await fs2.writeFile(fullPath, formatted, "utf-8");
      }
      console.log(
        chalk.green(`\u2705 Merged result written to: ${options.output}`)
      );
    } else {
      if (options.format === "json") {
        console.log(JSON.stringify(finalResult, null, options.indent || 2));
      } else if (options.format === "markdown") {
        const formatted = new (await import("./MarkdownFormatter-M6INYMCA.js")).MarkdownFormatter().format(finalResult);
        console.log(formatted);
      } else {
        console.log(finalResult);
      }
    }
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(chalk.gray(`
Merge completed in ${duration}ms`));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red("\u274C Error:"), errorMessage);
    process.exit(1);
  }
});
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
`
);
program.on("command:*", (unknownCommand) => {
  console.error(chalk.red(`Unknown command: ${unknownCommand[0]}`));
  console.error(
    chalk.yellow("Use --help to see available commands and options")
  );
  process.exit(1);
});
if (process.argv.length === 2) {
  program.help();
}
program.parse();
function formatRouterType(router) {
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
