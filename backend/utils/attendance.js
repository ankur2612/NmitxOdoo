const { eachDateKey } = require("./dateKey");

const MS_PER_HOUR = 1000 * 60 * 60;

function round2(value) {
  return Math.round(value * 100) / 100;
}

function computeWorkHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) {
    return 0;
  }

  return Math.max(0, round2((new Date(checkOut) - new Date(checkIn)) / MS_PER_HOUR));
}

function computeExtraHours(workHours, standardHoursPerDay) {
  return Math.max(0, round2(workHours - standardHoursPerDay));
}

function deriveStatus(workHours, halfDayThresholdHours) {
  if (workHours <= 0) {
    return "absent";
  }

  return workHours < halfDayThresholdHours ? "half-day" : "present";
}

function isWeekend(dateKey, workingDaysPerWeek) {
  const weekday = new Date(`${dateKey}T00:00:00Z`).getUTCDay();

  if (workingDaysPerWeek >= 7) {
    return false;
  }

  if (workingDaysPerWeek === 6) {
    return weekday === 0;
  }

  return weekday === 0 || weekday === 6;
}

function monthRange(month) {
  const [year, monthNumber] = String(month).split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

  return {
    start: `${month}-01`,
    end: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

function countWorkingDays(startKey, endKey, workingDaysPerWeek, holidayKeys = new Set()) {
  return eachDateKey(startKey, endKey).filter(
    (key) => !isWeekend(key, workingDaysPerWeek) && !holidayKeys.has(key)
  ).length;
}

module.exports = {
  round2,
  computeWorkHours,
  computeExtraHours,
  deriveStatus,
  isWeekend,
  monthRange,
  countWorkingDays,
};
