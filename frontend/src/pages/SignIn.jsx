import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Field from "../components/Field";
import SubmitButton from "../components/SubmitButton";
import { useAuth } from "../context/authStore";
import { readError } from "../lib/api";

export default function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const identifierRef = useRef(null);
  const passwordRef = useRef(null);

  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();

    const identifier = identifierRef.current.value.trim();
    const password = passwordRef.current.value;

    const errors = {};

    if (!identifier) {
      errors.identifier = "Enter your Login ID or work email.";
    }

    if (!password) {
      errors.password = "Enter your password.";
    }

    setFieldErrors(errors);
    setFormError("");

    if (errors.identifier) {
      identifierRef.current.focus();
      return;
    }

    if (errors.password) {
      passwordRef.current.focus();
      return;
    }

    setPending(true);

    try {
      const result = await signIn(identifier, password);
      navigate(result.mustChangePassword ? "/profile?tab=security" : "/employees", { replace: true });
    } catch (error) {
      setFormError(readError(error));
      passwordRef.current.focus();
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout title="Sign In" lead="Welcome back. Pick up where you left off.">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field
          ref={identifierRef}
          label="Login ID or Work Email"
          name="identifier"
          type="text"
          autoComplete="username"
          spellCheck={false}
          autoCapitalize="none"
          placeholder="OIJODO20260001"
          error={fieldErrors.identifier}
        />

        <Field
          ref={passwordRef}
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          spellCheck={false}
          placeholder="Your password…"
          error={fieldErrors.password}
        />

        <div aria-live="polite">
          {formError && (
            <p className="rounded-field border border-clay/40 bg-clay/10 px-3 py-2 text-xs text-clay">
              {formError}
            </p>
          )}
        </div>

        <SubmitButton pending={pending} pendingLabel="Signing In…">
          Sign In
        </SubmitButton>
      </form>

      <p className="mt-8 border-t border-line pt-6 text-ink-faint">
        Registering a company?{" "}
        <Link
          to="/register"
          className="rounded-sm text-ink underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:decoration-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          Create an account
        </Link>
      </p>

      <p className="mt-3 text-xs text-ink-faint">
        Employees don’t self-register. Your admin creates your account and shares your
        Login ID.
      </p>
    </AuthLayout>
  );
}
