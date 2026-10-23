import assert from 'node:assert/strict';
import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';

const root = fileURLToPath(new URL('../docs/', import.meta.url));
const markdown = new MarkdownIt({ html: true });
const errors = [];
async function files(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['dist', 'cache'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await files(full));
    else result.push(full);
  }
  return result;
}
async function checkReference(from, raw) {
  if (!raw || /^(https?:|mailto:|data:|#)/.test(raw)) return;
  const url = raw.split(/[?#]/)[0];
  if (!url || url.includes('${') || url.includes('`')) return;
  let target;
  if (url.startsWith('/media/') || url === '/favicon.svg') target = path.join(root, 'public', url);
  else {
    target = url.startsWith('/') ? path.join(root, url) : path.resolve(path.dirname(from), url);
    if (url.endsWith('.html')) target = target.replace(/\.html$/, '.md');
    else if (!path.extname(target)) target = url.endsWith('/') ? path.join(target, 'index.md') : `${target}.md`;
  }
  try { await access(target); }
  catch { errors.push(`${path.relative(root, from)}: missing ${raw}`); }
}
function walkTokens(tokens, found) {
  for (const token of tokens) {
    for (const name of ['href', 'src']) if (token.attrGet(name)) found.push(token.attrGet(name));
    if (token.children) walkTokens(token.children, found);
  }
}
const all = await files(root);
const pages = all.filter(file => file.endsWith('.md'));
for (const file of pages) {
  const source = await readFile(file, 'utf8');
  assert.ok(!/(?:\b[A-Za-z]:[\\/]|\/(?:Users|home)\/)/i.test(source), `Local absolute path in ${file}`);
  assert.ok(!/\b(?:TODO|Lorem ipsum)\b/.test(source), `Unfinished content in ${file}`);
  assert.ok(!/内测|尚未上传|尚待上传|待上传|源码基线|正式开源后/.test(source), `Development status in release documentation: ${file}`);
  const references = [];
  walkTokens(markdown.parse(source, {}), references);
  for (const match of source.matchAll(/(?<![:\w])(?:href|src)="([^"{}]+)"/g)) references.push(match[1]);
  for (const match of source.matchAll(/withBase\('([^']+)'\)/g)) references.push(match[1]);
  for (const ref of new Set(references)) await checkReference(file, ref);
}
for (const file of all.filter(file => /\.(vue|ts)$/.test(file))) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/['"](\/(?:[\w/-]+\.html|media\/[\w.-]+|favicon\.svg))['"]/g)) await checkReference(file, match[1]);
}
assert.deepEqual(errors, [], 'Unresolved content references');
assert.ok(pages.length >= 22, 'Guide coverage incomplete');
for (const file of all.filter(file => /\.(md|vue|ts|css)$/.test(file))) {
  const source = await readFile(file, 'utf8');
  assert.ok(!/[ \t]+$/m.test(source), `Trailing whitespace in ${file}`);
}
console.log(JSON.stringify({ passed: true, pages: pages.length, checkedFiles: all.length, brokenReferences: 0 }));
