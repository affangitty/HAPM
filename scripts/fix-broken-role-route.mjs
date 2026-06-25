#!/usr/bin/env node
/** Fix broken template literals from migrate-role-prefix.mjs */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../frontend/hapm-web/src');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

for (const file of walk(root)) {
  let content = fs.readFileSync(file, 'utf8');
  const before = content;

  // => ${roleRoute(...)};  or navigate patterns
  content = content.replace(
    /(\=\>|return |navigateByUrl\(|navigate\(\[)(?!\`)\$\{roleRoute\(/g,
    '$1`${roleRoute(',
  );

  // Close missing backticks: roleRoute(...)}); where not already closed
  content = content.replace(
    /roleRoute\(([^`]*?)\)\}(?!\`)/g,
    (match, inner) => {
      if (inner.includes('`')) return match;
      return `roleRoute(${inner})\`}`;
    },
  );

  // Fix double issues: `}`}; -> `};
  content = content.replace(/\`}\`;/g, '`;');
  content = content.replace(/\`}\`\)/g, '`)');

  // Fix waitlist promotion broken query string
  content = content.replace(
    /roleRoute\(this\.router, 'appointments', book\?doctorId=\$\{e\.doctorId\}&date=\$\{e\.preferredDate\}\)/,
    "roleRoute(this.router, 'appointments', 'book') + `?doctorId=${e.doctorId}&date=${e.preferredDate}`",
  );

  // review-list segment
  content = content.replace(
    /roleRoute\(this\.router, \$\{this\.reviewSegment\(\)\}, \$\{r\.id\}\)/,
    'roleRoute(this.router, this.reviewSegment(), String(r.id))',
  );

  if (content !== before) {
    fs.writeFileSync(file, content);
    console.log('fixed', path.relative(root, file));
  }
}
