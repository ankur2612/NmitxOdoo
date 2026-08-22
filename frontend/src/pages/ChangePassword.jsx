import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Field from "../components/Field";
import SubmitButton from "../components/SubmitButton";
import { useAuth } from "../context/authStore";
import api, { readError } from "../lib/api";

const MIN_LENGTH = 8;

export default function ChangePassword() {
  const { user, signOut, refreshUser } = useAuth();
  const navigate = useNavigate();

  const currentRef = useRef(null);
  const nextRef = useRef(null);
  const confirmRef = useRef(null);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();

    const currentPassword = currentRef.current.value;
    const newPassword = nextRef.current.value;
    const confirmPassword = confirmRef.current.value;

    const errors = {};

    if (!currentPassword) {
      errors.current = "Enter the temporary password your admin gave you.";
    }

    if (newPassword.length < MIN_LENGTH) {
      errors.next = `Use at least ${MIN_LENGTH} characters.`;
    } else if (newPassword === currentPassword) {
      errors.next = "Pick something different from the temporary password.";
    }

    if (newPassword !== confirmPassword) {
      errors.confirm = "Passwords don’t match.";
    }

    setFieldErrors(errors);
    setError("");

    const first = errors.current
      ? currentRef
      : errors.next
        ? nextRef
        : errors.confirm
          ? confirmRef
          : null;

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

      // The route guard reads mustChangePassword from context, so it has to be
      // refreshed before navigating or the guard sends us straight back here.
      await refreshUser();
      navigate("/employees", { replace: true });
    } catch (err) {
      setError(readError(err));
      currentRef.current.focus();
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Set Your Own Password"
      lead={`Welcome, ${user?.firstName || "there"}. Replace the temporary password before you continue.`}
      aside={
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Your Login ID
          </p>
          <p className="mt-3 font-mono text-lg text-accent tnum">{user?.loginId}</p>
          <p className="mt-3 max-w-xs text-xs text-ink-faint">
            This never changes. Use it or your work email to sign in from now on.
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field
          ref={currentRef}
          label="Temporary Password"
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
        </div>

        <SubmitButton pending={pending} pendingLabel="Saving…">
          Save and Continue
        </SubmitButton>
      </form>

      <button
        type="button"
        onClick={signOut}
        className="mt-8 rounded-sm border-t border-line pt-6 text-ink-faint transition-colors duration-150 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        Sign out instead
      </button>
    </AuthLayout>
  );
}
