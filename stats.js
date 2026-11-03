/** Parse a JSON array of finite numbers and return its statistics. */
export function summarizeJson(text) {
  if (typeof text !== 'string') {
    throw new TypeError('Input must be JSON text.');
  }

  let values;
  try {
    values = JSON.parse(text);
  } catch {
    throw new SyntaxError('Input is not valid JSON.');
  }

  if (!Array.isArray(values)) {
    throw new TypeError('Input must be a JSON array.');
  }

  let sum = 0;
  let min = null;
  let max = null;
  for (const [index, value] of values.entries()) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError(`Element at index ${index} must be a finite number.`);
    }
    sum += value;
    min = min === null ? value : Math.min(min, value);
    max = max === null ? value : Math.max(max, value);
  }

  if (!Number.isFinite(sum)) {
    throw new RangeError('Sum exceeds the finite numeric range.');
  }

  return {
    count: values.length,
    sum,
    min,
    max,
    mean: values.length === 0 ? null : sum / values.length,
  };
}
