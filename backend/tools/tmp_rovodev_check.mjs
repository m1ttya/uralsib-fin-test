import fs from 'fs/promises';
import path from 'path';

const file = path.join(process.cwd(), 'backend', 'data', 'tests', 'adults', 'general.json');
const raw = await fs.readFile(file, 'utf-8');
const data = JSON.parse(raw);
const qs = data.questions.slice(0, 4);
for (const q of qs) {
  const correctText = q.options[q.correctIndex];
  console.log('\nID:', q.id);
  console.log('Q:', q.text);
  console.log('Correct:', correctText);
  console.log('Explanation:\n', q.correctExplanation);
}