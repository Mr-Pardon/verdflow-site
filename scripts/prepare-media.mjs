import { mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const output = new URL('../docs/public/media/', import.meta.url);
await mkdir(output, { recursive: true });
const hero = process.argv[2];
if (hero) {
  await sharp(hero).resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 88 }).toFile(fileURLToPath(new URL('landscape-hero.webp', output)));
}
const captures = new URL('../.work/captures/', import.meta.url);
for (const name of await readdir(captures)) {
  if (!name.endsWith('.png')) continue;
  await sharp(fileURLToPath(new URL(name, captures))).webp({ quality: 90 }).toFile(fileURLToPath(new URL(name.replace('.png', '.webp'), output)));
}
console.log('Prepared reviewed website media.');
