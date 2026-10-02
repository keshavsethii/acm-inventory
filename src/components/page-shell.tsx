import { eyebrowClass } from "@/app/ui";

// Page header band (small blue label, big title, short description) followed by the page content.
export default function PageShell(props: {
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <section className="border-b border-line bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-4 py-10 sm:py-14">
          <div className="max-w-2xl">
            <p className={eyebrowClass}>{props.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{props.title}</h1>
            {props.description && <p className="mt-3 text-base text-muted">{props.description}</p>}
          </div>
          {props.actions}
        </div>
      </section>
      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10">{props.children}</div>
    </>
  );
}
