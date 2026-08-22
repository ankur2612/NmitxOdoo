const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function utc(key) {
  const [year, month, day] = key.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function keyOf(date) {
  return date.toISOString().slice(0, 10);
}

export function todayKey() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export function shiftDateKey(key, days) {
  const date = utc(key);
  date.setUTCDate(date.getUTCDate() + days);

  return keyOf(date);
}

export function monthOf(key) {
  return key.slice(0, 7);
}

export function shiftMonth(month, delta) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));

  return keyOf(date).slice(0, 7);
}

export function formatDateKey(key, options) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  }).format(utc(key));
}

export function formatMonth(month, options) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
    ...options,
  }).format(utc(`${month}-01`));
}

export function monthGrid(year, monthIndex) {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const total = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const lead = first.getUTCDay();

  const cells = Array.from({ length: lead }, () => null);

  for (let day = 1; day <= total; day += 1) {
    cells.push({
      day,
      key: `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      weekday: new Date(Date.UTC(year, monthIndex, day)).getUTCDay(),
    });
  }

  return cells;
}

export { WEEKDAYS };
