import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextIntrospect } from '../../src/NextIntrospect';
import { NextJsAdapter } from '../../src/adapters/NextJsAdapter';
import type { IntrospectionOptions, ProjectInfo, RouteInfo } from '../../src/types';

// Mock the NextJsAdapter
const mockAdapterInstance = {
  getProjectInfo: vi.fn(),
  getRoutes: vi.fn(),
};

vi.mock('../../src/adapters/NextJsAdapter', () => ({
  NextJsAdapter: vi.fn(() => mockAdapterInstance),
}));

vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
}));

describe('NextIntrospect', () => {
  let introspect: NextIntrospect;

  const mockProjectInfo: ProjectInfo = {
    framework: 'nextjs',
    version: '14.0.0',
    router: 'app',
    rootDir: '/path/to/project',
    sourceDirs: {
      app: 'src/app',
      pages: 'src/pages',
    },
  };

  const mockRoutes: RouteInfo[] = [
    {
      path: '/',
      filePath: 'src/app/page.tsx',
      pattern: 'static',
      type: 'page',
      router: 'app',
    },
    {
      path: '/api/users',
      filePath: 'src/app/api/users/route.ts',
      pattern: 'static',
      type: 'api',
      router: 'app',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    introspect = new NextIntrospect('/path/to/project');
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const introspect = new NextIntrospect('/path/to/project');
      expect(introspect).toBeInstanceOf(NextIntrospect);
    });

    it('should merge provided options with defaults', () => {
      const customOptions: Partial<IntrospectionOptions> = {
        mode: 'detailed',
        maxDepth: 5,
      };

      const introspect = new NextIntrospect('/path/to/project', customOptions);
      expect(introspect).toBeInstanceOf(NextIntrospect);
    });
  });

  describe('analyze', () => {
    it('should analyze a valid Next.js project successfully', async () => {
      // Mock isValidProject to return true
      const isValidProjectSpy = vi.spyOn(introspect as any, 'isValidProject').mockResolvedValue(true);

      mockAdapterInstance.getProjectInfo.mockResolvedValue(mockProjectInfo);
      mockAdapterInstance.getRoutes.mockResolvedValue(mockRoutes);

      const result = await introspect.analyze();

      expect(isValidProjectSpy).toHaveBeenCalled();
      expect(mockAdapterInstance.getProjectInfo).toHaveBeenCalledWith('/path/to/project', undefined);
      expect(mockAdapterInstance.getRoutes).toHaveBeenCalledWith('/path/to/project', 'comprehensive');
      expect(result).toEqual(mockProjectInfo);
    });

    it('should throw error for invalid project', async () => {
      const invalidProjectPath = '/invalid/path';
      const introspect = new NextIntrospect(invalidProjectPath);

      // Mock fs operations to simulate invalid project
      mockAdapterInstance.getProjectInfo.mockRejectedValue(
        new Error(`Invalid Next.js project: ${invalidProjectPath}`)
      );

      await expect(introspect.analyze()).rejects.toThrow('Invalid Next.js project');
    });

    it('should handle different analysis modes', async () => {
      const introspect = new NextIntrospect('/path/to/project', { mode: 'basic' });
      const isValidProjectSpy = vi.spyOn(introspect as any, 'isValidProject').mockResolvedValue(true);

      mockAdapterInstance.getProjectInfo.mockResolvedValue(mockProjectInfo);
      mockAdapterInstance.getRoutes.mockResolvedValue(mockRoutes);

      await introspect.analyze();

      expect(isValidProjectSpy).toHaveBeenCalled();
      expect(mockAdapterInstance.getRoutes).toHaveBeenCalledWith('/path/to/project', 'basic');
    });

    it('should pass package display options to adapter', async () => {
      const packageDisplay = { includeScripts: true, includeDependencies: true };
      const introspect = new NextIntrospect('/path/to/project', { packageDisplay });
      const isValidProjectSpy = vi.spyOn(introspect as any, 'isValidProject').mockResolvedValue(true);

      mockAdapterInstance.getProjectInfo.mockResolvedValue(mockProjectInfo);
      mockAdapterInstance.getRoutes.mockResolvedValue(mockRoutes);

      await introspect.analyze();

      expect(isValidProjectSpy).toHaveBeenCalled();
      expect(mockAdapterInstance.getProjectInfo).toHaveBeenCalledWith('/path/to/project', packageDisplay);
    });
  });

  describe('getRoutes', () => {
    it('should return routes after analysis', async () => {
      const isValidProjectSpy = vi.spyOn(introspect as any, 'isValidProject').mockResolvedValue(true);
      mockAdapterInstance.getProjectInfo.mockResolvedValue(mockProjectInfo);
      mockAdapterInstance.getRoutes.mockResolvedValue(mockRoutes);

      await introspect.analyze();
      const routes = introspect.getRoutes();

      expect(isValidProjectSpy).toHaveBeenCalled();
      expect(routes).toEqual(mockRoutes);
    });

    it('should throw error if called before analysis', () => {
      expect(() => introspect.getRoutes()).toThrow('Project must be analyzed first');
    });
  });

  describe('getProjectInfo', () => {
    it('should return project info after analysis', async () => {
      const isValidProjectSpy = vi.spyOn(introspect as any, 'isValidProject').mockResolvedValue(true);
      mockAdapterInstance.getProjectInfo.mockResolvedValue(mockProjectInfo);
      mockAdapterInstance.getRoutes.mockResolvedValue(mockRoutes);

      await introspect.analyze();
      const projectInfo = introspect.getProjectInfo();

      expect(isValidProjectSpy).toHaveBeenCalled();
      expect(projectInfo).toEqual(mockProjectInfo);
    });

    it('should return null if called before analysis', () => {
      const result = introspect.getProjectInfo();
      expect(result).toBeNull();
    });
  });

  describe('getResult', () => {
    it('should return full introspection result', async () => {
      const isValidProjectSpy = vi.spyOn(introspect as any, 'isValidProject').mockResolvedValue(true);
      mockAdapterInstance.getProjectInfo.mockResolvedValue(mockProjectInfo);
      mockAdapterInstance.getRoutes.mockResolvedValue(mockRoutes);

      await introspect.analyze();
      const result = introspect.getResult();

      expect(isValidProjectSpy).toHaveBeenCalled();
      expect(result).toHaveProperty('project');
      expect(result).toHaveProperty('routes');
      expect(result).toHaveProperty('metadata');
      expect(result.routes).toEqual(mockRoutes);
      expect(result.project).toEqual(mockProjectInfo);
    });

    it('should throw error if called before analysis', () => {
      expect(() => introspect.getResult()).toThrow('Project must be analyzed first');
    });
  });

  describe('exportToFile', () => {
    it('should export to different formats', async () => {
      const isValidProjectSpy = vi.spyOn(introspect as any, 'isValidProject').mockResolvedValue(true);
      mockAdapterInstance.getProjectInfo.mockResolvedValue(mockProjectInfo);
      mockAdapterInstance.getRoutes.mockResolvedValue(mockRoutes);

      await introspect.analyze();

      // Mock fs.writeFile
      const writeFileMock = vi.fn().mockResolvedValue(undefined);
      const fs = await import('fs/promises');
      fs.writeFile = writeFileMock;

      // Test different formats
      await introspect.exportToFile('output.json', 'json');
      await introspect.exportToFile('output.md', 'markdown');
      await introspect.exportToFile('output.ts', 'typescript');

      expect(isValidProjectSpy).toHaveBeenCalled();
      expect(writeFileMock).toHaveBeenCalledTimes(3);
    });

    it('should throw error if called before analysis', async () => {
      await expect(introspect.exportToFile('output.json', 'json')).rejects.toThrow(
        'Project must be analyzed first'
      );
    });
  });
});
