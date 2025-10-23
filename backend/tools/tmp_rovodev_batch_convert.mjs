import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';

const root = process.cwd();

const MAP = [
  { doc: 'Тесты/Взрослые/Тест для взрослых Общий тест .docx', out: 'backend/data/tests/adults/general.json' },
  { doc: 'Тесты/Взрослые/Тест для взрослых Уровень 1.docx', out: 'backend/data/tests/adults/level_1.json' },
  { doc: 'Тесты/Взрослые/Тест для взрослых Уровень 2.docx', out: 'backend/data/tests/adults/level_2.json' },
  { doc: 'Тесты/Взрослые/Тест для взрослых. Уровень 3.docx', out: 'backend/data/tests/adults/level_3.json' },

  { doc: 'Тесты/Пенсионеры/Тест для пенсионеров общий тест.docx', out: 'backend/data/tests/pensioners/general.json' },
  { doc: 'Тесты/Пенсионеры/Тест для пенсионеров уровень 1.docx', out: 'backend/data/tests/pensioners/level_1.json' },
  { doc: 'Тесты/Пенсионеры/Тест для пенсионеров уровень 2.docx', out: 'backend/data/tests/pensioners/level_2.json' },
  { doc: 'Тесты/Пенсионеры/Тест для пенсионеров уровень 3.docx', out: 'backend/data/tests/pensioners/level_3.json' },

  { doc: 'Тесты/Дети, школьники/Тест для школьников (5-10 лет) .docx', out: 'backend/data/tests/children/level_1.json' },
  { doc: 'Тесты/Дети, школьники/Тест для школьников уровень 2 (11-14 лет).docx', out: 'backend/data/tests/children/level_2.json' },
  { doc: 'Тесты/Дети, школьники/Тест для школьников уровень 3 (15-18 лет).docx', out: 'backend/data/tests/children/level_3.json' },
];

function htmlToText(html) {
  return (html || '').replace(/\n/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function hasBold(html) { return /<strong>|<b>/i.test(html || ''); }
function hasUnderline(html) { return /<u>/i.test(html || ''); }

async function convertOne(inputPath, outJson) {
  const abs = path.isAbsolute(inputPath) ? inputPath : path.join(root, inputPath);
  const { value: html } = await mammoth.convertToHtml({ path: abs }, { styleMap: ["u => u"] });
  const $ = cheerio.load(html);

  const raw = await fs.readFile(path.join(root, outJson), 'utf-8');
  const json = JSON.parse(raw);
  const questions = json.questions || [];

  let qIndex = 0;

  const splitNodesToLinesAndDetect = ($, nodes, qText) => {
    const lines = [];
    nodes.forEach(n => {
      const tag = (n[0].tagName || '').toLowerCase();
      if (tag === 'table') {
        n.find('tr').each((_, tr) => {
          $(tr).find('td,th').each((__, td) => {
            const h = $(td).html();
            if (h) lines.push(h);
          });
        });
      } else if (tag === 'p' || tag === 'div') {
        const h = n.html() || '';
        const parts = h.split(/<br\s*\/?/i);
        parts.forEach(p => { if (p && p.trim()) lines.push(p.trim()); });
      } else {
        const h = n.html();
        if (h && h.trim()) lines.push(h.trim());
      }
    });

    const isOptionLine = (t) => {
      const plain = htmlToText(t);
      if (!plain) return false;
      // Accept: optional leading dash + letter + ) or .
      if (/^\s*(?:[-–—]\s*)?[A-Za-zА-Яа-я][\.)]/.test(plain)) return true;
      if (/^\s*[-•]/.test(plain)) return true;
      return plain.length <= 140;
    };

    // Explanation tail after last option-like line
    let lastOpt = -1;
    lines.forEach((h, i) => { if (isOptionLine(h)) lastOpt = i; });
    let explanationFromLines = '';
    if (lastOpt >= 0 && lastOpt < lines.length - 1) {
      const tail = lines.slice(lastOpt + 1).map(s => htmlToText(s)).filter(Boolean);
      explanationFromLines = tail.join(' ').replace(qText, '').replace(/\s+/g, ' ').trim();
    }

    // Options are all option-like lines in order
    const optionsFromLines = lines.filter(isOptionLine);
    return { lines, explanationFromLines, optionsFromLines };
  };

  const processOlUl = () => {
    $('ol > li').each((idx, li) => {
      if (qIndex >= questions.length) return;
      const qHtml = $.html(li);
      const qText = htmlToText(qHtml);

      // Collect nodes until next <ol>
      const ol = $(li).closest('ol');
      let ptr = ol.next();
      const nodes = [];
      while (ptr && ptr.length) {
        const tag = (ptr[0].tagName || '').toLowerCase();
        if (tag === 'ol') break;
        nodes.push(ptr);
        ptr = ptr.next();
      }

      // Prefer explicit <ul>
      let opts = [];
      let explanationText = '';
      const firstUl = nodes.find(n => ((n[0].tagName || '').toLowerCase() === 'ul'));
      if (firstUl) {
        firstUl.children('li').each((j, li2) => { opts.push($.html(li2)); });
        // explanation after UL until next OL
        const collected = [];
        let sib = firstUl.next();
        while (sib && sib.length) {
          const tag = (sib[0].tagName || '').toLowerCase();
          if (tag === 'ol') break;
          if (tag !== 'ul') {
            const t = sib.text().trim();
            if (t) collected.push(t);
          }
          sib = sib.next();
        }
        explanationText = htmlToText(collected.join(' ')).replace(qText, '').trim();
      } else {
        const { explanationFromLines, optionsFromLines } = splitNodesToLinesAndDetect($, nodes, qText);
        opts = optionsFromLines;
        explanationText = explanationFromLines;
      }

      // Detect correct option (bold+underline priority)
      let correctOptIdx = -1, bestScore = -1;
      opts.forEach((optHtml, i) => {
        const score = (hasBold(optHtml) && hasUnderline(optHtml)) ? 2 : ((hasBold(optHtml) || hasUnderline(optHtml)) ? 1 : 0);
        if (score > bestScore) { bestScore = score; correctOptIdx = i; }
      });

      const jq = questions[qIndex];
      if (jq) {
        if (correctOptIdx >= 0) jq.correctIndex = correctOptIdx;
        if (explanationText) jq.correctExplanation = explanationText;
      }
      qIndex++;
    });
  };

  if ($('ol > li').length === 0) {
    // Fallback: parse entire body by blocks of options (works without numeric question headings)
    const bodyNodes = [];
    $('table').each((_, t) => bodyNodes.push($(t)));
    $('p,div').each((_, el) => bodyNodes.push($(el)));

    const lines = [];
    bodyNodes.forEach(n => {
      const tag = (n[0].tagName || '').toLowerCase();
      if (tag === 'table') {
        n.find('tr').each((_, tr) => {
          $(tr).find('td,th').each((__, td) => { const h = $(td).html(); if (h) lines.push(h); });
        });
      } else {
        const h = n.html() || '';
        const parts = h.split(/<br\s*\/?/i);
        parts.forEach(p => { if (p && p.trim()) lines.push(p.trim()); });
      }
    });

    const isOptionLine = (t) => {
      const plain = htmlToText(t);
      if (!plain) return false;
      if (/^\s*(?:[-–—]\s*)?[A-Za-zА-Яа-я][\.)]/.test(plain)) return true;
      if (/^\s*[-•]/.test(plain)) return true;
      return false;
    };

    let i = 0;
    while (i < lines.length && qIndex < questions.length) {
      while (i < lines.length && !isOptionLine(lines[i])) i++;
      if (i >= lines.length) break;
      const opts = [];
      while (i < lines.length && isOptionLine(lines[i])) { opts.push(lines[i]); i++; }
      if (opts.length < 2) { i++; continue; }
      const expStart = i;
      while (i < lines.length && !isOptionLine(lines[i])) i++;
      const expl = htmlToText(lines.slice(expStart, i).join(' '));

      let best = -1, bestScore = -1;
      opts.forEach((optHtml, idx) => {
        const score = (hasBold(optHtml) && hasUnderline(optHtml)) ? 2 : ((hasBold(optHtml) || hasUnderline(optHtml)) ? 1 : 0);
        if (score > bestScore) { bestScore = score; best = idx; }
      });

      const jq = questions[qIndex];
      if (jq) {
        if (best >= 0) jq.correctIndex = best;
        if (expl) jq.correctExplanation = expl;
      }
      qIndex++;
    }
  } else {
    processOlUl();
  }

  await fs.writeFile(path.join(root, outJson), JSON.stringify(json, null, 2), 'utf-8');
  return { file: inputPath, updated: qIndex };
}

(async () => {
  const results = [];
  for (const m of MAP) {
    try {
      const r = await convertOne(m.doc, m.out);
      results.push({ file: m.doc, updated: r.updated ?? 0 });
    } catch (e) {
      results.push({ file: m.doc, error: e.message });
    }
  }
  console.table(results);
})();