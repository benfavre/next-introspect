import path from "path";
import type { NextConfig } from "../types.js";
import { readFileContent } from "../utils.js";

/**
 * Parser for Next.js configuration files
 *
 * Safely extracts configuration information from next.config.js/mjs/ts files
 * without executing potentially unsafe code.
 */
export class ConfigParser {
  /**
   * Parse a Next.js configuration file
   */
  static async parse(configPath: string): Promise<NextConfig | undefined> {
    const content = await readFileContent(configPath);
    if (!content) {
      return undefined;
    }

    const config: NextConfig = {};

    // Extract basic configuration properties
    config.basePath = this.extractStringProperty(content, "basePath");
    config.distDir = this.extractStringProperty(content, "distDir");
    config.trailingSlash = this.extractBooleanProperty(
      content,
      "trailingSlash",
    );

    // Extract images configuration
    config.images = this.extractImagesConfig(content);

    // Extract environment variables
    config.env = this.extractEnvConfig(content);

    // Check for experimental features
    config.experimental = this.extractExperimentalConfig(content);

    // Check for middleware
    config.hasMiddleware = await this.checkMiddlewareExists(
      path.dirname(configPath),
    );

    return config;
  }

  /**
   * Extract a string property from config content
   */
  private static extractStringProperty(
    content: string,
    property: string,
  ): string | undefined {
    const regex = new RegExp(`${property}\\s*:\\s*['"]([^'"]+)['"]`, "g");
    const match = regex.exec(content);
    return match ? match[1] : undefined;
  }

  /**
   * Extract a boolean property from config content
   */
  private static extractBooleanProperty(
    content: string,
    property: string,
  ): boolean | undefined {
    const regex = new RegExp(`${property}\\s*:\\s*(true|false)`, "g");
    const match = regex.exec(content);
    return match ? match[1] === "true" : undefined;
  }

  /**
   * Extract images configuration
   */
  private static extractImagesConfig(
    content: string,
  ): NextConfig["images"] | undefined {
    const imagesSection = this.extractObjectProperty(content, "images");
    if (!imagesSection) {
      return undefined;
    }

    const images: NonNullable<NextConfig["images"]> = {};

    // Extract domains
    const domainsMatch = imagesSection.match(/domains\s*:\s*\[([^\]]*)\]/);
    if (domainsMatch) {
      images.domains = domainsMatch[1]
        .split(",")
        .map((d) => d.trim().replace(/['"]/g, ""))
        .filter((d) => d);
    }

    return images;
  }

  /**
   * Extract environment variables configuration
   */
  private static extractEnvConfig(
    content: string,
  ): Record<string, string> | undefined {
    const envSection = this.extractObjectProperty(content, "env");
    if (!envSection) {
      return undefined;
    }

    const env: Record<string, string> = {};

    // Extract string properties from env object
    const stringMatches = envSection.matchAll(/(\w+)\s*:\s*['"]([^'"]+)['"]/g);
    for (const match of stringMatches) {
      env[match[1]] = match[2];
    }

    return Object.keys(env).length > 0 ? env : undefined;
  }

  /**
   * Extract experimental features configuration
   */
  private static extractExperimentalConfig(
    content: string,
  ): Record<string, any> | undefined {
    const experimentalSection = this.extractObjectProperty(
      content,
      "experimental",
    );
    if (!experimentalSection) {
      return undefined;
    }

    const experimental: Record<string, any> = {};

    // Look for common experimental features
    const booleanFeatures = [
      "serverComponentsExternalPackages",
      "optimizeCss",
      "serverMinification",
      "webVitalsAttribution",
    ];

    for (const feature of booleanFeatures) {
      const value = this.extractBooleanProperty(experimentalSection, feature);
      if (value !== undefined) {
        experimental[feature] = value;
      }
    }

    return Object.keys(experimental).length > 0 ? experimental : undefined;
  }

  /**
   * Extract an object property from config content
   */
  private static extractObjectProperty(
    content: string,
    property: string,
  ): string | undefined {
    const regex = new RegExp(
      `${property}\\s*:\\s*({[^{}]*(?:{[^{}]*}[^{}]*)*})`,
      "g",
    );
    const match = regex.exec(content);
    return match ? match[1] : undefined;
  }

  /**
   * Check if middleware file exists in the project
   */
  private static async checkMiddlewareExists(
    projectRoot: string,
  ): Promise<boolean> {
    const fs = await import("fs/promises");

    const possibleMiddlewarePaths = [
      path.join(projectRoot, "middleware.js"),
      path.join(projectRoot, "middleware.ts"),
      path.join(projectRoot, "middleware.mjs"),
      path.join(projectRoot, "middleware.mts"),
      path.join(projectRoot, "src", "middleware.js"),
      path.join(projectRoot, "src", "middleware.ts"),
      path.join(projectRoot, "src", "middleware.mjs"),
      path.join(projectRoot, "src", "middleware.mts"),
    ];

    for (const middlewarePath of possibleMiddlewarePaths) {
      try {
        await fs.access(middlewarePath);
        return true;
      } catch {
        // Continue checking other paths
      }
    }

    return false;
  }

  /**
   * Get all possible config file paths for a project
   */
  static getConfigFilePaths(projectPath: string): string[] {
    return [
      path.join(projectPath, "next.config.js"),
      path.join(projectPath, "next.config.mjs"),
      path.join(projectPath, "next.config.ts"),
      path.join(projectPath, "next.config.mts"),
      path.join(projectPath, "next.config.cjs"),
    ];
  }

  /**
   * Find and parse the first available config file
   */
  static async findAndParseConfig(
    projectPath: string,
  ): Promise<NextConfig | undefined> {
    const configPaths = this.getConfigFilePaths(projectPath);

    for (const configPath of configPaths) {
      try {
        const fs = await import("fs/promises");
        await fs.access(configPath);
        return await this.parse(configPath);
      } catch {
        // Continue to next config file
      }
    }

    return undefined;
  }

  /**
   * Validate if a config object has any meaningful data
   */
  static isValidConfig(config: NextConfig | undefined): config is NextConfig {
    if (!config) {
      return false;
    }

    return !!(
      config.basePath ||
      config.distDir ||
      config.trailingSlash !== undefined ||
      config.images ||
      config.env ||
      config.experimental ||
      config.hasMiddleware
    );
  }
}

