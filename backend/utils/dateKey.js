const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }

  return formatter.format(date);
}

function isDateKey(value) {
  return DATE_KEY_PATTERN.test(String(value));
}

function eachDateKey(startKey, endKey) {
  const keys = [];
  const current = new Date(`${startKey}T00:00:00Z`);
  const end = new Date(`${endKey}T00:00:00Z`);

  while (current <= end) {
    keys.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return keys;
}

module.exports = { toDateKey, isDateKey, eachDateKey, DATE_KEY_PATTERN, APP_TIMEZONE };
