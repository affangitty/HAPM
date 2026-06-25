#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend/hapm-web/src/app/features');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

function depthImport(filePath) {
  const rel = path.relative(path.join(root, '..'), path.dirname(filePath));
  const depth = rel.split(path.sep).filter(Boolean).length;
  return `import { getFormControlError, markFormGroupTouched } from '${'../'.repeat(depth)}shared/utils/form-errors.util';`;
}

for (const file of walk(root)) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('markAllAsTouched')) continue;
  if (content.includes('form-errors.util')) {
    content = content.replace(/this\.form\.markAllAsTouched\(\)/g, 'markFormGroupTouched(this.form)');
    content = content.replace(/this\.createForm\.markAllAsTouched\(\)/g, 'markFormGroupTouched(this.createForm)');
    content = content.replace(/this\.passwordForm\.markAllAsTouched\(\)/g, 'markFormGroupTouched(this.passwordForm)');
    fs.writeFileSync(file, content);
    console.log('patched touches', path.relative(root, file));
    continue;
  }
  const line = depthImport(file);
  const idx = content.indexOf('\nimport ');
  const end = content.indexOf('\n', idx + 1);
  content = content.slice(0, end + 1) + line + '\n' + content.slice(end + 1);
  content = content.replace(/this\.form\.markAllAsTouched\(\)/g, 'markFormGroupTouched(this.form)');
  content = content.replace(/this\.createForm\.markAllAsTouched\(\)/g, 'markFormGroupTouched(this.createForm)');
  content = content.replace(/this\.passwordForm\.markAllAsTouched\(\)/g, 'markFormGroupTouched(this.passwordForm)');
  fs.writeFileSync(file, content);
  console.log('patched', path.relative(root, file));
}
