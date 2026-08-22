import FormRow from "../FormRow";
import { toDateInput } from "../../../lib/format";

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const MARITAL = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];

export default function PrivateInfoTab({ draft, set, readOnly, canEditAdminFields }) {
  const info = draft.privateInfo || {};
  const bank = info.bank || {};

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="space-y-4 rounded-panel border border-line bg-surface p-5">
        <h3 className="font-medium text-ink">Personal</h3>

        <FormRow
          label="Date of Birth"
          type="date"
          readOnly={readOnly}
          value={readOnly ? toDateInput(info.dob) : toDateInput(info.dob)}
          onChange={(value) => set("privateInfo.dob", value)}
        />
        <FormRow
          label="Residing Address"
          rows={2}
          readOnly={readOnly}
          value={info.address}
          onChange={(value) => set("privateInfo.address", value)}
        />
        <FormRow
          label="Nationality"
          readOnly={readOnly}
          value={info.nationality}
          onChange={(value) => set("privateInfo.nationality", value)}
        />
        <FormRow
          label="Personal Email"
          type="email"
          spellCheck={false}
          readOnly={readOnly}
          value={info.personalEmail}
          onChange={(value) => set("privateInfo.personalEmail", value)}
        />
        <FormRow
          label="Gender"
          options={GENDERS}
          readOnly={readOnly}
          value={
            readOnly
              ? GENDERS.find((entry) => entry.value === info.gender)?.label
              : info.gender
          }
          onChange={(value) => set("privateInfo.gender", value)}
        />
        <FormRow
          label="Marital Status"
          options={MARITAL}
          readOnly={readOnly}
          value={
            readOnly
              ? MARITAL.find((entry) => entry.value === info.maritalStatus)?.label
              : info.maritalStatus
          }
          onChange={(value) => set("privateInfo.maritalStatus", value)}
        />
        <FormRow
          label="Date of Joining"
          type="date"
          readOnly={readOnly || !canEditAdminFields}
          value={toDateInput(info.dateOfJoining)}
          onChange={(value) => set("privateInfo.dateOfJoining", value)}
        />
      </section>

      <section className="space-y-4 rounded-panel border border-line bg-surface p-5">
        <h3 className="font-medium text-ink">Bank Details</h3>

        <FormRow
          label="Account Number"
          mono
          spellCheck={false}
          readOnly={readOnly}
          value={bank.accountNumber}
          onChange={(value) => set("privateInfo.bank.accountNumber", value)}
        />
        <FormRow
          label="Bank Name"
          readOnly={readOnly}
          value={bank.bankName}
          onChange={(value) => set("privateInfo.bank.bankName", value)}
        />
        <FormRow
          label="IFSC Code"
          mono
          spellCheck={false}
          readOnly={readOnly}
          value={bank.ifsc}
          onChange={(value) => set("privateInfo.bank.ifsc", value)}
        />
        <FormRow
          label="PAN No"
          mono
          spellCheck={false}
          readOnly={readOnly}
          value={info.panNo}
          onChange={(value) => set("privateInfo.panNo", value)}
        />
        <FormRow
          label="UAN No"
          mono
          spellCheck={false}
          readOnly={readOnly}
          value={info.uanNo}
          onChange={(value) => set("privateInfo.uanNo", value)}
        />
        <FormRow
          label="Emp Code"
          mono
          spellCheck={false}
          readOnly={readOnly || !canEditAdminFields}
          value={info.empCode}
          onChange={(value) => set("privateInfo.empCode", value)}
        />
      </section>
    </div>
  );
}
