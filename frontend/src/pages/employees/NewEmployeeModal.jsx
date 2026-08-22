import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import Field from "../../components/Field";
import SubmitButton from "../../components/SubmitButton";
import { CheckIcon, CopyIcon } from "../../components/ui/icons";
import api, { readError } from "../../lib/api";

const BLANK = {
  firstName: "",
  lastName: "",
  workEmail: "",
  jobPosition: "",
  mobile: "",
  location: "",
  department: "",
  role: "employee",
  dateOfJoining: "",
};

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-b-0">
      <span className="text-xs text-ink-dim">{label}</span>

      <div className="flex items-center gap-2">
        <code className="font-mono text-ink tnum">{value}</code>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="rounded-field p-1.5 text-ink-faint transition-colors duration-150 hover:bg-surface hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          {copied ? <CheckIcon className="size-3.5 text-jade" /> : <CopyIcon />}
        </button>
      </div>
    </div>
  );
}

export default function NewEmployeeModal({ open, onClose, onCreated }) {
  const [values, setValues] = useState(BLANK);
  const [departments, setDepartments] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState(null);

  useEffect(() => {
    let active = true;

    api
      .get("/departments")
      .then(({ data }) => active && setDepartments(data.departments))
      .catch(() => active && setDepartments([]));

    return () => {
      active = false;
    };
  }, []);

  function update(key) {
    return (event) => setValues((current) => ({ ...current, [key]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!values.firstName.trim() || !values.workEmail.trim()) {
      setError("First name and work email are required.");
      return;
    }

    setPending(true);

    try {
      const payload = Object.fromEntries(
        Object.entries(values).filter(([, value]) => value !== "")
      );

      const { data } = await api.post("/employees", payload);

      setCredentials({ ...data.credentials, name: data.employee.firstName });
      onCreated();
    } catch (err) {
      setError(readError(err));
    } finally {
      setPending(false);
    }
  }

  if (credentials) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Employee Added"
        description="Share these once. The password is not recoverable later."
      >
        <div className="rounded-panel border border-accent/30 bg-accent/5 px-4 py-1">
          <CopyRow label="Login ID" value={credentials.loginId} />
          <CopyRow label="Temporary password" value={credentials.tempPassword} />
        </div>

        <p className="mt-4 text-xs text-ink-faint">
          {credentials.name} will be asked to set a new password at first sign in.
        </p>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-field bg-accent px-4 py-2 font-medium text-accent-ink transition-colors duration-150 hover:bg-accent-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            Done
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Employee"
      description="Dayflow generates their Login ID and a temporary password."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="First Name"
            name="given-name"
            autoComplete="off"
            value={values.firstName}
            onChange={update("firstName")}
            placeholder="Ravi"
          />
          <Field
            label="Last Name"
            name="family-name"
            autoComplete="off"
            value={values.lastName}
            onChange={update("lastName")}
            placeholder="Kumar"
          />
        </div>

        <Field
          label="Work Email"
          name="work-email"
          type="email"
          inputMode="email"
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="none"
          value={values.workEmail}
          onChange={update("workEmail")}
          placeholder="ravi@company.com"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Job Position"
            name="job-title"
            autoComplete="off"
            value={values.jobPosition}
            onChange={update("jobPosition")}
            placeholder="Backend Developer"
          />
          <Field
            label="Mobile"
            name="mobile"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            value={values.mobile}
            onChange={update("mobile")}
            placeholder="98765 43210"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="new-department"
              className="mb-1.5 block text-xs font-medium text-ink-dim"
            >
              Department
            </label>
            <select
              id="new-department"
              value={values.department}
              onChange={update("department")}
              className="w-full rounded-field border border-line bg-canvas px-3 py-2 text-ink transition-colors duration-150 hover:border-line-strong focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/35"
            >
              <option value="">Unassigned</option>
              {departments.map((department) => (
                <option key={department._id} value={department._id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="new-role" className="mb-1.5 block text-xs font-medium text-ink-dim">
              Role
            </label>
            <select
              id="new-role"
              value={values.role}
              onChange={update("role")}
              className="w-full rounded-field border border-line bg-canvas px-3 py-2 text-ink transition-colors duration-150 hover:border-line-strong focus:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/35"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Location"
            name="location"
            autoComplete="off"
            value={values.location}
            onChange={update("location")}
            placeholder="Bengaluru"
          />
          <Field
            label="Date of Joining"
            name="joining"
            type="date"
            value={values.dateOfJoining}
            onChange={update("dateOfJoining")}
            hint="Defaults to today."
          />
        </div>

        <div aria-live="polite">
          {error && (
            <p className="rounded-field border border-clay/40 bg-clay/10 px-3 py-2 text-xs text-clay">
              {error}
            </p>
          )}
        </div>

        <SubmitButton pending={pending} pendingLabel="Creating…">
          Create Employee
        </SubmitButton>
      </form>
    </Modal>
  );
}
