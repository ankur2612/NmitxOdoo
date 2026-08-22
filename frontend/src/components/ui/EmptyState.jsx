export default function EmptyState({ icon, title, children }) {
  return (
    <div className="rounded-panel border border-dashed border-line px-6 py-14 text-center">
      {icon && <div className="mb-3 flex justify-center text-ink-faint">{icon}</div>}
      <p className="font-medium text-ink">{title}</p>
      {children && <div className="mt-1.5 text-ink-faint">{children}</div>}
    </div>
  );
}
