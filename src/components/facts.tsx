// Small label/value grid used inside expanded rows.
export default function Facts({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{k}</dt>
          <dd className="mt-0.5">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
