import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Field from "../components/Field";
import SubmitButton from "../components/SubmitButton";
import { useAuth } from "../context/authStore";
import api, { readError } from "../lib/api";
import companyCodeFrom from "../lib/companyCode";

const MIN_PASSWORD_LENGTH = 8;
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

export default function SignUp() {
  const { registerCompany } = useAuth();
  const navigate = useNavigate();

  const companyNameRef = useRef(null);
  const codeRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [logo, setLogo] = useState(null);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  function handleCompanyNameChange(event) {
    if (!codeTouched) {
      setCode(companyCodeFrom(event.target.value));
    }
  }

  function handleCodeChange(event) {
    setCodeTouched(true);
    setCode(event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2));
  }

  function handleLogoChange(event) {
    const file = event.target.files?.[0] ?? null;

    if (file && file.size > MAX_LOGO_BYTES) {
      setFieldErrors((current) => ({
        ...current,
        logo: "Pick an image under 5 MB.",
      }));
      event.target.value = "";
      setLogo(null);
      return;
    }

    setFieldErrors((current) => ({ ...current, logo: undefined }));
    setLogo(file);
  }

  function validate(values) {
    const errors = {};

    if (!values.companyName) {
      errors.companyName = "Enter your company name.";
    }

    if (!/^[A-Z]{2}$/.test(values.companyCode)) {
      errors.companyCode = "Use exactly two letters.";
    }

    if (!values.name) {
      errors.name = "Enter your full name.";
    }

    if (!values.email) {
      errors.email = "Enter a work email.";
    } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      errors.email = "That email doesn’t look right. Check for typos.";
    }

    if (!values.password) {
      errors.password = "Choose a password.";
    } else if (values.password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    if (values.password !== values.confirmPassword) {
      errors.confirmPassword = "Passwords don’t match.";
    }

    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const byField = {
      companyName: companyNameRef,
      companyCode: codeRef,
      name: nameRef,
      email: emailRef,
      phone: phoneRef,
      password: passwordRef,
      confirmPassword: confirmPasswordRef,
    };

    const values = {
      companyName: companyNameRef.current.value.trim(),
      companyCode: code,
      name: nameRef.current.value.trim(),
      email: emailRef.current.value.trim(),
      phone: phoneRef.current.value.trim(),
      password: passwordRef.current.value,
      confirmPassword: confirmPasswordRef.current.value,
    };

    const errors = validate(values);

    setFieldErrors(errors);
    setFormError("");

    const firstInvalid = Object.keys(errors)[0];

    if (firstInvalid) {
      byField[firstInvalid]?.current?.focus();
      return;
    }

    setPending(true);

    try {
      await registerCompany(values);

      if (logo) {
        const body = new FormData();
        body.append("logo", logo);

        await api.post("/company/logo", body).catch(() => {
          // The account exists either way, so a failed logo upload must not
          // strand the user on the form. They can set it later in Settings.
        });
      }

      navigate("/employees", { replace: true });
    } catch (error) {
      setFormError(readError(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Create Your Company Account"
      lead="You’ll be the first admin. Add your team once you’re in."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="flex items-start gap-3">
          <Field
            ref={companyNameRef}
            className="min-w-0 flex-1"
            label="Company Name"
            name="organization"
            type="text"
            autoComplete="organization"
            placeholder="Odoo India"
            onChange={handleCompanyNameChange}
            hint="Employee Login IDs start with the code beside this."
            error={fieldErrors.companyName}
          />

          <Field
            ref={codeRef}
            className="w-20 shrink-0"
            label="Code"
            name="company-code"
            type="text"
            autoComplete="off"
            spellCheck={false}
            maxLength={2}
            inputClassName="text-center font-mono uppercase tracking-widest"
            value={code}
            onChange={handleCodeChange}
            placeholder="OI"
            error={fieldErrors.companyCode}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-ink-dim">
            Company Logo
          </span>

          <div className="flex items-center gap-3">
            <label
              htmlFor="logo"
              className="cursor-pointer rounded-field border border-line px-3 py-2 text-xs text-ink-dim transition-colors duration-150 hover:border-line-strong hover:text-ink focus-within:ring-2 focus-within:ring-accent/35"
            >
              Choose Image
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleLogoChange}
                className="sr-only"
              />
            </label>

            <span className="min-w-0 truncate text-xs text-ink-faint">
              {logo ? logo.name : "Optional, add it later in Settings"}
            </span>
          </div>

          {fieldErrors.logo && (
            <p className="mt-1.5 text-xs text-clay">{fieldErrors.logo}</p>
          )}
        </div>

        <Field
          ref={nameRef}
          label="Your Full Name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Asha Menon"
          error={fieldErrors.name}
        />

        <Field
          ref={emailRef}
          label="Work Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          autoCapitalize="none"
          placeholder="asha@odoo.com"
          error={fieldErrors.email}
        />

        <Field
          ref={phoneRef}
          label="Phone"
          name="tel"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98765 43210"
          hint="Optional."
          error={fieldErrors.phone}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            ref={passwordRef}
            label="Password"
            name="new-password"
            type="password"
            autoComplete="new-password"
            spellCheck={false}
            placeholder="8+ characters…"
            error={fieldErrors.password}
          />

          <Field
            ref={confirmPasswordRef}
            label="Confirm Password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            spellCheck={false}
            placeholder="Repeat it…"
            error={fieldErrors.confirmPassword}
          />
        </div>

        <div aria-live="polite">
          {formError && (
            <p className="rounded-field border border-clay/40 bg-clay/10 px-3 py-2 text-xs text-clay">
              {formError}
            </p>
          )}
        </div>

        <SubmitButton pending={pending} pendingLabel="Creating Account…">
          Create Company Account
        </SubmitButton>
      </form>

      <p className="mt-8 border-t border-line pt-6 text-ink-faint">
        Already have an account?{" "}
        <Link
          to="/login"
          className="rounded-sm text-ink underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:decoration-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
