import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Avatar from "../../components/ui/Avatar";
import StatusDot from "../../components/ui/StatusDot";
import { Stat, Table, Td, Th } from "../../components/ui/Table";
import { ArrowLeftIcon } from "../../components/ui/icons";
import { useAuth } from "../../context/authStore";
import { formatHours, formatTime } from "../../lib/format";
import {
  formatDateKey,
  formatMonth,
  monthOf,
  shiftDateKey,
  shiftMonth,
  todayKey,
} from "../../lib/dates";
import { useFetch } from "../../lib/useFetch";

function Stepper({ onPrev, onNext, label, prevLabel, nextLabel }) {
  const button =
    "rounded-field border border-line px-2 py-1.5 text-ink-dim transition-colors duration-150 hover:border-line-strong hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50";

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onPrev} aria-label={prevLabel} className={button}>
        <ArrowLeftIcon />
      </button>
      <button type="button" onClick={onNext} aria-label={nextLabel} className={button}>
        <ArrowLeftIcon className="size-4 rotate-180" />
      </button>
      <span className="ml-1 font-medium text-ink">{label}</span>
    </div>
  );
}

function AdminDayView({ date, onDate }) {
  const { data, error, loading } = useFetch(`/attendance?date=${date}`);
  const [query, setQuery] = useState("");

  const records = (data?.records || []).filter((row) =>
    row.employee.fullName.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Stepper
          label={formatDateKey(date)}
          prevLabel="Previous day"
          nextLabel="Next day"
          onPrev={() => onDate(shiftDateKey(date, -1))}
          onNext={() => onDate(shiftDateKey(date, 1))}
        />

        <div className="flex items-center gap-3">
          <label htmlFor="att-search" className="sr-only">
            Search employees
          </label>
          <input
            id="att-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search employees…"
            spellCheck={false}
            className="w-52 rounded-field border border-line bg-surface px-3 py-2 text-ink placeholder:text-ink-faint transition-colors duration-150 hover:border-line-strong focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/35"
          />
          <button
            type="button"
            onClick={() => onDate(todayKey())}
            className="rounded-field border border-line px-3 py-2 text-ink-dim transition-colors duration-150 hover:border-line-strong hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            Today
          </button>
        </div>
      </div>

      {data?.holiday && (
        <p className="mt-4 rounded-field border border-steel/40 bg-steel/10 px-3 py-2 text-xs text-steel">
          Company holiday: {data.holiday}
        </p>
      )}

      {data && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Present" value={data.summary.present} tone="text-jade" />
          <Stat label="On Leave" value={data.summary.onLeave} tone="text-steel" />
          <Stat label="Half Day" value={data.summary.halfDay} tone="text-accent" />
          <Stat label="Absent" value={data.summary.absent} tone="text-clay" />
        </div>
      )}

      <div aria-live="polite" className="mt-5">
        {error && (
          <p className="rounded-field border border-clay/40 bg-clay/10 px-3 py-2 text-xs text-clay">
            {error}
          </p>
        )}

        {loading ? (
          <div className="h-64 animate-pulse rounded-panel border border-line bg-surface" />
        ) : (
          <Table minWidth="46rem">
            <thead>
              <tr>
                <Th>Emp</Th>
                <Th>Check In</Th>
                <Th>Check Out</Th>
                <Th right>Work Hours</Th>
                <Th right>Extra Hours</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {records.map((row) => (
                <tr key={row.employee._id} className="hover:bg-surface">
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <Avatar
                        employee={{
                          avatarUrl: row.employee.avatarUrl,
                          firstName: row.employee.fullName.split(" ")[0],
                          lastName: row.employee.fullName.split(" ")[1] || "",
                        }}
                        size="sm"
                      />
                      <span className="min-w-0">
                        <span className="block truncate">{row.employee.fullName}</span>
                        <span className="block truncate font-mono text-xs text-ink-faint tnum">
                          {row.employee.loginId}
                        </span>
                      </span>
                    </span>
                  </Td>
                  <Td mono muted={!row.checkIn}>
                    {formatTime(row.checkIn)}
                  </Td>
                  <Td mono muted={!row.checkOut}>
                    {formatTime(row.checkOut)}
                  </Td>
                  <Td right mono muted={!row.workHours}>
                    {formatHours(row.workHours)}
                  </Td>
                  <Td right mono muted={!row.extraHours}>
                    {formatHours(row.extraHours)}
                  </Td>
                  <Td>
                    <span className="flex items-center gap-2">
                      <StatusDot status={row.status} />
                      <span className="text-xs capitalize text-ink-dim">
                        {row.leaveType || row.status}
                      </span>
                    </span>
                  </Td>
                </tr>
              ))}

              {records.length === 0 && (
                <tr>
                  <Td muted className="text-center" colSpan={6}>
                    No attendance records for this day.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </div>
    </>
  );
}

function MyMonthView({ month, onMonth }) {
  const { data, error, loading } = useFetch(`/attendance/me?month=${month}`);

  const rows = (data?.days || []).filter(
    (day) => day.status !== "weekend" && day.status !== "upcoming"
  );

  return (
    <>
      <Stepper
        label={formatMonth(month)}
        prevLabel="Previous month"
        nextLabel="Next month"
        onPrev={() => onMonth(shiftMonth(month, -1))}
        onNext={() => onMonth(shiftMonth(month, 1))}
      />

      {data && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Days Present" value={data.summary.daysPresent} tone="text-jade" />
          <Stat label="Leaves Count" value={data.summary.leavesCount} tone="text-steel" />
          <Stat label="Total Working Days" value={data.summary.totalWorkingDays} />
          <Stat
            label="Extra Hours"
            value={formatHours(data.summary.totalExtraHours)}
            tone="text-accent"
          />
        </div>
      )}

      <div aria-live="polite" className="mt-5">
        {error && (
          <p className="rounded-field border border-clay/40 bg-clay/10 px-3 py-2 text-xs text-clay">
            {error}
          </p>
        )}

        {loading ? (
          <div className="h-64 animate-pulse rounded-panel border border-line bg-surface" />
        ) : (
          <Table minWidth="42rem">
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Check In</Th>
                <Th>Check Out</Th>
                <Th right>Work Hours</Th>
                <Th right>Extra Hours</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((day) => (
                <tr key={day.dateKey} className="hover:bg-surface">
                  <Td mono>{formatDateKey(day.dateKey, { month: "short" })}</Td>
                  <Td mono muted={!day.checkIn}>
                    {formatTime(day.checkIn)}
                  </Td>
                  <Td mono muted={!day.checkOut}>
                    {formatTime(day.checkOut)}
                  </Td>
                  <Td right mono muted={!day.workHours}>
                    {formatHours(day.workHours)}
                  </Td>
                  <Td right mono muted={!day.extraHours}>
                    {formatHours(day.extraHours)}
                  </Td>
                  <Td>
                    <span className="text-xs capitalize text-ink-dim">
                      {day.holiday || day.leaveType || day.status}
                    </span>
                  </Td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <Td muted className="text-center" colSpan={6}>
                    Nothing recorded this month yet.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </div>
    </>
  );
}

export default function AttendancePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isAdmin = user?.role === "admin";
  const date = searchParams.get("date") || todayKey();
  const month = searchParams.get("month") || monthOf(todayKey());

  function setParam(key, value) {
    setSearchParams({ [key]: value }, { replace: true });
  }

  return (
    <>
      <h1 className="mb-5 text-lg font-semibold text-ink">Attendance</h1>

      {isAdmin ? (
        <AdminDayView key={date} date={date} onDate={(value) => setParam("date", value)} />
      ) : (
        <MyMonthView key={month} month={month} onMonth={(value) => setParam("month", value)} />
      )}
    </>
  );
}

