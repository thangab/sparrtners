import { NextResponse } from 'next/server';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type SessionStatsUpdate = {
  session_id: string;
  impressions?: number;
  detail_clicks?: number;
};

export async function POST(request: Request) {
  const raw = await request.text();
  let payload: { updates?: SessionStatsUpdate[] } | null = null;
  try {
    payload = raw ? (JSON.parse(raw) as { updates?: SessionStatsUpdate[] }) : null;
  } catch {
    payload = null;
  }

  const updates = Array.isArray(payload?.updates)
    ? payload!.updates
        .map((item) => ({
          session_id: item.session_id,
          impressions: Number.isFinite(item.impressions)
            ? Number(item.impressions)
            : 0,
          detail_clicks: Number.isFinite(item.detail_clicks)
            ? Number(item.detail_clicks)
            : 0,
        }))
        .filter((item) => typeof item.session_id === 'string' && item.session_id)
    : [];

  if (updates.length === 0) {
    return NextResponse.json({ ok: true, count: 0 });
  }

  const supabase = await createSupabaseServerClientReadOnly();
  const { error } = await supabase.rpc('increment_session_stats', {
    p_updates: updates,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: updates.length });
}
