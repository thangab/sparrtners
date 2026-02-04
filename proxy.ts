import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set('x-pathname', req.nextUrl.pathname);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith('/app') && !user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname.startsWith('/app') && user && pathname !== '/app/me') {
    const { data: completion } = await supabase
      .from('profile_completion_scores')
      .select('percent')
      .eq('user_id', user.id)
      .maybeSingle();
    const percent = completion?.percent ?? 0;

    if (percent < 100) {
      return NextResponse.redirect(new URL('/app/me?required=1', req.url));
    }
  }

  if (pathname.startsWith('/login') && user) {
    return NextResponse.redirect(new URL('/app', req.url));
  }
  if (pathname.startsWith('/signup') && user) {
    return NextResponse.redirect(new URL('/app', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/app/:path*', '/login', '/signup'],
};
