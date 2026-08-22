import { initials } from "../../lib/format";

const SIZES = {
  sm: "size-8 text-xs",
  md: "size-11 text-sm",
  lg: "size-20 text-xl",
};

export default function Avatar({ employee, size = "md", className = "" }) {
  const name = [employee?.firstName, employee?.lastName].filter(Boolean).join(" ");

  if (employee?.avatarUrl) {
    return (
      <img
        src={employee.avatarUrl}
        alt={name}
        width={96}
        height={96}
        loading="lazy"
        className={`${SIZES[size]} shrink-0 rounded-full border border-line object-cover ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${SIZES[size]} grid shrink-0 place-items-center rounded-full border border-line bg-raised font-medium text-ink-dim ${className}`}
    >
      {initials(employee?.firstName, employee?.lastName)}
    </span>
  );
}
