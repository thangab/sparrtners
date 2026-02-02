import { TopHeader } from '@/components/app/top-header';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClientReadOnly();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle()
    : { data: null };
  const { count: notificationsCount } = user
    ? await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .is('read_at', null)
    : { count: 0 };

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f4ef] pt-16 text-slate-900">
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-120 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-amber-100 via-[#f7f4ef] to-transparent" />
          <div className="absolute -left-24 top-24 h-64 w-64 rounded-full bg-emerald-200/50 blur-3xl" />
          <div className="absolute right-[-10%] top-0 h-72 w-72 rounded-full bg-amber-200/60 blur-3xl" />
        </div>
        <TopHeader
          user={{
            id: user?.id ?? null,
            email: user?.email ?? null,
            displayName: profile?.display_name ?? null,
            avatarUrl: profile?.avatar_url ?? null,
          }}
          notificationsCount={notificationsCount ?? 0}
        />
        <main className="relative">{children}</main>
      </div>
      <footer className="mt-auto border-t border-slate-200/70 bg-white/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-2 md:px-6 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div>
            © {new Date().getFullYear()} Sparrtners. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
