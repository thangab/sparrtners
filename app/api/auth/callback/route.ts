import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/app', request.url));
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const token = url.searchParams.get('token');
  const type = url.searchParams.get('type');

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL('/login?error=auth1', request.url));
    }
    return response;
  }

  if (token && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as 'magiclink' | 'signup' | 'recovery' | 'email_change',
      token_hash: token,
    });
    if (error) {
      return NextResponse.redirect(new URL('/login?error=auth2', request.url));
    }
    return response;
  }

  return response;
}
