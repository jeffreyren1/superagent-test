# JSON array statistics

A dependency-free Node.js utility that reads a JSON array from standard input and
writes a single JSON object with `count`, `sum`, `min`, `max`, and `mean`.
Requires Node.js 22 or newer. No installation step is needed.

## Command line

PowerShell:

```powershell
'[1, 2, 3, 4]' | node cli.js
Get-Content -Raw -LiteralPath input.json | node cli.js
```

POSIX shells:

```sh
printf '%s' '[1, 2, 3, 4]' | node cli.js
node cli.js < input.json
```

Output:

```json
{"count":4,"sum":10,"min":1,"max":4,"mean":2.5}
```

An empty array returns:

```json
{"count":0,"sum":0,"min":null,"max":null,"mean":null}
```

Invalid JSON, non-array input, and any element that is not a finite number are
rejected. Numeric strings, booleans, nulls, objects, and nested arrays are not
coerced into numbers. Empty input is invalid JSON, not an empty array.
Errors go to standard error with exit code 1 and no standard output.
Successful calls exit with code 0. Unexpected CLI arguments are rejected;
provide JSON through standard input rather than a positional filename.

## Module API

```js
import { summarizeJson } from './stats.js';

const result = summarizeJson('[1.5, 2.25, -0.75]');
// { count: 3, sum: 3, min: -0.75, max: 2.25, mean: 1 }
```

The argument must be JSON text. Invalid JSON throws `SyntaxError`; wrong input
shapes or elements throw `TypeError`. A non-finite sum throws `RangeError`,
including intermediate overflow, rather than emitting misleading JSON nulls.
Calculations use JavaScript's ordinary IEEE-754 numbers and left-to-right
addition: floating-point rounding and loss of precision beyond safe integers
are not corrected. This is not an arbitrary-precision or streaming utility;
the full input is read and parsed in memory.

## Tests

```sh
npm test
```

Uses only `node:test` and `node:assert/strict`, plus Node's built-in process
utilities for CLI integration tests. Coverage includes normal and empty arrays,
negative numbers, decimals, malformed JSON, non-array input, non-numeric elements,
non-finite numbers, overflow, large arrays, and CLI output/error/exit behavior.

## Continuous integration

GitHub Actions runs syntax checks and `npm test` on Node.js 22 and 24, on both
Ubuntu and Windows. It runs for pull requests targeting any branch, pushes to
`main`, and manual dispatch. Each matrix job has a 10-minute timeout; newer runs
cancel superseded runs for the same ref. See the PR Checks tab for results/logs.

No dependency installation or npm cache is needed: the project has no external
dependencies or lockfile. Official actions are pinned to commit SHAs, checkout
does not persist credentials, and the workflow token only has `contents: read`.
The workflow does not merge, publish, or deploy. Requiring these checks before
merge is a separate repository branch-protection setting and is not enabled by
this workflow.
