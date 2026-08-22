export function Table({ children, minWidth = "40rem" }) {
  return (
    <div className="overflow-x-auto rounded-panel border border-line">
      <table
        className="w-full border-collapse text-left"
        style={{ minWidth }}
      >
        {children}
      </table>
    </div>
  );
}

export function Th({ children, right }) {
  return (
    <th
      scope="col"
      className={`border-b border-line bg-surface px-4 py-2.5 text-xs font-medium text-ink-dim ${
        right ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

export function Td({ children, right, mono, muted, className = "" }) {
  return (
    <td
      className={`border-b border-line px-4 py-3 last:border-b-0 ${right ? "text-right" : ""} ${
        mono ? "font-mono tnum" : ""
      } ${muted ? "text-ink-faint" : "text-ink"} ${className}`}
    >
      {children}
    </td>
  );
}

export function Stat({ label, value, tone = "text-ink" }) {
  return (
    <div className="rounded-panel border border-line bg-surface px-4 py-3">
      <p className="text-xs text-ink-dim">{label}</p>
      <p className={`mt-1 font-mono text-xl tnum ${tone}`}>{value}</p>
    </div>
  );
}
