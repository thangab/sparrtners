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
    <div className="min-h-screen bg-[#f7f4ef] pt-16 text-foreground">
      <TopHeader
        user={{
          id: user?.id ?? null,
          email: user?.email ?? null,
          displayName: profile?.display_name ?? null,
          avatarUrl: profile?.avatar_url ?? null,
        }}
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
