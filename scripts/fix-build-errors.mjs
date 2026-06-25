#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const src = path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend/hapm-web/src');

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, files);
    else if (e.name.endsWith('.ts')) files.push(f);
  }
  return files;
}

for (const file of walk(src)) {
  let content = fs.readFileSync(file, 'utf8');
  const before = content;

  // Fix missing comma before String()
  content = content.replace(/'([^']+)'String\(/g, "'$1', String(");

  // Fix double closing brace before loadError branch
  content = content.replace(/\n(\s*)\}\n\1\} @else if \(loadError\(\)\)/g, '\n$1} @else if (loadError())');

  // Add loadError signal when setPageLoadFailed is used but signal missing
  if (content.includes('setPageLoadFailed') && !content.includes('loadError = signal')) {
    if (content.includes('readonly loading = signal')) {
      content = content.replace(
        /readonly loading = signal\([^)]+\);/,
        (m) => `${m}\n  readonly loadError = signal<string | null>(null);`,
      );
    } else if (content.includes('loading = signal')) {
      content = content.replace(
        /(\s+)loading = signal\([^)]+\);/,
        '$1loading = signal(true);\n$1loadError = signal<string | null>(null);',
      );
    }
  }

  if (content !== before) {
    fs.writeFileSync(file, content);
    console.log('fixed', path.relative(src, file));
  }
}
