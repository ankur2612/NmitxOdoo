import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Avatar from "../../components/ui/Avatar";
import StatusDot from "../../components/ui/StatusDot";
import EmptyState from "../../components/ui/EmptyState";
import NewEmployeeModal from "./NewEmployeeModal";
import { PlusIcon, SearchIcon, UsersIcon } from "../../components/ui/icons";
import { useAuth } from "../../context/authStore";
import api, { readError } from "../../lib/api";

function EmployeeCard({ employee }) {
  return (
    <Link
      to={`/employees/${employee._id}`}
      className="group flex items-start gap-3 rounded-panel border border-line bg-surface p-4 transition-colors duration-150 hover:border-line-strong hover:bg-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
    >
      <Avatar employee={employee} size="md" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{employee.fullName}</p>
        <p className="truncate text-xs text-ink-dim">
          {employee.jobPosition || "No job position set"}
        </p>
        <p className="mt-1.5 truncate font-mono text-xs text-ink-faint tnum">
          {employee.loginId}
        </p>
      </div>

      <StatusDot status={employee.todayStatus} />
    </Link>
  );
}

export default function EmployeesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(
    async (signal) => {
      setLoading(true);

      try {
        const { data } = await api.get("/employees", {
          params: query ? { q: query } : undefined,
          signal,
        });

        setEmployees(data.employees);
        setError("");
      } catch (err) {
        if (err.name !== "CanceledError") {
          setError(readError(err));
        }
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => load(controller.signal), query ? 250 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load, query]);

  function handleSearch(event) {
    const next = event.target.value;

    setSearchParams(next ? { q: next } : {}, { replace: true });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-ink">Employees</h1>
          {!loading && (
            <span className="rounded-full border border-line px-2 py-0.5 text-xs text-ink-faint tnum">
              {employees.length}
            </span>
          )}
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="relative w-full max-w-xs">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-faint">
              <SearchIcon />
            </span>

            <label htmlFor="employee-search" className="sr-only">
              Search employees
            </label>

            <input
              id="employee-search"
              type="search"
              name="q"
              value={query}
              onChange={handleSearch}
              spellCheck={false}
              autoComplete="off"
              placeholder="Search by name, ID, or role…"
              className="w-full rounded-field border border-line bg-surface py-2 pl-9 pr-3 text-ink placeholder:text-ink-faint transition-colors duration-150 hover:border-line-strong focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/35"
            />
          </div>

          {user?.role === "admin" && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-field bg-accent px-3 py-2 font-medium text-accent-ink transition-colors duration-150 hover:bg-accent-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              <PlusIcon />
              New
            </button>
          )}
        </div>
      </div>

      <div aria-live="polite" className="mt-6">
        {error && (
          <p className="rounded-field border border-clay/40 bg-clay/10 px-3 py-2 text-xs text-clay">
            {error}
          </p>
        )}

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-[5.75rem] animate-pulse rounded-panel border border-line bg-surface"
              />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <EmptyState
            icon={<UsersIcon />}
            title={query ? `No one matches “${query}”` : "No employees yet"}
          >
            {query ? (
              <button
                type="button"
                onClick={() => setSearchParams({}, { replace: true })}
                className="rounded-sm text-ink underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:decoration-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                Clear the search
              </button>
            ) : (
              "Add your first teammate with the New button."
            )}
          </EmptyState>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {employees.map((employee) => (
              <li key={employee._id}>
                <EmployeeCard employee={employee} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {creating && (
        <NewEmployeeModal
          open
          onClose={() => setCreating(false)}
          onCreated={() => load()}
        />
      )}
    </>
  );
}
