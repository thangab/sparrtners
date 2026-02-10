import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogoutButton } from '@/components/app/logout-button';
import {
  ChevronDown,
  CirclePlus,
  CircleUserRound,
  Menu,
  Search,
} from 'lucide-react';

type TopHeaderProps = {
  user?: {
    id?: string | null;
    email?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
  notificationsCount?: number;
};

const primaryLinks = [
  { href: '/', label: 'A propos' },
  { href: '/', label: 'Blog' },
];

export function TopHeader({ user, notificationsCount = 0 }: TopHeaderProps) {
  const hasUser = Boolean(user?.id);
  const label =
    user?.displayName?.trim() || user?.email?.split('@')[0] || 'Compte';
  const profileHref = user?.id ? `/profile/${user.id}` : '/app/me';
  const hasNotifications = notificationsCount > 0;
  const badgeLabel = notificationsCount > 9 ? '9+' : `${notificationsCount}`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-3 md:px-6">
        <div className="flex items-center gap-2 md:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Ouvrir le menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {primaryLinks.map((item) => (
                <DropdownMenuItem key={`${item.href}-${item.label}`} asChild>
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem asChild>
                <Link href="/app/sessions/new">Publier une session</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {hasUser ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/app">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/app/sessions/requests">Mes sessions</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/app/notifications" className="justify-between">
                      <span>Notifications</span>
                      {hasNotifications ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                          {badgeLabel}
                        </span>
                      ) : null}
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login">Se connecter</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/signup">S&apos;inscrire</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link className="transition hover:text-slate-900" href="/">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold uppercase tracking-wide text-white">
                Sp
              </div>
              <div className="hidden text-sm font-semibold min-[430px]:block md:text-base">
                Sparrtners
              </div>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 md:flex">
          {primaryLinks.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              className="transition hover:text-slate-900"
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-1 md:hidden">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 w-9 rounded-full p-0 text-slate-700"
            >
              <Link href="/find-sessions" aria-label="Rechercher une session">
                <Search className="h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              size="sm"
              className="h-9 rounded-full bg-slate-900 px-2.5 text-xs text-white hover:bg-slate-800"
            >
              <Link href="/app/sessions/new" aria-label="Publier une session">
                <CirclePlus className="mr-1.5 h-3.5 w-3.5" />
                Publier
              </Link>
            </Button>
          </div>

          <div className="hidden items-center gap-2 md:flex md:gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-slate-600"
            >
              <Link href="/find-sessions" aria-label="Rechercher une session">
                <Search className="h-4 w-4" />
                <span className="ml-2">Rechercher</span>
              </Link>
            </Button>

            <Button
              asChild
              size="sm"
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              <Link href="/app/sessions/new" aria-label="Publier une session">
                <CirclePlus className="mr-2 h-4 w-4" />
                <span>Publier une session</span>
              </Link>
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={
                  hasNotifications
                    ? `${label}, ${notificationsCount} notifications non lues`
                    : label
                }
                className="group relative flex cursor-pointer items-center gap-1.5 md:gap-2"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ${
                    hasUser ? 'bg-orange-500' : 'bg-slate-100'
                  }`}
                >
                  {hasUser && user?.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={label}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <CircleUserRound
                      className={`h-8 w-8 ${
                        hasUser ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                  )}
                </span>
                {hasUser && hasNotifications ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                    {badgeLabel}
                  </span>
                ) : null}
                <ChevronDown className="hidden h-4 w-4 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180 md:block" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64">
              {hasUser ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/app/notifications"
                      className="flex w-full items-center justify-between"
                    >
                      <span>Mes notifications</span>
                      {hasNotifications ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                          {badgeLabel}
                        </span>
                      ) : null}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/app">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/app/sessions/requests">Mes sessions</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={profileHref}>Mon profil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/app/me">Modifier mon profil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="p-0">
                    <LogoutButton />
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login">Se connecter</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/signup">S&apos;inscrire</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
