/**
 * Packages the WordPress plugin folder into an installable .zip.
 *
 * Run `npm run package:wp`, then upload the file from `dist-wp/` through
 * Plugins → Add New → Upload Plugin in WordPress.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PLUGIN_DIR = 'pcp-mileage-calculator';
const SOURCE = resolve(ROOT, 'wordpress-plugin');
const OUT_DIR = resolve(ROOT, 'dist-wp');

const php = readFileSync(resolve(SOURCE, PLUGIN_DIR, `${PLUGIN_DIR}.php`), 'utf8');
const version = /^\s*\*\s*Version:\s*(.+)$/m.exec(php)?.[1].trim();
if (!version) {
  console.error('Could not read the Version header from the plugin file.');
  process.exit(1);
}

const zipName = `${PLUGIN_DIR}-${version}.zip`;
const zipPath = resolve(OUT_DIR, zipName);

mkdirSync(OUT_DIR, { recursive: true });
rmSync(zipPath, { force: true });

try {
  execFileSync(
    'zip',
    ['-r', '-q', '-X', zipPath, PLUGIN_DIR, '-x', '*.DS_Store', '-x', '__MACOSX/*'],
    { cwd: SOURCE, stdio: 'inherit' },
  );
} catch {
  console.error(
    'Packaging needs the `zip` command.\n' +
      'On Windows, compress the wordpress-plugin/pcp-mileage-calculator folder by hand instead.',
  );
  process.exit(1);
}

console.log(`Built dist-wp/${zipName}`);
console.log('Install it in WordPress via Plugins -> Add New -> Upload Plugin.');
