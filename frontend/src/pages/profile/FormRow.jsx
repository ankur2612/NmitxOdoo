import { useId } from "react";

const LINE =
  "w-full border-b border-line bg-transparent py-1.5 text-ink transition-colors duration-150 hover:border-line-strong focus:outline-none focus-visible:border-accent";

export default function FormRow({
  label,
  value,
  onChange,
  readOnly,
  type = "text",
  options,
  rows,
  placeholder,
  mono,
  ...rest
}) {
  const id = useId();
  const shown = value === undefined || value === null || value === "" ? "" : String(value);

  return (
    <div className="grid grid-cols-1 items-baseline gap-1 sm:grid-cols-[9rem_1fr] sm:gap-3">
      <label htmlFor={id} className="text-xs text-ink-dim">
        {label}
      </label>

      {readOnly ? (
        <p
          id={id}
          className={`min-w-0 break-words border-b border-line py-1.5 ${
            shown ? "text-ink" : "text-ink-faint"
          } ${mono ? "font-mono tnum" : ""}`}
        >
          {shown || "—"}
        </p>
      ) : options ? (
        <select
          id={id}
          value={shown}
          onChange={(event) => onChange(event.target.value)}
          className={LINE}
          {...rest}
        >
          <option value="">Not set</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : rows ? (
        <textarea
          id={id}
          rows={rows}
          value={shown}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${LINE} resize-y`}
          {...rest}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={shown}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${LINE} ${mono ? "font-mono tnum" : ""}`}
          {...rest}
        />
      )}
    </div>
  );
}
