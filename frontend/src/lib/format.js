const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const longDate = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const clockTime = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
});

export function money(value) {
  return rupees.format(Number(value) || 0);
}

export function formatDate(value) {
  return value ? longDate.format(new Date(value)) : "—";
}

export function formatTime(value) {
  return value ? clockTime.format(new Date(value)) : "—";
}

export function toDateInput(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

export function initials(firstName = "", lastName = "") {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";
}

export function fullName(employee) {
  if (!employee) {
    return "";
  }

  return [employee.firstName, employee.lastName].filter(Boolean).join(" ");
}

export function formatHours(value) {
  const minutes = Math.max(0, Math.round((Number(value) || 0) * 60));
  const hours = Math.floor(minutes / 60);

  return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
