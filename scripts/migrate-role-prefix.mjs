#!/usr/bin/env node
/**
 * Migrates basePath() helpers to roleRoute / roleBase / getRolePrefix.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend/hapm-web/src/app');
const utilImport = "import { getRolePrefix, roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';";
const utilImportDepth = (filePath) => {
  const rel = path.relative(path.join(root, 'features'), path.dirname(filePath));
  const depth = rel.split(path.sep).filter(Boolean).length + 1;
  return `import { getRolePrefix, roleBase, roleRoute } from '${'../'.repeat(depth)}shared/utils/role-prefix.util';`;
};

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) files.push(full);
  }
  return files;
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('basePath')) return false;

  // Remove private/public basePath methods
  content = content.replace(/\n\s*(?:private |public )?basePath\(\): string \{\s*return `\/\$\{this\.router\.url\.split\('\/'\)\.filter\(Boolean\)\[0\]\}`;\s*\}/g, '');

  // Replace common patterns
  content = content.replace(/`\$\{this\.basePath\(\)\}\/([^`]+)`/g, (_, segments) => {
    const parts = segments.split('/').map((s) => s.trim()).filter(Boolean);
    const args = parts.map((p) => (p.includes('${') ? p : `'${p}'`)).join(', ');
    return `\${roleRoute(this.router, ${args})}`;
  });

  content = content.replace(/this\.basePath\(\) === '\/(\w+)'/g, "getRolePrefix(this.router) === '$1'");
  content = content.replace(/this\.basePath\(\)/g, 'roleBase(this.router)');

  if (!content.includes('role-prefix.util')) {
    const importLine = utilImportDepth(filePath);
    const lastImport = content.lastIndexOf('\nimport ');
    if (lastImport >= 0) {
      const end = content.indexOf('\n', lastImport + 1);
      content = content.slice(0, end + 1) + importLine + '\n' + content.slice(end + 1);
    }
  }

  fs.writeFileSync(filePath, content);
  return true;
}

const targets = walk(path.join(root, 'features')).concat(
  walk(path.join(root, 'layout')),
  walk(path.join(root, 'features', 'audit-logs', 'pages')),
);

let count = 0;
for (const file of targets) {
  if (migrateFile(file)) {
    count++;
    console.log('migrated', path.relative(root, file));
  }
}
console.log(`Done: ${count} files`);
