const ID_PARTS = [
  { text: "OI", label: "Company code" },
  { text: "JODO", label: "First + last name" },
  { text: "2026", label: "Year joined" },
  { text: "0001", label: "Joining number" },
];

function Wordmark() {
  return (
    <div className="flex items-end gap-1.5">
      <span className="font-display text-2xl leading-none text-ink">Dayflow</span>
      <span aria-hidden="true" className="mb-1 size-1.5 bg-accent" />
    </div>
  );
}

export default function AuthLayout({ title, lead, children, aside }) {
  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-[1fr_1.05fr]">
      <section className="hidden flex-col justify-between border-r border-line bg-surface p-10 lg:flex xl:p-14">
        <Wordmark />

        <div className="max-w-md">
          <p className="font-display text-4xl leading-[1.15] text-ink xl:text-5xl">
            Every workday,
            <br />
            <span className="italic text-accent">perfectly aligned.</span>
          </p>
          <p className="mt-5 text-ink-dim">
            Attendance, time off, and payroll for the whole company, in one place.
          </p>
        </div>

        {aside ?? (
          <div>
            <p className="text-xs font-medium tracking-wide text-ink-faint uppercase">
              Anatomy of a Login ID
            </p>

            <div className="mt-4 flex gap-1 font-mono text-lg tnum">
              {ID_PARTS.map((part, index) => (
                <span
                  key={part.text}
                  className={index % 2 === 0 ? "text-accent" : "text-ink"}
                >
                  {part.text}
                </span>
              ))}
            </div>

            <dl className="mt-4 space-y-1.5">
              {ID_PARTS.map((part, index) => (
                <div key={part.text} className="flex gap-3 text-xs">
                  <dt
                    className={`w-12 shrink-0 font-mono ${
                      index % 2 === 0 ? "text-accent" : "text-ink-dim"
                    }`}
                  >
                    {part.text}
                  </dt>
                  <dd className="text-ink-faint">{part.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>

      <section className="flex min-h-dvh flex-col justify-center px-6 py-12 sm:px-10 lg:min-h-0 lg:px-14">
        <div className="mx-auto w-full max-w-[26rem]">
          <div className="mb-10 lg:hidden">
            <Wordmark />
          </div>

          <h1 className="text-xl font-semibold text-ink">{title}</h1>
          <p className="mt-1.5 text-ink-dim">{lead}</p>

          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
