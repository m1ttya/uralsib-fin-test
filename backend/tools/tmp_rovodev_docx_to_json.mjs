// Temporary one-off converter: DOCX (adults general) -> enrich backend/data/tests/adults/general.json with correctExplanation
// Usage:
//  node backend/tools/tmp_rovodev_docx_to_json.mjs "Тесты/Взрослые/Тест для взрослых Общий тест .docx"
// Notes:
//  - Detects correct options by HTML tags <strong> and <u> (bold+underline prioritized, then bold or underline)
//  - Extracts explanation block immediately after options, until next question heuristic
//  - Merges explanations into existing JSON file (adds correctExplanation on questions)

import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';

const root = process.cwd();
const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Provide path to DOCX, e.g., node backend/tools/tmp_rovodev_docx_to_json.mjs "Тесты/Взрослые/Тест для взрослых Общий тест .docx"');
  process.exit(1);
}

const TEST_JSON_PATH = path.join(root, 'backend', 'data', 'tests', 'adults', 'general.json');

function htmlToText(html) {
  return html
    .replace(/\n/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitParagraphs(html) {
  // Not used by cheerio approach anymore, but keep for fallback

  // crude split on paragraphs
  const parts = html
    .split(/<p[^>]*>/gi)
    .map(s => s.replace(/<\/p>/gi, '').trim())
    .filter(Boolean);
  return parts;
}

function isLikelyQuestion(p) {
  // Heuristic: question lines are longer and not starting with bullet/letter markers
  const t = htmlToText(p).toLowerCase();
  if (!t) return false;
  if (/^([а-яa-z]\)|\d+\.|•|-)/i.test(t)) return false; // looks like option/bullet
  return t.length > 10;
}

function isOption(p) {
  const t = htmlToText(p);
  return /^([А-ЯA-Zа-яa-z]|\d)[)\.-]/.test(t) || /^[-•]/.test(t) || t.length < 140;
}

function hasBold(html) {
  return /<strong>|<b>/i.test(html);
}
function hasUnderline(html) {
  return /<u>/i.test(html);
}

async function main() {
  const DEBUG = true;
  const abs = path.isAbsolute(inputPath) ? inputPath : path.join(root, inputPath);
  const { value: html } = await mammoth.convertToHtml({ path: abs }, { styleMap: ["u => u"] });
  // Parse with cheerio to handle lists and inline tags
  const $ = cheerio.load(html);
  // Collect blocks: we treat top-level ol/li as questions; the next sibling block that is a ul is options; surrounding text nodes as notes

  // Load base JSON
  const raw = await fs.readFile(TEST_JSON_PATH, 'utf-8');
  const json = JSON.parse(raw);
  const questions = json.questions || [];

  let qIndex = 0;
  const enriched = [];

  // Strategy: for each top-level ordered list item (<ol><li>Question...</li></ol>)
  $('ol > li').each((idx, li) => {
    if (qIndex >= questions.length) return;
    const qHtml = $.html(li);
    const qText = htmlToText(qHtml);
    if (DEBUG && qIndex < 2) {
      console.log('\n--- SEGMENT START (qIndex=' + qIndex + ') ---');
      console.log('Question raw:', qHtml);
      console.log('Question text:', qText);
    }

    // Find next UL after this OL, but before the next OL
    const ol = $(li).closest('ol');
    let ptr = ol.next();
    let ul = null;
    while (ptr && ptr.length) {
      const tag = ptr[0].tagName?.toLowerCase?.();
      if (tag === 'ol') break; // reached next question
      if (tag === 'ul') { ul = ptr; break; }
      ptr = ptr.next();
    }
    const opts = [];
    let explanationText = '';
    if (ul && ul.length) {
      ul.children('li').each((j, li2) => {
        const ohtml = $.html(li2);
        opts.push(ohtml);
      });
      // Explanation: text after this UL until the next OL (skip further ULs)
      const collected = [];
      let sib = ul.next();
      while (sib && sib.length) {
        const tag = sib[0].tagName?.toLowerCase?.();
        if (tag === 'ol') break; // next question starts
        if (tag !== 'ul') {
          const t = sib.text().trim();
          if (t) collected.push(t);
        }
        sib = sib.next();
      }
      explanationText = htmlToText(collected.join(' '))
        .replace(/^Тест для взрослого населения\.[^:]*:/i, '')
        .replace(qText, '')
        .trim();
    }

    // Determine correct by bold+underline priority, then bold, then underline
    let correctOptIdx = -1;
    let bestScore = -1;
    opts.forEach((optHtml, idx2) => {
      const score = (hasBold(optHtml) && hasUnderline(optHtml)) ? 2 : hasBold(optHtml) ? 1 : hasUnderline(optHtml) ? 1 : 0;
      if (score > bestScore) { bestScore = score; correctOptIdx = idx2; }
    });

    const jq = questions[qIndex];
    if (jq) {
      if (correctOptIdx >= 0) jq.correctIndex = correctOptIdx;
      if (explanationText) jq.correctExplanation = explanationText;
      enriched.push({ id: jq.id, correctIndex: jq.correctIndex, hasExplanation: Boolean(jq.correctExplanation) });
    }
    qIndex++;
  });

  await fs.writeFile(TEST_JSON_PATH, JSON.stringify(json, null, 2), 'utf-8');
  console.log('Updated:', TEST_JSON_PATH);
  console.log('Questions enriched:', enriched.length);
  console.table(enriched.slice(0, 5));
}

main().catch(err => { console.error(err); process.exit(1); });
