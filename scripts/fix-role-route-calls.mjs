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

function fixLine(line) {
  if (!line.includes('roleRoute')) return line;

  // bookLink special case (nested broken backticks)
  if (line.includes("'appointments', 'book') +")) {
    return "    return roleRoute(this.router, 'appointments', 'book') + `?doctorId=${e.doctorId}&date=${e.preferredDate}`;";
  }

  // review segment broken
  if (line.includes('reviewSegment()`')) {
    return line.replace(
      /=>\s*\$\{roleRoute\(this\.router,\s*\$\{this\.reviewSegment\(\)`\},\s*\$\{r\.id\}\)`\};/,
      '=> roleRoute(this.router, this.reviewSegment(), String(r.id));',
    );
  }

  // => ${roleRoute(...)}`};
  let m = line.match(
    /^(\s*readonly rowLink = \([^)]+\) => )\$\{roleRoute\(this\.router,\s*((?:'[^']+'(?:,\s*)?)+)\$\{(\w+(?:\.\w+)*)\}\)`\};$/,
  );
  if (m) {
    const segs = m[2].replace(/,\s*$/, '');
    return `${m[1]}roleRoute(this.router, ${segs}String(${m[3]}));`;
  }

  // navigate([`${roleRoute(...)`}]);
  m = line.match(
    /navigate\(\[`\$\{roleRoute\(this\.router,\s*((?:'[^']+'(?:,\s*)?)*)\$\{(\w+(?:\.\w+)*)\}\)`\}\]\)/,
  );
  if (m) {
    const segs = m[1];
    return line.replace(
      /navigate\(\[`\$\{roleRoute\(this\.router,[^`]+\}`\}\]\)/,
      `navigate([roleRoute(this.router, ${segs}String(${m[2]}))])`,
    );
  }

  // navigate([`${roleRoute(this.router, 'x')`}]);
  m = line.match(/navigate\(\[`\$\{roleRoute\(this\.router,\s*((?:'[^']+'(?:,\s*)?)+)\)`\}\]\)/);
  if (m) {
    const segs = m[1].replace(/,\s*$/, '');
    return line.replace(
      /navigate\(\[`\$\{roleRoute\(this\.router,[^`]+\}`\}\]\)/,
      `navigate([roleRoute(this.router, ${segs})])`,
    );
  }

  // navigateByUrl
  m = line.match(
    /navigateByUrl\(`\$\{roleRoute\(this\.router,\s*((?:'[^']+'(?:,\s*)?)*)\$\{(\w+(?:\.\w+)*)\}\)`\}\)/,
  );
  if (m) {
    const segs = m[1];
    return line.replace(
      /navigateByUrl\(`\$\{roleRoute\(this\.router,[^`]+\}`\}\)/,
      `navigateByUrl(roleRoute(this.router, ${segs}String(${m[2]})))`,
    );
  }

  // return `${roleRoute(this.router, 'x', ${id})`};
  m = line.match(
    /return\s*`\$\{roleRoute\(this\.router,\s*((?:'[^']+'(?:,\s*)?)*)\$\{(\w+(?:\.\w+)*)\}\)`\};/,
  );
  if (m) {
    const segs = m[1];
    return `    return roleRoute(this.router, ${segs}String(${m[2]}));`;
  }

  // return `${roleRoute(this.router, 'x', 'y')`};
  m = line.match(/return\s*`\$\{roleRoute\(this\.router,\s*((?:'[^']+'(?:,\s*)?)+)\)`\};/);
  if (m) {
    const segs = m[1].replace(/,\s*$/, '');
    return line.replace(/return\s*`\$\{roleRoute[^;]+;/, `return roleRoute(this.router, ${segs});`);
  }

  // return `${roleRoute(this.router, 'x')`};
  m = line.match(/return\s*`\$\{roleRoute\(this\.router,\s*'([^']+)'\)`\};/);
  if (m) {
    return line.replace(/return\s*`\$\{roleRoute[^;]+;/, `return roleRoute(this.router, '${m[1]}');`);
  }

  return line;
}

for (const file of walk(src)) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const fixed = lines.map(fixLine);
  const content = fixed.join('\n');
  const before = lines.join('\n');
  if (content !== before) {
    fs.writeFileSync(file, content);
    console.log('fixed', path.relative(src, file));
  }
}
