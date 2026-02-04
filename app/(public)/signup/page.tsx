'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function SignupPage() {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [signupEmail, setSignupEmail] = React.useState<string | null>(null);

  const handleGoogle = async () => {
    setLoading(true);
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${siteUrl}/api/auth/callback` },
    });
    if (error) {
      toast({
        title: 'Erreur OAuth',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${siteUrl}/api/auth/callback`,
      },
    });
    if (error) {
      toast({
        title: 'Inscription échouée',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }
    setSignupEmail(email.trim());
    setLoading(false);
    if (data.session) {
      router.push('/app');
    }
  };

  return (
    <main>
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-2 pb-20 pt-6 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-16 md:px-6">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">
              Créer un compte
            </h1>
            <p className="text-sm text-slate-500">
              Crée ton compte Sparrtners.
            </p>
          </div>

          <Card className="border-slate-200/80 bg-white shadow-sm">
            <CardContent className="space-y-6 pt-6">
              <Button
                className="w-full justify-center gap-3 bg-slate-100 text-slate-900 hover:bg-slate-200"
                onClick={handleGoogle}
                disabled={loading}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-900 shadow">
                  G
                </span>
                Continuer avec Google
              </Button>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                <span>Ou avec l’email</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {signupEmail ? (
                <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-sm text-emerald-900">
                  <div className="text-base font-semibold">
                    Compte créé
                  </div>
                  <p>
                    Ton compte a bien été créé avec l’email{' '}
                    <span className="font-semibold">{signupEmail}</span>.
                    Pense à confirmer ton email pour activer ton compte.
                  </p>
                </div>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSignup();
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    type="submit"
                    disabled={loading || !email || !password}
                  >
                    Créer un compte
                  </Button>
                </form>
              )}

              <div className="space-y-2 text-center text-sm">
                <div className="text-slate-500">
                  Déjà un compte ?{' '}
                  <Link href="/login" className="text-slate-900 underline">
                    Se connecter
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative hidden min-h-130 p-6 md:block">
          <div className="absolute -left-12 top-10 h-72 w-72 rounded-full border border-blue-200/70" />
          <div className="absolute -right-12 bottom-10 h-72 w-72 rounded-full border border-blue-200/70" />
          <div className="relative mx-auto flex h-full max-w-md items-center justify-center">
            <div className="p-6">
              <Image
                src="/illustration-fighter.webp"
                alt="Sparrtners app preview"
                width={520}
                height={520}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
