import { NextResponse } from 'next/server';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const allowedRanges = new Set(['7d', '30d', '90d']);

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClientReadOnly();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const rangeParam = url.searchParams.get('range') ?? '7d';
  const range = allowedRanges.has(rangeParam) ? rangeParam : '7d';

  const { data, error } = await supabase.rpc('get_user_activity', {
    p_user_id: user.id,
    p_range: range,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ range, data: data ?? [] });
}
