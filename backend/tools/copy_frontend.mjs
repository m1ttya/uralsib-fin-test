import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const src = path.join(root, '..', 'frontend', 'dist');
const dest = path.join(root, 'public');

async function copyDir(from, to) {
  await fs.mkdir(to, { recursive: true });
  const entries = await fs.readdir(from, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(from, e.name);
    const d = path.join(to, e.name);
    if (e.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

await copyDir(src, dest);
console.log('Copied frontend build to backend/public');
