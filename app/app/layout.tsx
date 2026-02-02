import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';
import { TopHeader } from '@/components/app/top-header';

export default async function AppLayout({
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
        .select(
          'display_name, avatar_url, gender, firstname, lastname, nickname, birthdate, city, dominant_hand, height_cm, weight_kg',
        )
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
    <div className="min-h-screen bg-[#f7f4ef] pt-16 text-foreground">
      <TopHeader
        user={{
          id: user?.id ?? null,
          email: user?.email ?? null,
          displayName: profile?.display_name ?? null,
          avatarUrl: profile?.avatar_url ?? null,
        }}
        notificationsCount={notificationsCount ?? 0}
      />
      <div className="flex min-h-screen w-full">
        <div className="flex flex-1 flex-col">
          <main className="mx-auto w-full max-w-6xl flex-1 px-2 md:px-6 py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
