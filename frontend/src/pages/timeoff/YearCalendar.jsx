import { WEEKDAYS, monthGrid } from "../../lib/dates";

const TONES = {
  approved: "bg-jade/25 text-jade",
  pending: "bg-accent/25 text-accent",
  rejected: "text-clay line-through decoration-clay/70",
  holiday: "text-steel",
};

const LEGEND = [
  { key: "approved", label: "Validated" },
  { key: "pending", label: "To Approve" },
  { key: "rejected", label: "Refused" },
  { key: "holiday", label: "Public Holiday" },
];

function Month({ year, monthIndex, statusByDate, holidayByDate, today }) {
  const cells = monthGrid(year, monthIndex);
  const name = new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    month: "long",
  }).format(new Date(Date.UTC(year, monthIndex, 1)));

  return (
    <div className="rounded-panel border border-line bg-surface p-3">
      <p className="mb-2 text-xs font-medium text-ink">{name}</p>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((label, index) => (
          <span key={index} className="text-[0.625rem] text-ink-faint">
            {label}
          </span>
        ))}

        {cells.map((cell, index) => {
          if (!cell) {
            return <span key={`pad-${index}`} />;
          }

          const status = statusByDate.get(cell.key);
          const holiday = holidayByDate.get(cell.key);
          const tone = status ? TONES[status] : holiday ? TONES.holiday : "";
          const weekend = cell.weekday === 0 || cell.weekday === 6;
          const isToday = cell.key === today;

          return (
            <span
              key={cell.key}
              title={
                holiday
                  ? `${holiday}${status ? ` · ${status}` : ""}`
                  : status
                    ? `Time off · ${status}`
                    : undefined
              }
              className={`mx-auto grid size-5 place-items-center rounded text-[0.6875rem] tnum ${
                tone || (weekend ? "text-ink-faint" : "text-ink-dim")
              } ${isToday ? "ring-1 ring-line-strong" : ""}`}
            >
              {cell.day}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function YearCalendar({ year, leaves, holidays, today }) {
  const statusByDate = new Map();

  for (const leave of leaves) {
    const start = new Date(`${leave.startDate}T00:00:00Z`);
    const end = new Date(`${leave.endDate}T00:00:00Z`);

    for (let day = new Date(start); day <= end; day.setUTCDate(day.getUTCDate() + 1)) {
      statusByDate.set(day.toISOString().slice(0, 10), leave.status);
    }
  }

  const holidayByDate = new Map(holidays.map((holiday) => [holiday.date, holiday.name]));

  return (
    <section>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }, (_, monthIndex) => (
          <Month
            key={monthIndex}
            year={year}
            monthIndex={monthIndex}
            statusByDate={statusByDate}
            holidayByDate={holidayByDate}
            today={today}
          />
        ))}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {LEGEND.map((entry) => (
          <li key={entry.key} className="flex items-center gap-2 text-xs text-ink-dim">
            <span
              aria-hidden="true"
              className={`grid size-4 place-items-center rounded text-[0.625rem] ${TONES[entry.key]}`}
            >
              1
            </span>
            {entry.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
