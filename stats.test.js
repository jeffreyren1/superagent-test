import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { summarizeJson } from './stats.js';

const cases = [
  ['normal array', '[1,2,3,4]', { count: 4, sum: 10, min: 1, max: 4, mean: 2.5 }],
  ['empty array', '[]', { count: 0, sum: 0, min: null, max: null, mean: null }],
  ['negative numbers', '[-8,-2,-5]', { count: 3, sum: -15, min: -8, max: -2, mean: -5 }],
  ['decimals', '[1.5,2.25,-0.75]', { count: 3, sum: 3, min: -0.75, max: 2.25, mean: 1 }],
  ['single value', '[7]', { count: 1, sum: 7, min: 7, max: 7, mean: 7 }],
  ['zero values', '[0,0]', { count: 2, sum: 0, min: 0, max: 0, mean: 0 }],
  ['mixed signs', '[-2,0,8]', { count: 3, sum: 6, min: -2, max: 8, mean: 2 }],
  ['whitespace', ' \n [1, 3]\t', { count: 2, sum: 4, min: 1, max: 3, mean: 2 }],
];

for (const [name, input, expected] of cases) {
  test(name, () => assert.deepEqual(summarizeJson(input), expected));
}

test('ordinary floating-point rounding is retained', () => {
  const result = summarizeJson('[0.1,0.2]');
  assert.ok(Math.abs(result.sum - 0.3) < 1e-15);
  assert.ok(Math.abs(result.mean - 0.15) < 1e-15);
});

test('large arrays do not depend on function argument limits', () => {
  const result = summarizeJson(JSON.stringify(Array(200_000).fill(2)));
  assert.deepEqual(result, { count: 200_000, sum: 400_000, min: 2, max: 2, mean: 2 });
});

for (const input of ['', '[1,', '[1,]', 'NaN', '[NaN]', '[Infinity]', '[undefined]']) {
  test(`invalid JSON: ${JSON.stringify(input)}`, () => {
    assert.throws(() => summarizeJson(input), { name: 'SyntaxError', message: 'Input is not valid JSON.' });
  });
}

for (const input of ['null', '{}', '42', 'true', '"text"']) {
  test(`non-array JSON: ${input}`, () => {
    assert.throws(() => summarizeJson(input), { name: 'TypeError', message: 'Input must be a JSON array.' });
  });
}

for (const value of ['"2"', 'null', 'true', '{}', '[]', '1e400', '-1e400']) {
  test(`non-finite or non-numeric element: ${value}`, () => {
    assert.throws(() => summarizeJson(`[1,${value}]`), {
      name: 'TypeError', message: 'Element at index 1 must be a finite number.',
    });
  });
}

test('non-text input is rejected without coercion', () => {
  for (const input of [null, undefined, 1, [1, 2], {}]) {
    assert.throws(() => summarizeJson(input), { name: 'TypeError', message: 'Input must be JSON text.' });
  }
});

test('overflow is rejected instead of being serialized as null', () => {
  assert.throws(() => summarizeJson('[1e308,1e308]'), {
    name: 'RangeError', message: 'Sum exceeds the finite numeric range.',
  });
});

test('left-to-right intermediate overflow is rejected even after cancellation', () => {
  assert.throws(() => summarizeJson('[1e308,1e308,-1e308]'), RangeError);
  assert.equal(summarizeJson('[1e308,-1e308,1e308]').sum, 1e308);
});

const cli = fileURLToPath(new URL('./cli.js', import.meta.url));
function runCli(input, args = []) {
  const result = spawnSync(process.execPath, [cli, ...args], { input, encoding: 'utf8' });
  assert.ifError(result.error);
  return result;
}

for (const [name, input, expected] of cases) {
  test(`CLI outputs JSON for ${name}`, () => {
    const result = runCli(input);
    assert.equal(result.status, 0);
    assert.equal(result.stderr, '');
    assert.deepEqual(JSON.parse(result.stdout), expected);
    assert.equal(result.stdout.trim().split('\n').length, 1);
  });
}

for (const input of ['[1,', '{}', '[1,"2"]', '[1e400]', '[1e308,1e308]', '']) {
  test(`CLI fails cleanly for ${JSON.stringify(input)}`, () => {
    const result = runCli(input);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^Error: .+\r?\n$/);
  });
}

test('CLI rejects unexpected arguments', () => {
  const result = runCli('[1,2]', ['ignored.json']);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /Usage: node cli\.js/);
});
