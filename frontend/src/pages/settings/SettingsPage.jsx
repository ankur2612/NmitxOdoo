import { useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Table, Td, Th } from "../../components/ui/Table";
import { CloseIcon, PlusIcon } from "../../components/ui/icons";
import { useAuth } from "../../context/authStore";
import api, { readError } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { formatDateKey, todayKey } from "../../lib/dates";

const LINE =
  "rounded-field border border-line bg-canvas px-3 py-2 text-ink placeholder:text-ink-faint transition-colors duration-150 hover:border-line-strong focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/35";

const ADD_BUTTON =
  "flex shrink-0 items-center gap-1.5 rounded-field bg-accent px-3 py-2 font-medium text-accent-ink transition-colors duration-150 hover:bg-accent-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-60";

function useCreate(reload) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(request) {
    setBusy(true);
    setError("");

    try {
      await request();
      reload();
      return true;
    } catch (err) {
      setError(readError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, run };
}

function DepartmentsTab() {
  const { data, loading, reload } = useFetch("/departments");
  const { busy, error, run } = useCreate(reload);
  const [name, setName] = useState("");

  async function add(event) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    const ok = await run(() => api.post("/departments", { name: name.trim() }));

    if (ok) {
      setName("");
    }
  }

  return (
    <>
      <form onSubmit={add} className="mb-4 flex gap-3">
        <label htmlFor="dept-name" className="sr-only">
          Department name
        </label>
        <input
          id="dept-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Engineering"
          className={`${LINE} max-w-xs flex-1`}
        />
        <button type="submit" disabled={busy} className={ADD_BUTTON}>
          <PlusIcon />
          Add Department
        </button>
      </form>

      <div aria-live="polite">
        {error && (
          <p className="mb-4 rounded-field border border-clay/40 bg-clay/10 px-3 py-2 text-xs text-clay">
            {error}
          </p>
        )}
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-panel border border-line bg-surface" />
      ) : (
        <Table minWidth="26rem">
          <thead>
            <tr>
              <Th>Department</Th>
              <Th>Manager</Th>
            </tr>
          </thead>
          <tbody>
            {(data?.departments || []).map((department) => (
              <tr key={department._id} className="hover:bg-surface">
                <Td>{department.name}</Td>
                <Td muted={!department.manager}>
                  {department.manager
                    ? `${department.manager.firstName} ${department.manager.lastName || ""}`
                    : "—"}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}

function LeaveTypesTab() {
  const { data, loading, reload } = useFetch("/leave-types");
  const { busy, error, run } = useCreate(reload);
  const [form, setForm] = useState({ name: "", defaultDays: "", requiresAttachment: false });

  async function add(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      return;
    }

    const ok = await run(() =>
      api.post("/leave-types", {
        name: form.name.trim(),
        defaultDays: Number(form.defaultDays) || 0,
        requiresAttachment: form.requiresAttachment,
      })
    );

    if (ok) {
      setForm({ name: "", defaultDays: "", requiresAttachment: false });
    }
  }

  async function setDays(type, days) {
    await run(() => api.patch(`/leave-types/${type._id}`, { defaultDays: Number(days) }));
  }

  return (
    <>
      <form onSubmit={add} className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="lt-name" className="sr-only">
          Leave type name
        </label>
        <input
          id="lt-name"
          value={form.name}
          onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
          placeholder="Work From Home"
          className={`${LINE} w-48`}
        />

        <label htmlFor="lt-days" className="sr-only">
          Default days
        </label>
        <input
          id="lt-days"
          type="number"
          min="0"
          value={form.defaultDays}
          onChange={(event) => setForm((f) => ({ ...f, defaultDays: event.target.value }))}
          placeholder="Days"
          className={`${LINE} w-24 text-right font-mono tnum`}
        />

        <label className="flex items-center gap-2 text-ink-dim">
          <input
            type="checkbox"
            checked={form.requiresAttachment}
            onChange={(event) =>
              setForm((f) => ({ ...f, requiresAttachment: event.target.checked }))
            }
            className="size-4 accent-[var(--color-accent)]"
          />
          Needs a document
        </label>

        <button type="submit" disabled={busy} className={ADD_BUTTON}>
          <PlusIcon />
          Add Type
        </button>
      </form>

      <div aria-live="polite">
        {error && (
          <p className="mb-4 rounded-field border border-clay/40 bg-clay/10 px-3 py-2 text-xs text-clay">
            {error}
          </p>
        )}
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-panel border border-line bg-surface" />
      ) : (
        <Table minWidth="34rem">
          <thead>
            <tr>
              <Th>Type</Th>
              <Th right>Default Days</Th>
              <Th>Paid</Th>
              <Th>Document</Th>
            </tr>
          </thead>
          <tbody>
            {(data?.leaveTypes || []).map((type) => (
              <tr key={type._id} className="hover:bg-surface">
                <Td>
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-2 rounded-full"
                      style={{ backgroundColor: type.color }}
                    />
                    {type.name}
                  </span>
                </Td>
                <Td right>
                  <label className="sr-only" htmlFor={`days-${type._id}`}>
                    Default days for {type.name}
                  </label>
                  <input
                    id={`days-${type._id}`}
                    type="number"
                    min="0"
                    defaultValue={type.defaultDays}
                    onBlur={(event) => {
                      if (Number(event.target.value) !== type.defaultDays) {
                        setDays(type, event.target.value);
                      }
                    }}
                    className="w-20 rounded-field border border-line bg-canvas px-2 py-1 text-right font-mono text-ink tnum transition-colors duration-150 hover:border-line-strong focus:outline-none focus-visible:border-accent"
                  />
                </Td>
                <Td muted={!type.isPaid}>{type.isPaid ? "Paid" : "Unpaid"}</Td>
                <Td muted={!type.requiresAttachment}>
                  {type.requiresAttachment ? "Required" : "—"}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}

function HolidaysTab() {
  const year = Number(todayKey().slice(0, 4));
  const { data, loading, reload } = useFetch(`/holidays?year=${year}`);
  const { busy, error, run } = useCreate(reload);
  const [form, setForm] = useState({ name: "", date: todayKey() });

  async function add(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      return;
    }

    const ok = await run(() =>
      api.post("/holidays", { name: form.name.trim(), date: form.date })
    );

    if (ok) {
      setForm({ name: "", date: todayKey() });
    }
  }

  async function remove(holiday) {
    if (!window.confirm(`Remove “${holiday.name}” from the holiday calendar?`)) {
      return;
    }

    await run(() => api.delete(`/holidays/${holiday._id}`));
  }

  return (
    <>
      <form onSubmit={add} className="mb-4 flex flex-wrap gap-3">
        <label htmlFor="hol-name" className="sr-only">
          Holiday name
        </label>
        <input
          id="hol-name"
          value={form.name}
          onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
          placeholder="Company Offsite"
          className={`${LINE} w-56`}
        />

        <label htmlFor="hol-date" className="sr-only">
          Holiday date
        </label>
        <input
          id="hol-date"
          type="date"
          value={form.date}
          onChange={(event) => setForm((f) => ({ ...f, date: event.target.value }))}
          className={LINE}
        />

        <button type="submit" disabled={busy} className={ADD_BUTTON}>
          <PlusIcon />
          Add Holiday
        </button>
      </form>

      <div aria-live="polite">
        {error && (
          <p className="mb-4 rounded-field border border-clay/40 bg-clay/10 px-3 py-2 text-xs text-clay">
            {error}
          </p>
        )}
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-panel border border-line bg-surface" />
      ) : (
        <Table minWidth="30rem">
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Holiday</Th>
              <Th right>Remove</Th>
            </tr>
          </thead>
          <tbody>
            {(data?.holidays || []).map((holiday) => (
              <tr key={holiday._id} className="hover:bg-surface">
                <Td mono>{formatDateKey(holiday.date, { month: "short" })}</Td>
                <Td>{holiday.name}</Td>
                <Td right>
                  <button
                    type="button"
                    onClick={() => remove(holiday)}
                    aria-label={`Remove ${holiday.name}`}
                    className="rounded-field border border-line p-1.5 text-ink-faint transition-colors duration-150 hover:border-clay/40 hover:text-clay focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                  >
                    <CloseIcon className="size-3.5" />
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}

const TABS = [
  { key: "departments", label: "Departments", render: () => <DepartmentsTab /> },
  { key: "leave-types", label: "Time Off Types", render: () => <LeaveTypesTab /> },
  { key: "holidays", label: "Public Holidays", render: () => <HolidaysTab /> },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  if (user && user.role !== "admin") {
    return <Navigate to="/employees" replace />;
  }

  const active = TABS.some((tab) => tab.key === searchParams.get("tab"))
    ? searchParams.get("tab")
    : TABS[0].key;

  return (
    <>
      <h1 className="mb-5 text-lg font-semibold text-ink">Settings</h1>

      <div className="mb-5 flex gap-6 border-b border-line" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => setSearchParams({ tab: tab.key }, { replace: true })}
            className={`-mb-px border-b-2 px-1 py-2.5 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
              active === tab.key
                ? "border-accent text-ink"
                : "border-transparent text-ink-dim hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {TABS.find((tab) => tab.key === active).render()}
    </>
  );
}
