#!/usr/bin/env node
/** Re-add basePath() as alias for roleBase(router) where templates still reference it. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend/hapm-web/src/app');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

for (const file of walk(appRoot)) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('basePath()')) continue;
  if (content.includes('basePath():')) continue;
  if (!content.includes('role-prefix.util')) continue;
  if (!content.includes('inject(Router)')) continue;

  const insert = `\n  basePath(): string {\n    return roleBase(this.router);\n  }\n`;
  const lastBrace = content.lastIndexOf('\n}');
  if (lastBrace < 0) continue;
  content = content.slice(0, lastBrace) + insert + content.slice(lastBrace);
  fs.writeFileSync(file, content);
  console.log('fixed', path.relative(appRoot, file));
}
