import { useEffect, useState } from "react";
import api from "../../lib/api";
import { formatTime } from "../../lib/format";

export default function CheckInWidget() {
  const [state, setState] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;

    api
      .get("/attendance/today")
      .then(({ data }) => {
        if (active) {
          setState(data);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  async function toggle() {
    setPending(true);

    try {
      const path = state?.checkedIn ? "/attendance/check-out" : "/attendance/check-in";
      await api.post(path);

      const { data } = await api.get("/attendance/today");
      setState(data);
    } catch {
      const { data } = await api.get("/attendance/today");
      setState(data);
    } finally {
      setPending(false);
    }
  }

  const checkedIn = Boolean(state?.checkedIn);
  const doneForDay = Boolean(state?.attendance?.checkOut);

  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${checkedIn ? "bg-jade" : "bg-clay"}`}
      />

      {checkedIn && (
        <span className="hidden text-xs text-ink-faint tnum sm:inline">
          Since {formatTime(state.since)}
        </span>
      )}

      <button
        type="button"
        onClick={toggle}
        disabled={pending || doneForDay || !state}
        className="rounded-field border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors duration-150 hover:border-line-strong hover:bg-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:text-ink-faint disabled:hover:bg-transparent"
      >
        {pending
          ? "Saving…"
          : doneForDay
            ? "Checked Out"
            : checkedIn
              ? "Check Out"
              : "Check In"}
      </button>

      <p aria-live="polite" className="sr-only">
        {checkedIn ? `Checked in since ${formatTime(state.since)}` : "Not checked in"}
      </p>
    </div>
  );
}
