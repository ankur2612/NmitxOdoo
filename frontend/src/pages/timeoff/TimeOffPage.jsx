import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Avatar from "../../components/ui/Avatar";
import EmptyState from "../../components/ui/EmptyState";
import { Table, Td, Th } from "../../components/ui/Table";
import { CheckIcon, CloseIcon, PlusIcon } from "../../components/ui/icons";
import NewRequestModal from "./NewRequestModal";
import YearCalendar from "./YearCalendar";
import { useAuth } from "../../context/authStore";
import api, { readError } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { formatDateKey, todayKey } from "../../lib/dates";

const STATUS_TONE = {
  approved: "border-jade/40 bg-jade/10 text-jade",
  pending: "border-accent/40 bg-accent/10 text-accent",
  rejected: "border-clay/40 bg-clay/10 text-clay",
};

function StatusPill({ status }) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs capitalize ${STATUS_TONE[status]}`}
    >
      {status}
    </span>
  );
}

function BalanceStrip({ balances }) {
  if (!balances?.length) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {balances.map((balance) => (
        <div
          key={balance.leaveType._id}
          className="rounded-panel border border-line bg-surface px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: balance.leaveType.color }}
            />
            <p className="text-ink">{balance.leaveType.name}</p>
          </div>

          <p className="mt-1.5 font-mono text-xl text-ink tnum">
            {balance.remainingDays}
            <span className="ml-1.5 text-xs text-ink-faint">
              of {balance.allocatedDays} days available
            </span>
          </p>

          {balance.pendingDays > 0 && (
            <p className="mt-0.5 text-xs text-accent tnum">
              {balance.pendingDays} day(s) awaiting approval
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function AdminRequests() {
  const year = Number(todayKey().slice(0, 4));
  const { data, error, loading, reload } = useFetch(`/leaves?year=${year}`);
  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");
  const [query, setQuery] = useState("");

  async function review(id, decision) {
    setBusy(id);
    setActionError("");

    try {
      await api.patch(`/leaves/${id}/${decision}`);
      reload();
    } catch (err) {
      setActionError(readError(err));
    } finally {
      setBusy("");
    }
  }

  const leaves = (data?.leaves || []).filter((leave) =>
    `${leave.employee.firstName} ${leave.employee.lastName || ""}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  if (loading) {
    return <div className="h-64 animate-pulse rounded-panel border border-line bg-surface" />;
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <label htmlFor="leave-search" className="sr-only">
          Search requests
        </label>
        <input
          id="leave-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by employee…"
          spellCheck={false}
          className="w-56 rounded-field border border-line bg-surface px-3 py-2 text-ink placeholder:text-ink-faint transition-colors duration-150 hover:border-line-strong focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/35"
        />
      </div>

      <div aria-live="polite">
        {(error || actionError) && (
          <p className="mb-4 rounded-field border border-clay/40 bg-clay/10 px-3 py-2 text-xs text-clay">
            {error || actionError}
          </p>
        )}
      </div>

      {leaves.length === 0 ? (
        <EmptyState title="No time off requests yet">
          Requests from your team land here for approval.
        </EmptyState>
      ) : (
        <Table minWidth="52rem">
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Start Date</Th>
              <Th>End Date</Th>
              <Th>Time Off Type</Th>
              <Th right>Days</Th>
              <Th>Status</Th>
              <Th right>Action</Th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave) => (
              <tr key={leave._id} className="hover:bg-surface">
                <Td>
                  <span className="flex items-center gap-2.5">
                    <Avatar employee={leave.employee} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate">
                        {leave.employee.firstName} {leave.employee.lastName}
                      </span>
                      {leave.remarks && (
                        <span className="block truncate text-xs text-ink-faint">
                          {leave.remarks}
                        </span>
                      )}
                    </span>
                  </span>
                </Td>
                <Td mono>{formatDateKey(leave.startDate, { month: "short" })}</Td>
                <Td mono>{formatDateKey(leave.endDate, { month: "short" })}</Td>
                <Td>
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-2 rounded-full"
                      style={{ backgroundColor: leave.leaveType.color }}
                    />
                    {leave.leaveType.name}
                  </span>
                </Td>
                <Td right mono>
                  {leave.days}
                </Td>
                <Td>
                  <StatusPill status={leave.status} />
                </Td>
                <Td right>
                  <span className="flex justify-end gap-2">
                    {leave.attachmentUrl && (
                      <a
                        href={leave.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-field border border-line px-2 py-1 text-xs text-ink-dim transition-colors duration-150 hover:border-line-strong hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                      >
                        Doc
                      </a>
                    )}

                    {leave.status !== "rejected" && (
                      <button
                        type="button"
                        disabled={busy === leave._id}
                        onClick={() => review(leave._id, "reject")}
                        aria-label={`Reject request from ${leave.employee.firstName}`}
                        className="rounded-field border border-clay/40 p-1.5 text-clay transition-colors duration-150 hover:bg-clay/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50"
                      >
                        <CloseIcon className="size-3.5" />
                      </button>
                    )}

                    {leave.status !== "approved" && (
                      <button
                        type="button"
                        disabled={busy === leave._id}
                        onClick={() => review(leave._id, "approve")}
                        aria-label={`Approve request from ${leave.employee.firstName}`}
                        className="rounded-field border border-jade/40 p-1.5 text-jade transition-colors duration-150 hover:bg-jade/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50"
                      >
                        <CheckIcon />
                      </button>
                    )}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}

function AllocationTab() {
  const year = Number(todayKey().slice(0, 4));
  const { data, error, loading, reload } = useFetch(`/allocations?year=${year}`);
  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");

  async function update(allocation, days) {
    setBusy(allocation._id);
    setActionError("");

    try {
      await api.post("/allocations", {
        employee: allocation.employee._id,
        leaveType: allocation.leaveType._id,
        year,
        allocatedDays: Number(days),
      });
      reload();
    } catch (err) {
      setActionError(readError(err));
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-panel border border-line bg-surface" />;
  }

  return (
    <>
      <div aria-live="polite">
        {(error || actionError) && (
          <p className="mb-4 rounded-field border border-clay/40 bg-clay/10 px-3 py-2 text-xs text-clay">
            {error || actionError}
          </p>
        )}
      </div>

      <Table minWidth="44rem">
        <thead>
          <tr>
            <Th>Employee</Th>
            <Th>Time Off Type</Th>
            <Th right>Allocated</Th>
            <Th right>Used</Th>
            <Th right>Remaining</Th>
          </tr>
        </thead>
        <tbody>
          {(data?.allocations || []).map((allocation) => (
            <tr key={allocation._id} className="hover:bg-surface">
              <Td>
                {allocation.employee.firstName} {allocation.employee.lastName}
              </Td>
              <Td>{allocation.leaveType.name}</Td>
              <Td right>
                <label className="sr-only" htmlFor={`alloc-${allocation._id}`}>
                  Allocated days for {allocation.employee.firstName}
                </label>
                <input
                  id={`alloc-${allocation._id}`}
                  type="number"
                  min="0"
                  defaultValue={allocation.allocatedDays}
                  disabled={busy === allocation._id}
                  onBlur={(event) => {
                    if (Number(event.target.value) !== allocation.allocatedDays) {
                      update(allocation, event.target.value);
                    }
                  }}
                  className="w-20 rounded-field border border-line bg-canvas px-2 py-1 text-right font-mono text-ink tnum transition-colors duration-150 hover:border-line-strong focus:outline-none focus-visible:border-accent"
                />
              </Td>
              <Td right mono muted={!allocation.usedDays}>
                {allocation.usedDays}
              </Td>
              <Td right mono>
                {allocation.remainingDays}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

function MyTimeOff() {
  const year = Number(todayKey().slice(0, 4));
  const balances = useFetch(`/leaves/balance?year=${year}`);
  const leaves = useFetch(`/leaves/me?year=${year}`);
  const holidays = useFetch(`/holidays?year=${year}`);
  const [creating, setCreating] = useState(false);

  function refresh() {
    balances.reload();
    leaves.reload();
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-ink">Time Off</h1>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-field bg-accent px-3 py-2 font-medium text-accent-ink transition-colors duration-150 hover:bg-accent-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          <PlusIcon />
          New
        </button>
      </div>

      <BalanceStrip balances={balances.data?.balances} />

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_16rem]">
        <YearCalendar
          year={year}
          today={todayKey()}
          leaves={leaves.data?.leaves || []}
          holidays={holidays.data?.holidays || []}
        />

        <aside className="rounded-panel border border-line bg-surface p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Public Holidays
          </h2>

          <ul className="mt-3 space-y-2">
            {(holidays.data?.holidays || []).map((holiday) => (
              <li key={holiday._id} className="flex gap-3 text-xs">
                <span className="w-16 shrink-0 font-mono text-ink-dim tnum">
                  {formatDateKey(holiday.date, { day: "2-digit", month: "short", year: undefined })}
                </span>
                <span className="min-w-0 text-ink">{holiday.name}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 font-medium text-ink">My Requests</h2>

        {(leaves.data?.leaves || []).length === 0 ? (
          <EmptyState title="No requests this year">
            Use the New button to request time off.
          </EmptyState>
        ) : (
          <Table minWidth="40rem">
            <thead>
              <tr>
                <Th>Start Date</Th>
                <Th>End Date</Th>
                <Th>Time Off Type</Th>
                <Th right>Days</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {leaves.data.leaves.map((leave) => (
                <tr key={leave._id} className="hover:bg-surface">
                  <Td mono>{formatDateKey(leave.startDate, { month: "short" })}</Td>
                  <Td mono>{formatDateKey(leave.endDate, { month: "short" })}</Td>
                  <Td>{leave.leaveType.name}</Td>
                  <Td right mono>
                    {leave.days}
                  </Td>
                  <Td>
                    <StatusPill status={leave.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {creating && (
        <NewRequestModal onClose={() => setCreating(false)} onCreated={refresh} />
      )}
    </>
  );
}

export default function TimeOffPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  if (user?.role !== "admin") {
    return <MyTimeOff />;
  }

  const tab = searchParams.get("tab") === "allocation" ? "allocation" : "requests";

  return (
    <>
      <h1 className="mb-5 text-lg font-semibold text-ink">Time Off</h1>

      <div className="mb-5 flex gap-6 border-b border-line" role="tablist">
        {[
          { key: "requests", label: "Time Off" },
          { key: "allocation", label: "Allocation" },
        ].map((entry) => (
          <button
            key={entry.key}
            type="button"
            role="tab"
            aria-selected={tab === entry.key}
            onClick={() => setSearchParams({ tab: entry.key }, { replace: true })}
            className={`-mb-px border-b-2 px-1 py-2.5 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
              tab === entry.key
                ? "border-accent text-ink"
                : "border-transparent text-ink-dim hover:text-ink"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === "requests" ? <AdminRequests /> : <AllocationTab />}
    </>
  );
}
