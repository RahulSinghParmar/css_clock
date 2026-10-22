export function validZone(zone) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone }).format();
    return typeof zone === 'string' && zone.length > 0;
  } catch {
    return false;
  }
}
export function zonedParts(date, zone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  return Object.fromEntries(
    parts.filter((p) => p.type !== 'literal').map((p) => [p.type, Number(p.value)]),
  );
}
export function angles({ hour, minute, second }, milliseconds = 0) {
  const s = second + milliseconds / 1000;
  return {
    hour: (hour % 12) * 30 + minute / 2 + s / 120,
    minute: minute * 6 + s / 10,
    second: s * 6,
  };
}
export function readPreferences(storage, fallback) {
  try {
    const value = JSON.parse(storage.getItem('tempo-v1'));
    return value && typeof value === 'object' ? { ...fallback, ...value } : fallback;
  } catch {
    return fallback;
  }
}
