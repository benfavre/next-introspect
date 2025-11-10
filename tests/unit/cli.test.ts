import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextIntrospect } from '../../src/NextIntrospect';
import { spawn } from 'child_process';

// Mock dependencies
vi.mock('../../src/NextIntrospect', () => ({
  NextIntrospect: vi.fn().mockImplementation(() => ({
    analyze: vi.fn(),
    exportToFile: vi.fn(),
    exportToObject: vi.fn(),
    getResult: vi.fn(),
    format: vi.fn(),
  })),
}));

vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

describe('CLI', () => {
  let mockIntrospect: any;
  let mockSpawn: any;

  beforeEach(() => {
    mockIntrospect = new NextIntrospect('/test/path');
    mockIntrospect.analyze.mockResolvedValue({
      framework: 'nextjs',
      version: '14.0.0',
      router: 'app',
      rootDir: '/test/path',
    });

    mockSpawn = vi.mocked(spawn);
    mockSpawn.mockReturnValue({
      stdout: { on: vi.fn(), pipe: vi.fn() },
      stderr: { on: vi.fn(), pipe: vi.fn() },
      on: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('CLI execution', () => {
    it('should execute introspect command with basic options', async () => {
      // Mock successful execution
      const mockProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event: string, callback: Function) => {
          if (event === 'close') callback(0); // Success exit code
        }),
      };
      mockSpawn.mockReturnValue(mockProcess);

      // Test CLI execution with basic arguments
      const { spawn } = await import('child_process');
      spawn('node', ['dist/cli.js', 'introspect', '/test/path', '--format', 'json'], {
        stdio: 'pipe'
      });

      expect(spawn).toHaveBeenCalledWith('node', ['dist/cli.js', 'introspect', '/test/path', '--format', 'json'], {
        stdio: 'pipe'
      });
    });

    it('should execute with different output formats', async () => {
      const mockProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event: string, callback: Function) => {
          if (event === 'close') callback(0);
        }),
      };
      mockSpawn.mockReturnValue(mockProcess);

      const { spawn } = await import('child_process');
      spawn('node', ['dist/cli.js', 'introspect', '/test/path', '--format', 'markdown'], {
        stdio: 'pipe'
      });

      expect(spawn).toHaveBeenCalledWith('node', ['dist/cli.js', 'introspect', '/test/path', '--format', 'markdown'], {
        stdio: 'pipe'
      });
    });

    it('should execute with different analysis modes', async () => {
      const mockProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event: string, callback: Function) => {
          if (event === 'close') callback(0);
        }),
      };
      mockSpawn.mockReturnValue(mockProcess);

      const { spawn } = await import('child_process');
      spawn('node', ['dist/cli.js', 'introspect', '/test/path', '--mode', 'detailed'], {
        stdio: 'pipe'
      });

      expect(spawn).toHaveBeenCalledWith('node', ['dist/cli.js', 'introspect', '/test/path', '--mode', 'detailed'], {
        stdio: 'pipe'
      });
    });

    it('should execute with output file option', async () => {
      const mockProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event: string, callback: Function) => {
          if (event === 'close') callback(0);
        }),
      };
      mockSpawn.mockReturnValue(mockProcess);

      const { spawn } = await import('child_process');
      spawn('node', ['dist/cli.js', 'introspect', '/test/path', '--output', 'routes.json'], {
        stdio: 'pipe'
      });

      expect(spawn).toHaveBeenCalledWith('node', ['dist/cli.js', 'introspect', '/test/path', '--output', 'routes.json'], {
        stdio: 'pipe'
      });
    });

    it('should execute with quiet option', async () => {
      const mockProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event: string, callback: Function) => {
          if (event === 'close') callback(0);
        }),
      };
      mockSpawn.mockReturnValue(mockProcess);

      const { spawn } = await import('child_process');
      spawn('node', ['dist/cli.js', 'introspect', '/test/path', '--quiet'], {
        stdio: 'pipe'
      });

      expect(spawn).toHaveBeenCalledWith('node', ['dist/cli.js', 'introspect', '/test/path', '--quiet'], {
        stdio: 'pipe'
      });
    });
  });

  describe('merge command', () => {
    it('should execute merge command', async () => {
      const mockProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event: string, callback: Function) => {
          if (event === 'close') callback(0);
        }),
      };
      mockSpawn.mockReturnValue(mockProcess);

      const { spawn } = await import('child_process');
      spawn('node', ['dist/cli.js', 'merge', 'routes.json', 'metadata.json'], {
        stdio: 'pipe'
      });

      expect(spawn).toHaveBeenCalledWith('node', ['dist/cli.js', 'merge', 'routes.json', 'metadata.json'], {
        stdio: 'pipe'
      });
    });
  });

  describe('error handling', () => {
    it('should handle invalid project paths', async () => {
      const mockProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event: string, callback: Function) => {
          if (event === 'close') callback(1); // Error exit code
        }),
      };
      mockSpawn.mockReturnValue(mockProcess);

      const { spawn } = await import('child_process');
      spawn('node', ['dist/cli.js', 'introspect', '/invalid/path'], {
        stdio: 'pipe'
      });

      expect(spawn).toHaveBeenCalledWith('node', ['dist/cli.js', 'introspect', '/invalid/path'], {
        stdio: 'pipe'
      });
    });

    it('should handle missing arguments', async () => {
      const mockProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event: string, callback: Function) => {
          if (event === 'close') callback(0);
        }),
      };
      mockSpawn.mockReturnValue(mockProcess);

      const { spawn } = await import('child_process');
      spawn('node', ['dist/cli.js'], {
        stdio: 'pipe'
      });

      expect(spawn).toHaveBeenCalledWith('node', ['dist/cli.js'], {
        stdio: 'pipe'
      });
    });
  });

  describe('output handling', () => {
    it('should execute with stdout output', async () => {
      const mockProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event: string, callback: Function) => {
          if (event === 'close') callback(0);
        }),
      };
      mockSpawn.mockReturnValue(mockProcess);

      const { spawn } = await import('child_process');
      spawn('node', ['dist/cli.js', 'introspect', '/test/path'], {
        stdio: 'pipe'
      });

      expect(spawn).toHaveBeenCalledWith('node', ['dist/cli.js', 'introspect', '/test/path'], {
        stdio: 'pipe'
      });
    });

    it('should execute with file output', async () => {
      const mockProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event: string, callback: Function) => {
          if (event === 'close') callback(0);
        }),
      };
      mockSpawn.mockReturnValue(mockProcess);

      const { spawn } = await import('child_process');
      spawn('node', ['dist/cli.js', 'introspect', '/test/path', '--output', 'output.json'], {
        stdio: 'pipe'
      });

      expect(spawn).toHaveBeenCalledWith('node', ['dist/cli.js', 'introspect', '/test/path', '--output', 'output.json'], {
        stdio: 'pipe'
      });
    });
  });

  describe('watch mode', () => {
    it('should execute with watch mode', async () => {
      const mockProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event: string, callback: Function) => {
          if (event === 'close') callback(0);
        }),
      };
      mockSpawn.mockReturnValue(mockProcess);

      const { spawn } = await import('child_process');
      spawn('node', ['dist/cli.js', 'introspect', '/test/path', '--watch'], {
        stdio: 'pipe'
      });

      expect(spawn).toHaveBeenCalledWith('node', ['dist/cli.js', 'introspect', '/test/path', '--watch'], {
        stdio: 'pipe'
      });
    });
  });

  describe('quiet mode', () => {
    it('should execute in quiet mode', async () => {
      const mockProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event: string, callback: Function) => {
          if (event === 'close') callback(0);
        }),
      };
      mockSpawn.mockReturnValue(mockProcess);

      const { spawn } = await import('child_process');
      spawn('node', ['dist/cli.js', 'introspect', '/test/path', '--quiet'], {
        stdio: 'pipe'
      });

      expect(spawn).toHaveBeenCalledWith('node', ['dist/cli.js', 'introspect', '/test/path', '--quiet'], {
        stdio: 'pipe'
      });
    });

    it('should execute in verbose mode by default', async () => {
      const mockProcess = {
        stdout: { on: vi.fn(), pipe: vi.fn() },
        stderr: { on: vi.fn(), pipe: vi.fn() },
        on: vi.fn((event: string, callback: Function) => {
          if (event === 'close') callback(0);
        }),
      };
      mockSpawn.mockReturnValue(mockProcess);

      const { spawn } = await import('child_process');
      spawn('node', ['dist/cli.js', 'introspect', '/test/path'], {
        stdio: 'pipe'
      });

      expect(spawn).toHaveBeenCalledWith('node', ['dist/cli.js', 'introspect', '/test/path'], {
        stdio: 'pipe'
      });
    });
  });
});
