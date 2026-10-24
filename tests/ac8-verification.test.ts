import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('AC8 Verification and Architecture Documentation', () => {
  const root = path.resolve(__dirname, '..');

  it('AC8 ensures scripts/verify.sh and gate scripts exist and are configured', () => {
    const verifyScript = path.join(root, 'scripts', 'verify.sh');
    const gateScript = path.join(root, 'scripts', 'gate.py');

    expect(fs.existsSync(verifyScript)).toBe(true);
    expect(fs.existsSync(gateScript)).toBe(true);

    const verifyContent = fs.readFileSync(verifyScript, 'utf-8');
    expect(verifyContent).toContain('scripts/gate.py');
    expect(verifyContent).toContain('vitest run --coverage');
  });

  it('AC8 ensures README.md and DECISIONS.md document architecture and decisions', () => {
    const readmePath = path.join(root, 'README.md');
    const decisionsPath = path.join(root, 'docs', 'DECISIONS.md');

    expect(fs.existsSync(readmePath)).toBe(true);
    expect(fs.existsSync(decisionsPath)).toBe(true);

    const readme = fs.readFileSync(readmePath, 'utf-8');
    expect(readme).toContain('Architecture');
    expect(readme).toContain('PERT/CPM');

    const decisions = fs.readFileSync(decisionsPath, 'utf-8');
    expect(decisions).toContain('Next.js App Router');
    expect(decisions).toContain('PERT/CPM');
    expect(decisions).toContain('Google Places');
  });
});
