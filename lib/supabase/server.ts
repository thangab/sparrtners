import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function createClientWithCookies(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof cookieStore.getAll === "function") {
            return cookieStore.getAll();
          }
          return [];
        },
        setAll(cookiesToSet) {
          if (typeof cookieStore.set !== "function") return;
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createClientWithCookies(cookieStore);
}

export async function createSupabaseServerClientReadOnly() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof cookieStore.getAll === "function") {
            return cookieStore.getAll();
          }
          return [];
        },
        setAll() {
          // Read-only: Server Components cannot set cookies.
        },
      },
    }
  );
}
