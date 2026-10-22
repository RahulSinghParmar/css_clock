import { test } from 'node:test';
import assert from 'node:assert/strict';
import { angles, zonedParts, validZone, readPreferences } from '../time.js';
test('clock angles include minutes and seconds', () => {
  assert.deepEqual(angles({ hour: 3, minute: 30, second: 0 }), {
    hour: 105,
    minute: 180,
    second: 0,
  });
  assert.equal(angles({ hour: 0, minute: 0, second: 0 }, 500).second, 3);
});
test('midnight is hour zero and India has a fractional offset', () => {
  const date = new Date('2026-01-01T00:00:00Z');
  assert.equal(zonedParts(date, 'UTC').hour, 0);
  assert.deepEqual(zonedParts(date, 'Asia/Kolkata'), { hour: 5, minute: 30, second: 0 });
});
test('timezone conversion respects daylight saving changes', () => {
  assert.equal(zonedParts(new Date('2026-03-08T06:30:00Z'), 'America/New_York').hour, 1);
  assert.equal(zonedParts(new Date('2026-03-08T07:30:00Z'), 'America/New_York').hour, 3);
});
test('invalid timezones and inaccessible storage are safe', () => {
  assert.equal(validZone('invalid/zone'), false);
  const defaults = { theme: 'light' };
  assert.deepEqual(readPreferences(null, defaults), defaults);
  assert.deepEqual(readPreferences({ getItem: () => '{broken' }, defaults), defaults);
});
