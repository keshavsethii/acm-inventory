// Compact page header (title, one line of help, optional actions) followed by the content.
export default function PageShell(props: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{props.title}</h1>
          {props.description && <p className="mt-1.5 max-w-xl text-muted">{props.description}</p>}
        </div>
        {props.actions}
      </header>
      {props.children}
    </div>
  );
}
