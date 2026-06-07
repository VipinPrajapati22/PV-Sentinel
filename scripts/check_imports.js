const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const exts = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

function walk(dir, files=[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function isSourceFile(f) {
  return exts.some(ext => f.endsWith(ext));
}

function parseImports(text) {
  const imports = [];
  const importRe = /import\s+(?:[^'\"]+\s+from\s+)?['\"](\.\.?\/[^'\"]+)['\"]/g;
  const requireRe = /require\(\s*['\"](\.\.?\/[^'\"]+)['\"]\s*\)/g;
  let m;
  while ((m = importRe.exec(text))) imports.push(m[1]);
  while ((m = requireRe.exec(text))) imports.push(m[1]);
  return imports;
}

function resolveImport(baseFile, imp) {
  const baseDir = path.dirname(baseFile);
  const candidate = path.resolve(baseDir, imp);
  // try exact file with ext
  for (const ext of exts) {
    if (fs.existsSync(candidate + ext)) return candidate + ext;
  }
  // try as file with same name as import (if import includes ext already)
  if (fs.existsSync(candidate)) return candidate;
  // try index files in directory
  for (const ext of exts) {
    if (fs.existsSync(path.join(candidate, 'index' + ext))) return path.join(candidate, 'index' + ext);
  }
  return null;
}

const allFiles = walk(root).filter(isSourceFile);
const missing = new Map();

for (const file of allFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const imports = parseImports(text);
  for (const imp of imports) {
    if (!imp.startsWith('.') && !imp.startsWith('..')) continue; // skip package imports
    const resolved = resolveImport(file, imp);
    if (!resolved) {
      const key = imp;
      if (!missing.has(key)) missing.set(key, new Set());
      missing.get(key).add(path.relative(root, file));
    }
  }
}

const result = [];
for (const [imp, sources] of missing.entries()) {
  result.push({ import: imp, referencedBy: Array.from(sources) });
}

console.log(JSON.stringify(result, null, 2));
