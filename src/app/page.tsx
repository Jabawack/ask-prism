import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-md text-center">
        <h1 className="mb-2 text-3xl font-bold text-[var(--color-text-primary)]">
          Ask Prism
        </h1>
        <p className="mb-8 text-[var(--color-text-secondary)]">
          Document Analytics Platform
        </p>

        <div className="flex flex-col gap-4">
          <Link
            href="/chat"
            className="rounded-lg bg-[var(--color-primary)] px-6 py-3 text-white transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            Chat with Documents
          </Link>
          <Link
            href="/landbase-table"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-6 py-3 text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-tertiary)]"
          >
            Landbase Table Demo
          </Link>
        </div>
      </div>
    </div>
  );
}
