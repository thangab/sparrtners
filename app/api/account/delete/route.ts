import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

async function cleanupUserData(admin: ReturnType<typeof createSupabaseAdminClient>, userId: string) {
  // Best-effort cleanup for environments where some FKs are not cascading.
  await admin.from('messages').delete().eq('sender_id', userId);
  await admin.from('conversations').delete().or(`user_a.eq.${userId},user_b.eq.${userId}`);
  await admin.from('session_boosts').delete().eq('user_id', userId);
  await admin.from('reviews').delete().or(`reviewer_id.eq.${userId},reviewed_user_id.eq.${userId}`);
  await admin.from('reports').delete().or(`reporter_id.eq.${userId},reported_user_id.eq.${userId}`);
  await admin.from('session_participants').delete().eq('user_id', userId);
  await admin.from('session_requests').delete().eq('user_id', userId);
  await admin.from('sessions').delete().eq('host_id', userId);
  await admin.from('boost_credits').delete().eq('user_id', userId);
  await admin.from('entitlements').delete().eq('user_id', userId);
  await admin.from('user_sport_profiles').delete().eq('user_id', userId);
  await admin.from('user_trust_scores').delete().eq('user_id', userId);
  await admin.from('profile_completion_scores').delete().eq('user_id', userId);
  await admin
    .from('notifications')
    .delete()
    .or(`recipient_id.eq.${userId},actor_id.eq.${userId}`);
  await admin.from('profiles').delete().eq('id', userId);
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    confirmation?: string;
  };

  if (body.confirmation !== 'SUPPRIMER') {
    return NextResponse.json(
      { error: 'Confirmation invalide. Tape SUPPRIMER.' },
      { status: 400 },
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY manquant côté serveur.' },
      { status: 500 },
    );
  }

  const admin = createSupabaseAdminClient();
  let { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    await cleanupUserData(admin, user.id);
    const retried = await admin.auth.admin.deleteUser(user.id);
    error = retried.error;
  }

  if (error) {
    return NextResponse.json(
      {
        error:
          "Impossible de supprimer le compte automatiquement. Contacte le support avec ce message: " +
          error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
