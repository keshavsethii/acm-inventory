export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-3xl font-semibold">ACM Inventory Manager</h1>
      <p className="text-zinc-600">ACM Student Chapter, IIIT Una</p>
      <p className="text-sm text-zinc-500">
        Setup complete. Check the database connection at{" "}
        <a className="underline" href="/api/health">
          /api/health
        </a>
        .
      </p>
    </main>
  );
}
