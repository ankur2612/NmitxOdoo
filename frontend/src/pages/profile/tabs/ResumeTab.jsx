import { useState } from "react";
import FormRow from "../FormRow";
import { CloseIcon, PlusIcon } from "../../../components/ui/icons";

function TagList({ label, items = [], onChange, readOnly, placeholder }) {
  const [draft, setDraft] = useState("");

  function add() {
    const value = draft.trim();

    if (value && !items.includes(value)) {
      onChange([...items, value]);
    }

    setDraft("");
  }

  return (
    <section className="rounded-panel border border-line bg-surface p-4">
      <h3 className="font-medium text-ink">{label}</h3>

      <ul className="mt-3 flex flex-wrap gap-2">
        {items.length === 0 && (
          <li className="text-xs text-ink-faint">Nothing added yet.</li>
        )}

        {items.map((item) => (
          <li
            key={item}
            className="flex items-center gap-1.5 rounded-full border border-line bg-raised py-1 pl-3 pr-1.5 text-xs text-ink"
          >
            {item}
            {!readOnly && (
              <button
                type="button"
                onClick={() => onChange(items.filter((entry) => entry !== item))}
                aria-label={`Remove ${item}`}
                className="rounded-full p-0.5 text-ink-faint transition-colors duration-150 hover:text-clay focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                <CloseIcon className="size-3" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {!readOnly && (
        <div className="mt-3 flex gap-2">
          <label htmlFor={`add-${label}`} className="sr-only">
            {`Add to ${label}`}
          </label>
          <input
            id={`add-${label}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                add();
              }
            }}
            placeholder={placeholder}
            className="min-w-0 flex-1 border-b border-line bg-transparent py-1.5 text-ink placeholder:text-ink-faint transition-colors duration-150 hover:border-line-strong focus:outline-none focus-visible:border-accent"
          />
          <button
            type="button"
            onClick={add}
            className="flex items-center gap-1 rounded-field border border-line px-2.5 py-1 text-xs text-ink-dim transition-colors duration-150 hover:border-line-strong hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <PlusIcon className="size-3" />
            Add
          </button>
        </div>
      )}
    </section>
  );
}

export default function ResumeTab({ draft, set, readOnly }) {
  const resume = draft.resume || {};

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-5 rounded-panel border border-line bg-surface p-5">
        <FormRow
          label="About"
          rows={3}
          readOnly={readOnly}
          value={resume.about}
          onChange={(value) => set("resume.about", value)}
          placeholder="A short introduction…"
        />
        <FormRow
          label="What I Love About My Job"
          rows={3}
          readOnly={readOnly}
          value={resume.loveAboutJob}
          onChange={(value) => set("resume.loveAboutJob", value)}
          placeholder="The parts you enjoy most…"
        />
        <FormRow
          label="Interests and Hobbies"
          rows={3}
          readOnly={readOnly}
          value={resume.interests}
          onChange={(value) => set("resume.interests", value)}
          placeholder="Outside of work…"
        />
      </div>

      <div className="space-y-5">
        <TagList
          label="Skills"
          items={resume.skills}
          readOnly={readOnly}
          onChange={(value) => set("resume.skills", value)}
          placeholder="Node.js"
        />
        <TagList
          label="Certifications"
          items={resume.certifications}
          readOnly={readOnly}
          onChange={(value) => set("resume.certifications", value)}
          placeholder="AWS Solutions Architect"
        />
      </div>
    </div>
  );
}
