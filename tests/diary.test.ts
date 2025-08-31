import { describe, it, expect } from 'vitest';
import { tmpdir } from 'node:os';
import { mkdtempSync, rmSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const runDiary = (baseDir: string, arg?: string) => {
  const env = { ...process.env, DIARY_BASE_DIR: baseDir, DIARY_NO_OPEN: '1' };
  const args = ['scripts/diary.js'];
  if (arg) args.push(arg);
  return spawnSync('node', args, { env });
};

describe('diary generator CLI', () => {
  it('creates a file for the given date with correct naming and frontmatter', () => {
    const base = mkdtempSync(join(tmpdir(), 'diary-test-'));
    try {
      const res = runDiary(base, '2025-01-02');
      expect(res.status).toBe(0);
      const yearDir = join(base, '2025');
      const filePath = join(yearDir, '20250102p01.md');
      expect(() => statSync(filePath)).not.toThrow();
      const content = readFileSync(filePath, 'utf8');
      expect(content).toMatch(/title: 2025-01-02の日記/);
      expect(content).toMatch(/date: "2025-01-02"/);
      expect(content).toMatch(/draft: true/);
      expect(content).not.toMatch(/description:/);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  it('increments part number when multiple entries for the same day exist', () => {
    const base = mkdtempSync(join(tmpdir(), 'diary-test-'));
    try {
      // First
      expect(runDiary(base, '2025-01-03').status).toBe(0);
      // Second same date -> p02
      expect(runDiary(base, '2025-01-03').status).toBe(0);
      const yearDir = join(base, '2025');
      const f1 = readFileSync(join(yearDir, '20250103p01.md'), 'utf8');
      const f2 = readFileSync(join(yearDir, '20250103p02.md'), 'utf8');
      expect(f1).toContain('2025-01-03');
      expect(f2).toContain('2025-01-03');
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  it('accepts slashed date format and rejects invalid date', () => {
    const base = mkdtempSync(join(tmpdir(), 'diary-test-'));
    try {
      // Slashed date should work
      expect(runDiary(base, '2025/01/04').status).toBe(0);
      const created = readFileSync(join(base, '2025', '20250104p01.md'), 'utf8');
      expect(created).toContain('2025-01-04');

      // Invalid date should exit non-zero
      const bad = runDiary(base, 'not-a-date');
      expect(bad.status).toBe(1);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
});
