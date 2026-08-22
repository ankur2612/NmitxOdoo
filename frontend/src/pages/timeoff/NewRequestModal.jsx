import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import SubmitButton from "../../components/SubmitButton";
import api, { readError } from "../../lib/api";
import { todayKey } from "../../lib/dates";

const LINE =
  "w-full rounded-field border border-line bg-canvas px-3 py-2 text-ink transition-colors duration-150 hover:border-line-strong focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/35";

export default function NewRequestModal({ onClose, onCreated }) {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState(todayKey());
  const [endDate, setEndDate] = useState(todayKey());
  const [halfDay, setHalfDay] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [file, setFile] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api
      .get("/leave-types")
      .then(({ data }) => {
        if (active) {
          const usable = data.leaveTypes.filter((type) => type.isActive);
          setLeaveTypes(usable);
          setLeaveType(usable[0]?._id || "");
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const selected = leaveTypes.find((type) => type._id === leaveType);
  const needsAttachment = Boolean(selected?.requiresAttachment);
  const sameDay = startDate === endDate;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (endDate < startDate) {
      setError("The end date cannot be before the start date.");
      return;
    }

    if (needsAttachment && !file) {
      setError(`${selected.name} needs a supporting document attached.`);
      return;
    }

    setPending(true);

    try {
      if (file) {
        const body = new FormData();
        body.append("leaveType", leaveType);
        body.append("startDate", startDate);
        body.append("endDate", endDate);
        body.append("remarks", remarks);

        if (halfDay && sameDay) {
          body.append("halfDay", "true");
        }

        body.append("attachment", file);
        await api.post("/leaves", body);
      } else {
        await api.post("/leaves", {
          leaveType,
          startDate,
          endDate,
          remarks,
          halfDay: halfDay && sameDay,
        });
      }

      onCreated();
      onClose();
    } catch (err) {
      setError(readError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Time Off Request"
      description="Weekends and public holidays are not counted."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="leave-type" className="mb-1.5 block text-xs font-medium text-ink-dim">
            Time Off Type
          </label>
          <select
            id="leave-type"
            value={leaveType}
            onChange={(event) => setLeaveType(event.target.value)}
            className={LINE}
          >
            {leaveTypes.map((type) => (
              <option key={type._id} value={type._id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-1.5 text-xs font-medium text-ink-dim">Validity Period</legend>

          <div>
            <label htmlFor="from" className="mb-1.5 block text-xs text-ink-faint">
              From
            </label>
            <input
              id="from"
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);

                if (endDate < event.target.value) {
                  setEndDate(event.target.value);
                }
              }}
              className={LINE}
            />
          </div>

          <div>
            <label htmlFor="to" className="mb-1.5 block text-xs text-ink-faint">
              To
            </label>
            <input
              id="to"
              type="date"
              min={startDate}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className={LINE}
            />
          </div>
        </fieldset>

        {sameDay && (
          <label className="flex items-center gap-2.5 text-ink-dim">
            <input
              type="checkbox"
              checked={halfDay}
              onChange={(event) => setHalfDay(event.target.checked)}
              className="size-4 accent-[var(--color-accent)]"
            />
            Half day only
          </label>
        )}

        <div>
          <label htmlFor="remarks" className="mb-1.5 block text-xs font-medium text-ink-dim">
            Remarks
          </label>
          <textarea
            id="remarks"
            rows={2}
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder="A short reason…"
            className={`${LINE} resize-y`}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-ink-dim">
            Attachment {needsAttachment && <span className="text-clay">· required</span>}
          </span>

          <div className="flex items-center gap-3">
            <label
              htmlFor="attachment"
              className="cursor-pointer rounded-field border border-line px-3 py-2 text-xs text-ink-dim transition-colors duration-150 hover:border-line-strong hover:text-ink focus-within:ring-2 focus-within:ring-accent/35"
            >
              Choose File
              <input
                id="attachment"
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>

            <span className="min-w-0 truncate text-xs text-ink-faint">
              {file ? file.name : needsAttachment ? "Medical certificate" : "Optional"}
            </span>
          </div>
        </div>

        <div aria-live="polite">
          {error && (
            <p className="rounded-field border border-clay/40 bg-clay/10 px-3 py-2 text-xs text-clay">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-field border border-line px-4 py-2.5 text-ink-dim transition-colors duration-150 hover:border-line-strong hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            Discard
          </button>
          <div className="flex-1">
            <SubmitButton pending={pending} pendingLabel="Submitting…">
              Submit Request
            </SubmitButton>
          </div>
        </div>
      </form>
    </Modal>
  );
}
