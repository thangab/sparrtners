import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';
import { Sidebar } from '@/components/app/sidebar';
import { LogoutButton } from '@/components/app/logout-button';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClientReadOnly();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen w-full">
        <Sidebar userId={user?.id} />
        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Espace membre
              </div>
              <div className="text-lg font-semibold">
                {user?.email ?? 'Sportif'}
              </div>
            </div>
            <LogoutButton />
          </header>
          <main className="flex-1 px-6 py-8">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
