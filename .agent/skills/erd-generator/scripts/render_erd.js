import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const input = resolve(process.cwd(), process.argv[2] ?? resolve(root, 'docs/architecture/schema.mmd'));
const output = resolve(root, 'docs/architecture/erd.svg');
const temporary = resolve(root, 'docs/architecture/erd.rendering.svg');
try {
  mkdirSync(dirname(output), { recursive: true });
  rmSync(output, { force: true });
  rmSync(temporary, { force: true });
  if (!/^\s*(?:%%[^\n]*\n\s*)*erDiagram\b/.test(readFileSync(input, 'utf8'))) {
    throw new Error('Input must be a standalone Mermaid erDiagram.');
  }
  // Invoke installed mmdc without shell quoting or network installation.
  const cli = resolve(root, 'node_modules/@mermaid-js/mermaid-cli/src/cli.js');
  if (!existsSync(cli)) throw new Error('Mermaid CLI is missing. Run npm ci first.');
  const result = spawnSync(process.execPath, [cli, '-i', input, '-o', temporary], {
    cwd: root, encoding: 'utf8', timeout: 120_000, maxBuffer: 10 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error(result.stderr?.trim() || result.error?.message || `mmdc exited with ${result.status}`);
  }
  if (!existsSync(temporary) || !readFileSync(temporary, 'utf8').includes('<svg')) {
    throw new Error('mmdc did not produce an SVG.');
  }
  renameSync(temporary, output);
  console.log('SUCCESS');
} catch (error) {
  rmSync(temporary, { force: true });
  console.error(`SYNTAX_ERROR: ${error.message}`);
  process.exitCode = 1;
}
