import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Avatar from "../../components/ui/Avatar";
import { CameraIcon } from "../../components/ui/icons";
import ResumeTab from "./tabs/ResumeTab";
import PrivateInfoTab from "./tabs/PrivateInfoTab";
import SalaryTab from "./tabs/SalaryTab";
import SecurityTab from "./tabs/SecurityTab";
import FormRow from "./FormRow";
import { useAuth } from "../../context/authStore";
import api, { readError } from "../../lib/api";
import { diffPaths, setPath } from "../../lib/paths";
import { fullName } from "../../lib/format";

const SELF_PATHS = [
  "mobile",
  "resume.about",
  "resume.loveAboutJob",
  "resume.interests",
  "resume.skills",
  "resume.certifications",
  "privateInfo.dob",
  "privateInfo.address",
  "privateInfo.nationality",
  "privateInfo.personalEmail",
  "privateInfo.gender",
  "privateInfo.maritalStatus",
  "privateInfo.bank.accountNumber",
  "privateInfo.bank.bankName",
  "privateInfo.bank.ifsc",
  "privateInfo.panNo",
  "privateInfo.uanNo",
];

const ADMIN_PATHS = [
  ...SELF_PATHS,
  "firstName",
  "lastName",
  "workEmail",
  "jobPosition",
  "location",
  "privateInfo.dateOfJoining",
  "privateInfo.empCode",
];

export default function ProfileView({ employee, isSelf, onSaved }) {
  const { user, refreshUser } = useAuth();
  const isAdmin = user?.role === "admin";

  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState(employee);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const canEdit = isSelf || isAdmin;
  const editablePaths = isAdmin ? ADMIN_PATHS : SELF_PATHS;
  const readOnly = !editing;

  const tabs = useMemo(() => {
    const list = [
      { key: "resume", label: "Resume" },
      { key: "private", label: "Private Info" },
    ];

    if (isAdmin) {
      list.push({ key: "salary", label: "Salary Info" });
    }

    if (isSelf) {
      list.push({ key: "security", label: "Security" });
    }

    return list;
  }, [isAdmin, isSelf]);

  const active = tabs.some((tab) => tab.key === searchParams.get("tab"))
    ? searchParams.get("tab")
    : tabs[0].key;

  const { count: dirtyCount } = diffPaths(employee, draft, editablePaths);

  function set(path, value) {
    setDraft((current) => setPath(current, path, value));
  }

  function selectTab(key) {
    const next = new URLSearchParams(searchParams);
    next.set("tab", key);
    setSearchParams(next, { replace: true });
  }

  function cancel() {
    setDraft(employee);
    setEditing(false);
    setError("");
  }

  async function save() {
    const { changes, count } = diffPaths(employee, draft, editablePaths);

    if (count === 0) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { data } = await api.patch(`/employees/${employee._id}`, changes);

      setDraft(data.employee);
      setEditing(false);
      onSaved?.(data.employee);
    } catch (err) {
      setError(readError(err));
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const body = new FormData();
    body.append("avatar", file);

    try {
      const { data } = await api.post(`/employees/${employee._id}/avatar`, body);
      setDraft(data.employee);
      onSaved?.(data.employee);
    } catch (err) {
      setError(readError(err));
    } finally {
      event.target.value = "";
    }
  }

  return (
    <>
      <header className="rounded-panel border border-line bg-surface p-5">
        <div className="flex flex-wrap items-start gap-5">
          <div className="relative">
            <Avatar employee={draft} size="lg" />

            {canEdit && (
              <>
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 cursor-pointer rounded-full border border-line bg-raised p-1.5 text-ink-dim transition-colors duration-150 hover:text-ink focus-within:ring-2 focus-within:ring-accent/50"
                  title="Change profile picture"
                >
                  <CameraIcon />
                  <span className="sr-only">Change profile picture</span>
                </label>
                <input
                  id="avatar-upload"
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={uploadAvatar}
                  className="sr-only"
                />
              </>
            )}
          </div>

          <div className="min-w-[15rem] flex-1">
            <h1 className="font-display text-3xl leading-tight text-ink">
              {fullName(draft) || "Unnamed"}
            </h1>
            <p className="mt-0.5 text-ink-dim">{draft.jobPosition || "No job position set"}</p>

            <dl className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {[
                ["Login ID", draft.loginId, true],
                ["Company", employee.company?.name || user?.company?.name],
                ["Email", draft.workEmail],
                ["Department", employee.department?.name],
                ["Mobile", draft.mobile],
                [
                  "Manager",
                  employee.manager
                    ? `${employee.manager.firstName} ${employee.manager.lastName || ""}`.trim()
                    : null,
                ],
                ["Location", draft.location],
              ].map(([label, value, mono]) => (
                <div key={label} className="flex min-w-0 gap-3 text-xs">
                  <dt className="w-20 shrink-0 text-ink-faint">{label}</dt>
                  <dd
                    className={`min-w-0 break-words ${value ? "text-ink" : "text-ink-faint"} ${
                      mono ? "font-mono tnum" : ""
                    }`}
                  >
                    {value || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {canEdit && active !== "salary" && active !== "security" && (
            <div className="flex w-full shrink-0 gap-2 sm:w-auto">
              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={cancel}
                    className="rounded-field border border-line px-3 py-2 text-ink-dim transition-colors duration-150 hover:border-line-strong hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="rounded-field bg-accent px-3 py-2 font-medium text-accent-ink transition-colors duration-150 hover:bg-accent-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-60"
                  >
                    {saving ? "Saving…" : dirtyCount ? `Save ${dirtyCount} Change${dirtyCount > 1 ? "s" : ""}` : "Save"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-field border border-line px-3 py-2 text-ink-dim transition-colors duration-150 hover:border-line-strong hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  Edit Profile
                </button>
              )}
            </div>
          )}
        </div>

        {editing && isAdmin && (
          <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <FormRow
              label="First Name"
              value={draft.firstName}
              onChange={(value) => set("firstName", value)}
            />
            <FormRow
              label="Last Name"
              value={draft.lastName}
              onChange={(value) => set("lastName", value)}
            />
            <FormRow
              label="Job Position"
              value={draft.jobPosition}
              onChange={(value) => set("jobPosition", value)}
            />
            <FormRow
              label="Location"
              value={draft.location}
              onChange={(value) => set("location", value)}
            />
            <FormRow
              label="Work Email"
              type="email"
              spellCheck={false}
              value={draft.workEmail}
              onChange={(value) => set("workEmail", value)}
            />
            <FormRow
              label="Mobile"
              type="tel"
              value={draft.mobile}
              onChange={(value) => set("mobile", value)}
            />
          </div>
        )}

        {editing && !isAdmin && (
          <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <FormRow
              label="Mobile"
              type="tel"
              value={draft.mobile}
              onChange={(value) => set("mobile", value)}
            />
          </div>
        )}

        <div aria-live="polite">
          {error && (
            <p className="mt-4 rounded-field border border-clay/40 bg-clay/10 px-3 py-2 text-xs text-clay">
              {error}
            </p>
          )}
        </div>
      </header>

      <div className="mt-6 flex gap-6 border-b border-line" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => selectTab(tab.key)}
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

      <div className="mt-6">
        {active === "resume" && <ResumeTab draft={draft} set={set} readOnly={readOnly} />}
        {active === "private" && (
          <PrivateInfoTab
            draft={draft}
            set={set}
            readOnly={readOnly}
            canEditAdminFields={isAdmin}
          />
        )}
        {active === "salary" && <SalaryTab employeeId={employee._id} canEdit={isAdmin} />}
        {active === "security" && <SecurityTab onChanged={refreshUser} />}
      </div>
    </>
  );
}
