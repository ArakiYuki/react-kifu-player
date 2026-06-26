import fs from 'fs';
import { parseKifu, extractEngineDataFromRecord } from './src/core/parser.ts';

const kifuStr = fs.readFileSync('demo/demo.kifu', 'utf-8');
const parsed = parseKifu(kifuStr);
const engineData = extractEngineDataFromRecord(parsed);

console.log('Evaluations length:', engineData.evaluations.length);
console.log('Candidates size:', engineData.candidates.size);

if (engineData.candidates.size > 0) {
  const ply = 15;
  console.log(`Candidates for ply ${ply}:`, engineData.candidates.get(ply));
}
