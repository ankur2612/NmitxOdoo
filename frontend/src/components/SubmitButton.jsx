export default function SubmitButton({ pending, pendingLabel, children }) {
  return (
    <button
      type="submit"
      className="flex w-full items-center justify-center gap-2 rounded-field bg-accent px-4 py-2.5 font-medium text-accent-ink transition-colors duration-150 hover:bg-accent-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
    >
      {pending && (
        <span
          aria-hidden="true"
          className="size-3.5 animate-spin rounded-full border-2 border-accent-ink/30 border-t-accent-ink"
        />
      )}
      {pending ? pendingLabel : children}
    </button>
  );
}
