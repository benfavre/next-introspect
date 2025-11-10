import { beforeAll, afterAll } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdir, rm } from 'fs/promises';

// Create a temporary directory for tests
let tempDir: string;

beforeAll(async () => {
  tempDir = join(tmpdir(), 'next-introspect-tests');
  await mkdir(tempDir, { recursive: true });
});

afterAll(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
});

export { tempDir };
