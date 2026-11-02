import { readFileSync } from 'node:fs';
import { summarizeJson } from './stats.js';

try {
  if (process.argv.length !== 2) {
    throw new Error('Usage: node cli.js < input.json (JSON is read from stdin).');
  }
  const input = readFileSync(0, 'utf8');
  console.log(JSON.stringify(summarizeJson(input)));
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
