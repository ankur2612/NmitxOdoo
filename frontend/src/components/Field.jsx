import { forwardRef, useId } from "react";

const Field = forwardRef(function Field(
  { label, error, hint, className = "", inputClassName = "", ...props },
  ref
) {
  const generatedId = useId();
  const id = props.id || generatedId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium text-ink-dim"
      >
        {label}
      </label>

      <input
        {...props}
        id={id}
        ref={ref}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy || undefined}
        className={`w-full rounded-field border bg-canvas px-3 py-2 text-ink placeholder:text-ink-faint transition-colors duration-150 hover:border-line-strong focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/35 ${
          error ? "border-clay" : "border-line"
        } ${inputClassName}`}
      />

      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-ink-faint">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-clay">
          {error}
        </p>
      )}
    </div>
  );
});

export default Field;
