import Link from 'next/link';

const navItems = [
  { href: '/app', label: 'Dashboard' },
  { href: '/find-sessions', label: 'Sessions publiques' },
  { href: '/app/sessions/new', label: 'Créer une session' },
  { href: '/app/sessions/requests', label: 'Mes demandes' },
  { href: '/app/me', label: 'Mon profil' },
];

export function Sidebar() {
  return (
    <aside className="flex w-64 flex-col gap-6 border-r border-border bg-muted/30 p-6">
      <div>
        <Link href="/">
          <div className="text-xl font-semibold">Sparrtners</div>
        </Link>
        <div className="text-sm text-muted-foreground">Dashboard</div>
      </div>
      <nav className="flex flex-1 flex-col gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Navigation
        </div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
