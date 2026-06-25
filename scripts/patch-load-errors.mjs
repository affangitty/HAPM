#!/usr/bin/env node
/** Adds loadError signal and setPageLoadFailed to list/dashboard pages with silent error handlers. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend/hapm-web/src/app/features');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.component.ts')) files.push(full);
  }
  return files;
}

const utilImport = "import { setPageLoadFailed } from '../../../shared/utils/page-load.util';";
const emptyImport = "import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';";

function depthImport(filePath, symbol) {
  const rel = path.relative(path.join(root, '..'), path.dirname(filePath));
  const depth = rel.split(path.sep).filter(Boolean).length;
  const prefix = '../'.repeat(depth);
  if (symbol === 'page-load') return `import { setPageLoadFailed } from '${prefix}shared/utils/page-load.util';`;
  return `import { UiEmptyStateComponent } from '${prefix}shared/components/ui/empty-state/ui-empty-state.component';`;
}

for (const file of walk(root)) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('error: () => this.loading.set(false)')) continue;

  if (!content.includes('loadError')) {
    content = content.replace(
      /readonly loading = signal\(true\);/,
      'readonly loading = signal(true);\n  readonly loadError = signal<string | null>(null);',
    );
  }

  content = content.replace(
    /error: \(\) => this\.loading\.set\(false\)/g,
    "error: () => setPageLoadFailed(this.loading, this.loadError)",
  );

  if (!content.includes('page-load.util')) {
    const line = depthImport(file, 'page-load');
    const idx = content.indexOf('\nimport ');
    const end = content.indexOf('\n', idx + 1);
    content = content.slice(0, end + 1) + line + '\n' + content.slice(end + 1);
  }

  if (content.includes('@if (loading())') && !content.includes('loadError()')) {
    content = content.replace(
      /@if \(loading\(\)\) \{[\s\S]*?\} @else \{/,
      (match) => match.replace('} @else {', `}\n    } @else if (loadError()) {\n      <app-ui-empty-state class="mt-6 block" [title]="loadError()!" />\n    } @else {`),
    );
    if (!content.includes('UiEmptyStateComponent')) {
      const imp = depthImport(file, 'empty');
      const idx = content.indexOf('\nimport ');
      const end = content.indexOf('\n', idx + 1);
      content = content.slice(0, end + 1) + imp + '\n' + content.slice(end + 1);
      content = content.replace(/imports: \[\s*\n/, (m) => m + '    UiEmptyStateComponent,\n');
    }
  }

  fs.writeFileSync(file, content);
  console.log('patched', path.relative(root, file));
}
