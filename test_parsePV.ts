import { Record, parsePV } from 'tsshogi';

// Start a blank record
const record = new Record();
record.goto(0);

// We need a valid Position object.
const pos = record.position;
const result = parsePV(pos, '▲７六歩 △３四歩 ▲２六歩');

console.log('Result type:', typeof result);
if (result instanceof Error) {
  console.log('Error:', result.message);
} else {
  console.log('Moves:', result.map(m => m.usi).join(' '));
}
