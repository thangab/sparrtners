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
import { ChevronDown, CirclePlus, CircleUserRound, Search } from 'lucide-react';

type TopHeaderProps = {
  user?: {
    id?: string | null;
    email?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
  notificationsCount?: number;
};

export function TopHeader({ user, notificationsCount = 0 }: TopHeaderProps) {
  const hasUser = !!user?.email || !!user?.displayName || !!user?.avatarUrl;
  const label =
    user?.displayName?.trim() || user?.email?.split('@')[0] || 'Compte';
  const profileHref = user?.id ? `/profile/${user.id}` : '/app/me';
  const hasNotifications = notificationsCount > 0;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link className="transition hover:text-slate-900" href="/">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold uppercase tracking-wide text-white">
              Sp
            </div>
            <div className="hidden text-base font-semibold md:flex">
              Sparrtners
            </div>
          </div>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 md:flex">
          <Link className="transition hover:text-slate-900" href="/">
            A propos
          </Link>
          <Link className="transition hover:text-slate-900" href="/">
            Blog
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden text-slate-600 md:inline-flex"
          >
            <Link href="/find-sessions">
              <Search className="flex h-4 w-4 md:hidden" />
              <span className="hidden md:flex">Rechercher</span>
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            <Link href="/app/sessions/new">
              <CirclePlus className="h-4 w-4 md:mr-2" />
              <span className="hidden md:flex">Publier une session</span>
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={label}
                className="group relative flex cursor-pointer items-center gap-2"
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
                  <span className="absolute right-5 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
                    !
                  </span>
                ) : null}
                <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
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
                          {notificationsCount}
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/app/me">Modifier mon profil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="p-0">
                    <LogoutButton />
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href="/login">Se connecter</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
