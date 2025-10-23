import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';

const root = process.cwd();
const inputPath = process.argv[2] || 'Продукты банка.docx';
const OUT_PATH = path.join(root, 'backend', 'data', 'products.json');

function text(t) { return t.replace(/\s+/g, ' ').trim(); }

async function main() {
  const abs = path.isAbsolute(inputPath) ? inputPath : path.join(root, inputPath);
  const { value: html } = await mammoth.convertToHtml({ path: abs }, { styleMap: ["u => u"] });
  const $ = cheerio.load(html);

  // Heuristic: sections per category and level may be marked by headings or bold text
  // We will scan for anchors like Adults/Children/Pensioners and Level 1/2/3 or Low/Medium/High
  // Fallback: build flat list and let frontend filter by keywords in title.

  const items = [];
  $('a, p, li, h1, h2, h3').each((i, el) => {
    const t = $(el).text().trim();
    const href = $(el).attr('href');
    // A link likely a product
    if (href && /https?:\/\//i.test(href)) {
      items.push({ raw: t, url: href });
    }
  });

  // Group heuristics: try infer category/level from nearby text
  const products = items.map(it => ({
    category: 'generic',
    level: 'all',
    title: it.raw || 'Продукт Уралсиб',
    linkUrl: it.url,
    linkText: 'Перейти'
  }));

  const data = { products };
  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log('Wrote', OUT_PATH, 'items:', products.length);
}

main().catch(err => { console.error(err); process.exit(1); });
