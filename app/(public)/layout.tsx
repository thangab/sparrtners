import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f4ef] text-slate-900">
      <div className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-100 via-[#f7f4ef] to-transparent" />
        <div className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="pointer-events-none absolute right-[-10%] top-0 h-72 w-72 rounded-full bg-amber-200/60 blur-3xl" />
        <header className="relative z-10">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
            <Link className="transition hover:text-slate-900" href="/">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold uppercase tracking-wide text-white">
                  Sp
                </div>
                <div>
                  <div className="uppercase text-lg font-semibold">
                    Sparrtners
                  </div>
                </div>
              </div>
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
              <Link className="transition hover:text-slate-900" href="/">
                A propos
              </Link>
              <Link className="transition hover:text-slate-900" href="/">
                Blog
              </Link>
              <Link className="transition hover:text-slate-900" href="/login">
                Mon compte
              </Link>
            </nav>
            <Button
              asChild
              size="sm"
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              <Link href="/app/sessions/new">Créer une session</Link>
            </Button>
          </div>
        </header>
        <main className="relative z-10">{children}</main>
      </div>
      <footer className="mt-auto border-t border-slate-200/70 bg-white/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div>
            © {new Date().getFullYear()} Sparrtners. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
