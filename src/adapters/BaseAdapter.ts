import type {
  FrameworkAdapter,
  ProjectInfo,
  RouteInfo,
  OutputMode,
  ParserConfig
} from '../types.js';

/**
 * Abstract base class for framework adapters
 *
 * Provides common functionality and defines the interface that all
 * framework adapters must implement.
 */
export abstract class BaseAdapter implements FrameworkAdapter {
  /** Framework name */
  public readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Detect if this framework is present in the project
   */
  abstract detect(projectPath: string): Promise<boolean>;

  /**
   * Get project information specific to this framework
   */
  abstract getProjectInfo(projectPath: string): Promise<ProjectInfo>;

  /**
   * Get routes for this framework
   */
  abstract getRoutes(projectPath: string, mode: OutputMode): Promise<RouteInfo[]>;

  /**
   * Create a parser configuration with default values
   */
  protected createParserConfig(
    rootDir: string,
    mode: OutputMode,
    options?: {
      include?: string[];
      exclude?: string[];
      maxDepth?: number;
    }
  ): ParserConfig {
    return {
      rootDir,
      mode,
      include: options?.include || ['**/*'],
      exclude: options?.exclude || this.getDefaultExcludes(),
      maxDepth: options?.maxDepth || 10
    };
  }

  /**
   * Get default exclude patterns for file traversal
   */
  protected getDefaultExcludes(): string[] {
    return [
      'node_modules/**',
      '.git/**',
      '.next/**',
      'dist/**',
      'build/**',
      '.vercel/**',
      'coverage/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.d.ts',
      '.DS_Store',
      'Thumbs.db'
    ];
  }

  /**
   * Validate that a project path exists and is readable
   */
  protected async validateProjectPath(projectPath: string): Promise<void> {
    const fs = await import('fs/promises');

    try {
      const stats = await fs.stat(projectPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path ${projectPath} is not a directory`);
      }
    } catch (_error) {
      if (_error && typeof _error === 'object' && 'code' in _error && _error.code === 'ENOENT') {
        throw new Error(`Project path ${projectPath} does not exist`);
      }
      const errorMessage = _error instanceof Error ? _error.message : String(_error);
      throw new Error(`Cannot access project path ${projectPath}: ${errorMessage}`);
    }
  }

  /**
   * Get framework version from package.json
   */
  protected async getFrameworkVersion(
    projectPath: string,
    packageName: string
  ): Promise<string | undefined> {
    const fs = await import('fs/promises');
    const path = await import('path');

    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJson = await fs.readFile(packageJsonPath, 'utf-8');
      const packageData = JSON.parse(packageJson);

      return packageData.dependencies?.[packageName] ||
             packageData.devDependencies?.[packageName];
    // eslint-disable-next-line no-unused-vars
    } catch (_error) {
      return undefined;
    }
  }

  /**
   * Check if a directory exists
   */
  protected async directoryExists(dirPath: string): Promise<boolean> {
    const fs = await import('fs/promises');

    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    // eslint-disable-next-line no-unused-vars
    } catch (_error) {
      return false;
    }
  }

  /**
   * Check if a file exists
   */
  protected async fileExists(filePath: string): Promise<boolean> {
    const fs = await import('fs/promises');

    try {
      const stats = await fs.stat(filePath);
      return stats.isFile();
    // eslint-disable-next-line no-unused-vars
    } catch (_error) {
      return false;
    }
  }

  /**
   * Get common project information
   */
  protected async getBaseProjectInfo(
    projectPath: string,
    framework: string,
    version?: string
  ): Promise<Partial<ProjectInfo>> {
    const fs = await import('fs/promises');
    const path = await import('path');

    let packageInfo;
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJson = await fs.readFile(packageJsonPath, 'utf-8');
      packageInfo = JSON.parse(packageJson);
    // eslint-disable-next-line no-unused-vars
    } catch (_error) {
      // Package.json is optional
    }

    return {
      framework,
      version: version || 'unknown',
      rootDir: projectPath,
      packageInfo
    };
  }

  /**
   * Normalize file paths for consistent handling across platforms
   */
  protected async normalizePath(filePath: string): Promise<string> {
    const path = await import('path');
    return path.resolve(filePath).replace(/\\/g, '/');
  }

  /**
   * Get relative path from project root
   */
  protected async getRelativePath(projectRoot: string, filePath: string): Promise<string> {
    const path = await import('path');
    return path.relative(projectRoot, filePath).replace(/\\/g, '/');
  }
}
