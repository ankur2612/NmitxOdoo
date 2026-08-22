import { useEffect, useState } from "react";
import api, { readError } from "../../../lib/api";
import { money } from "../../../lib/format";

const DESCRIPTIONS = {
  "Basic Salary": "Defined from company cost and computed on the monthly wage.",
  "House Rent Allowance": "HRA provided to employees, 50% of the basic salary.",
  "Standard Allowance":
    "A predetermined, fixed amount provided to the employee as part of their salary.",
  "Performance Bonus":
    "Variable amount paid during payroll, calculated as a percentage of the basic salary.",
  "Leave Travel Allowance":
    "Paid by the company to cover travel expenses, calculated as a percentage of the basic salary.",
  "Fixed Allowance":
    "The portion of the wage left after every other salary component is calculated.",
};

// The mockup shows Basic as a share of the monthly wage and every other
// component as a share of Basic, which is how the values were defined.
function shareOf(component, wage, basic) {
  const basis = component.computationType === "percentOfWage" ? wage : basic;

  if (!basis) {
    return "—";
  }

  return `${((component.amount / basis) * 100).toFixed(2)}%`;
}

function Row({ label, value, muted }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2 last:border-b-0">
      <span className={muted ? "text-xs text-ink-faint" : "text-ink-dim"}>{label}</span>
      <span className="font-mono text-ink tnum">{value}</span>
    </div>
  );
}

export default function SalaryTab({ employeeId, canEdit }) {
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wage, setWage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api
      .get(`/employees/${employeeId}/salary`)
      .then(({ data }) => {
        if (active) {
          setSalary(data.salary);
          setWage(data.salary ? String(data.salary.monthlyWage) : "");
        }
      })
      .catch((err) => active && setError(readError(err)))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [employeeId]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const { data } = await api.put(`/employees/${employeeId}/salary`, {
        monthlyWage: Number(wage),
      });

      setSalary(data.salary);
      setWage(String(data.salary.monthlyWage));
    } catch (err) {
      setError(readError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="h-52 animate-pulse rounded-panel border border-line bg-surface" />;
  }

  const basic =
    salary?.components?.find((component) => component.name === "Basic Salary")?.amount || 0;

  return (
    <div className="space-y-5">
      <section className="rounded-panel border border-line bg-surface p-5">
        <form onSubmit={save} className="flex flex-wrap items-end gap-5">
          <div>
            <label htmlFor="wage" className="mb-1.5 block text-xs text-ink-dim">
              Month Wage
            </label>
            <div className="flex items-baseline gap-2">
              <input
                id="wage"
                type="number"
                min="0"
                step="1"
                value={wage}
                readOnly={!canEdit}
                onChange={(event) => setWage(event.target.value)}
                className="w-40 border-b border-line bg-transparent py-1.5 font-mono text-lg text-ink tnum transition-colors duration-150 hover:border-line-strong focus:outline-none focus-visible:border-accent read-only:hover:border-line"
              />
              <span className="text-xs text-ink-faint">₹ / month</span>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs text-ink-dim">Yearly Wage</p>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-lg text-ink tnum">
                {salary ? salary.yearlyWage.toLocaleString("en-IN") : "—"}
              </span>
              <span className="text-xs text-ink-faint">₹ / year</span>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs text-ink-dim">Working Days / Week</p>
            <span className="font-mono text-lg text-ink tnum">
              {salary?.workingDaysPerWeek ?? "—"}
            </span>
          </div>

          <div>
            <p className="mb-1.5 text-xs text-ink-dim">Break Time</p>
            <span className="font-mono text-lg text-ink tnum">
              {salary?.breakHours ?? "—"}
              <span className="ml-1 text-xs text-ink-faint">hrs</span>
            </span>
          </div>

          {canEdit && (
            <button
              type="submit"
              disabled={saving || !wage}
              className="ml-auto rounded-field bg-accent px-4 py-2 font-medium text-accent-ink transition-colors duration-150 hover:bg-accent-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-60"
            >
              {saving ? "Recomputing…" : salary ? "Update Salary" : "Set Salary"}
            </button>
          )}
        </form>

        <div aria-live="polite">
          {error && (
            <p className="mt-4 rounded-field border border-clay/40 bg-clay/10 px-3 py-2 text-xs text-clay">
              {error}
            </p>
          )}
        </div>
      </section>

      {!salary ? (
        <p className="rounded-panel border border-dashed border-line px-5 py-10 text-center text-ink-faint">
          No salary structure yet.{" "}
          {canEdit ? "Enter a monthly wage above to generate one." : ""}
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-panel border border-line bg-surface p-5">
            <h3 className="font-medium text-ink">Salary Components</h3>

            <ul className="mt-3">
              {salary.components.map((component) => (
                <li key={component.name} className="border-b border-line py-3 last:border-b-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-ink">{component.name}</span>
                    <span className="flex shrink-0 items-baseline gap-4">
                      <span className="font-mono text-ink tnum">
                        {component.amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      <span className="w-16 text-right font-mono text-xs text-ink-faint tnum">
                        {shareOf(component, salary.monthlyWage, basic)}
                      </span>
                    </span>
                  </div>
                  {DESCRIPTIONS[component.name] && (
                    <p className="mt-1 max-w-lg text-xs text-ink-faint">
                      {DESCRIPTIONS[component.name]}
                    </p>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-baseline justify-between border-t border-line-strong pt-3">
              <span className="font-medium text-ink">Gross</span>
              <span className="font-mono font-medium text-ink tnum">
                {money(salary.components.reduce((total, item) => total + item.amount, 0))}
              </span>
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-panel border border-line bg-surface p-5">
              <h3 className="font-medium text-ink">Provident Fund</h3>
              <div className="mt-2">
                <Row
                  label="Employee"
                  value={`${salary.pf.employeeAmount.toLocaleString("en-IN")}  ·  ${salary.pf.employeePercent}%`}
                />
                <Row
                  label="Employer"
                  value={`${salary.pf.employerAmount.toLocaleString("en-IN")}  ·  ${salary.pf.employerPercent}%`}
                />
              </div>
              <p className="mt-2 text-xs text-ink-faint">
                PF is calculated on the basic salary.
              </p>
            </section>

            <section className="rounded-panel border border-line bg-surface p-5">
              <h3 className="font-medium text-ink">Tax Deductions</h3>
              <div className="mt-2">
                <Row
                  label="Professional Tax"
                  value={`${salary.professionalTax.toLocaleString("en-IN")}  ·  ₹/month`}
                />
              </div>
              <p className="mt-2 text-xs text-ink-faint">
                Professional tax is deducted from the gross salary.
              </p>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
