export default function Soon({ title }) {
  return (
    <div className="rounded-panel border border-dashed border-line px-6 py-16 text-center">
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-1.5 text-ink-faint">This module is next up.</p>
    </div>
  );
}
