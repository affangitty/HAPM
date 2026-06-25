#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend/hapm-web/src/app');

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, files);
    else if (e.name.endsWith('.component.ts')) files.push(f);
  }
  return files;
}

function relImport(file, target) {
  const rel = path.relative(path.dirname(file), target).replace(/\\/g, '/').replace(/\.ts$/, '');
  return rel.startsWith('.') ? rel : `./${rel}`;
}

for (const file of walk(root)) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('markFormGroupTouched') && !content.includes('if (this.form.invalid)')) continue;
  if (!content.includes('FormGroup') && !content.includes('FormBuilder')) continue;

  const before = content;
  const apiImport = relImport(file, path.join(root, 'core/api/api-error.service'));
  const utilPath = content.match(/from '([^']*form-errors\.util)'/)?.[1];

  if (!content.includes('ApiErrorService')) {
    content = content.replace(/^(import .+\n)/, `$1import { ApiErrorService } from '${apiImport}';\n`);
  }

  if (utilPath && !content.includes('guardFormSubmit')) {
    content = content.replace(
      new RegExp(`import \\{([^}]*)\\} from '${utilPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}';`),
      (_, inner) => {
        const parts = inner.split(',').map((s) => s.trim()).filter(Boolean);
        if (!parts.includes('guardFormSubmit')) parts.push('guardFormSubmit');
        return `import { ${parts.join(', ')} } from '${utilPath}';`;
      },
    );
  }

  if (!content.includes('toasts = inject(ApiErrorService)')) {
    content = content.replace(
      /export class (\w+)[^{]*\{/,
      (m) => `${m}\n  private readonly toasts = inject(ApiErrorService);\n`,
    );
    if (!content.includes("inject(ApiErrorService)")) {
      content = content.replace(
        /import \{([^}]*)\} from '@angular\/core';/,
        (m, inner) => {
          if (inner.includes('inject')) return m;
          return `import { ${inner.trim()}, inject } from '@angular/core';`;
        },
      );
    }
  }

  content = content.replace(
    /if \(this\.form\.invalid\) \{\s*markFormGroupTouched\(this\.form\);\s*return;\s*\}/g,
    'if (!guardFormSubmit(this.form, this.toasts)) return;',
  );
  content = content.replace(
    /if \(this\.form\.invalid\) return;/g,
    'if (!guardFormSubmit(this.form, this.toasts)) return;',
  );
  content = content.replace(
    /if \(this\.createForm\.invalid\) return;/g,
    'if (!guardFormSubmit(this.createForm, this.toasts)) return;',
  );
  content = content.replace(
    /if \(this\.passwordForm\.invalid\) \{\s*markFormGroupTouched\(this\.passwordForm\);\s*return;\s*\}/g,
    'if (!guardFormSubmit(this.passwordForm, this.toasts)) return;',
  );

  if (content !== before) {
    fs.writeFileSync(file, content);
    console.log('patched', path.relative(root, file));
  }
}
