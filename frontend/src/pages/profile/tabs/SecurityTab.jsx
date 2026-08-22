import { useRef, useState } from "react";
import Field from "../../../components/Field";
import SubmitButton from "../../../components/SubmitButton";
import api, { readError } from "../../../lib/api";

const MIN_LENGTH = 8;

export default function SecurityTab({ onChanged }) {
  const currentRef = useRef(null);
  const nextRef = useRef(null);
  const confirmRef = useRef(null);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();

    const currentPassword = currentRef.current.value;
    const newPassword = nextRef.current.value;
    const confirmPassword = confirmRef.current.value;

    const errors = {};

    if (!currentPassword) {
      errors.current = "Enter your current password.";
    }

    if (newPassword.length < MIN_LENGTH) {
      errors.next = `Use at least ${MIN_LENGTH} characters.`;
    } else if (newPassword === currentPassword) {
      errors.next = "Pick something different from your current password.";
    }

    if (newPassword !== confirmPassword) {
      errors.confirm = "Passwords don’t match.";
    }

    setFieldErrors(errors);
    setError("");
    setDone(false);

    const first = errors.current ? currentRef : errors.next ? nextRef : errors.confirm ? confirmRef : null;

    if (first) {
      first.current.focus();
      return;
    }

    setPending(true);

    try {
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      currentRef.current.value = "";
      nextRef.current.value = "";
      confirmRef.current.value = "";
      setDone(true);
      onChanged?.();
    } catch (err) {
      setError(readError(err));
      currentRef.current.focus();
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="max-w-md rounded-panel border border-line bg-surface p-5">
      <h3 className="font-medium text-ink">Change Password</h3>
      <p className="mt-1 text-xs text-ink-faint">
        You stay signed in on this device after changing it.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <Field
          ref={currentRef}
          label="Current Password"
          name="current-password"
          type="password"
          autoComplete="current-password"
          spellCheck={false}
          error={fieldErrors.current}
        />
        <Field
          ref={nextRef}
          label="New Password"
          name="new-password"
          type="password"
          autoComplete="new-password"
          spellCheck={false}
          placeholder="8+ characters…"
          error={fieldErrors.next}
        />
        <Field
          ref={confirmRef}
          label="Confirm New Password"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          spellCheck={false}
          error={fieldErrors.confirm}
        />

        <div aria-live="polite">
          {error && (
            <p className="rounded-field border border-clay/40 bg-clay/10 px-3 py-2 text-xs text-clay">
              {error}
            </p>
          )}
          {done && (
            <p className="rounded-field border border-jade/40 bg-jade/10 px-3 py-2 text-xs text-jade">
              Password updated.
            </p>
          )}
        </div>

        <SubmitButton pending={pending} pendingLabel="Updating…">
          Update Password
        </SubmitButton>
      </form>
    </section>
  );
}
