import { PlaneIcon } from "./icons";

const LABELS = {
  present: "Present in the office",
  leave: "On approved time off",
  absent: "Absent",
  "half-day": "Half day",
};

export default function StatusDot({ status }) {
  if (status === "leave") {
    return (
      <span className="text-steel" title={LABELS.leave}>
        <PlaneIcon />
        <span className="sr-only">{LABELS.leave}</span>
      </span>
    );
  }

  const tone =
    status === "present" ? "bg-jade" : status === "half-day" ? "bg-accent" : "bg-clay";

  return (
    <span title={LABELS[status] || status}>
      <span aria-hidden="true" className={`block size-2 rounded-full ${tone}`} />
      <span className="sr-only">{LABELS[status] || status}</span>
    </span>
  );
}
