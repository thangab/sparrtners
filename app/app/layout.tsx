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
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="min-h-screen bg-background pt-16 text-foreground">
      <TopHeader
        user={{
          email: user?.email ?? null,
          displayName: profile?.display_name ?? null,
          avatarUrl: profile?.avatar_url ?? null,
        }}
      />
      <div className="flex min-h-screen w-full">
        <div className="flex flex-1 flex-col">
          <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
