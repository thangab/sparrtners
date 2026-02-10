'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { toast } = useToast();
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showRecovery, setShowRecovery] = React.useState(false);
  const [recoveryEmail, setRecoveryEmail] = React.useState<string | null>(null);

  const handleGoogle = async () => {
    setLoading(true);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
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

  const handleSignIn = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      toast({
        title: 'Connexion echouee',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }
    toast({
      title: 'Connexion reussie',
      description: 'Bienvenue sur Sparrtners.',
    });
    if (data?.session) {
      router.push('/app');
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      toast({
        title: 'Email requis',
        description: 'Renseigne ton email pour recevoir le lien de reset.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${siteUrl}/reset-password`,
    });
    if (error) {
      toast({
        title: 'Envoi echoue',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }
    setRecoveryEmail(email.trim());
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7ed_0,#f8fafc_45%,#eef2ff_100%)]">
      <div className="grid min-h-screen w-full lg:grid-cols-[420px_1fr]">
        <section className="relative flex min-h-screen flex-col justify-center border-r border-slate-200 bg-white px-7 py-10 sm:px-10">
          <div className="mx-auto w-full max-w-[340px]">
            <Link
              href="/"
              className="mb-10 inline-flex items-center text-3xl font-black tracking-tight text-slate-950"
            >
              Sparrtners
            </Link>

            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Connexion
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Accede a ton espace pour gerer tes sessions.
            </p>

            {!showRecovery ? (
              <>
                <form
                  className="mt-8 space-y-5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSignIn();
                  }}
                >
                  <fieldset className="space-y-5" disabled={loading}>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-700">
                        E-mail
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="h-11 rounded-md border-slate-300 bg-white"
                        placeholder="name@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-700">
                        Mot de passe
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          className="h-11 rounded-md border-slate-300 bg-white pr-10"
                          placeholder="Au moins 8 caracteres"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                          onClick={() => setShowPassword((value) => !value)}
                          aria-label="Afficher ou masquer le mot de passe"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="text-sm font-medium text-orange-700 hover:text-orange-800"
                      onClick={() => setShowRecovery(true)}
                    >
                      Mot de passe oublie ?
                    </button>

                    <Button
                      type="submit"
                      disabled={!email || !password || loading}
                      className="h-11 w-full rounded-md bg-slate-900 text-white hover:bg-slate-800"
                    >
                      Se connecter
                    </Button>
                  </fieldset>
                </form>

                <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <div className="h-px flex-1 bg-slate-300" />
                  <span>Or</span>
                  <div className="h-px flex-1 bg-slate-300" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-md border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                  onClick={handleGoogle}
                  disabled={loading}
                >
                  Se connecter avec Google
                </Button>

                <p className="mt-5 text-center text-sm text-slate-600">
                  Pas encore de compte ?{' '}
                  <Link href="/signup" className="font-semibold text-orange-700">
                    Creer un compte
                  </Link>
                </p>
              </>
            ) : (
              <div className="mt-8 space-y-4">
                <p className="text-sm text-slate-600">
                  Entre ton email. Si un compte existe, on enverra un lien de
                  reinitialisation.
                </p>
                {recoveryEmail ? (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
                    Email envoye a <span className="font-semibold">{recoveryEmail}</span>.
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="recovery-email" className="text-slate-700">
                        E-mail
                      </Label>
                      <Input
                        id="recovery-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="h-11 rounded-md border-slate-300 bg-white"
                        placeholder="name@email.com"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={!email || loading}
                      className="h-11 w-full rounded-md bg-slate-900 text-white hover:bg-slate-800"
                    >
                      Envoyer le lien
                    </Button>
                  </>
                )}
                <button
                  type="button"
                  className="text-sm font-medium text-orange-700 hover:text-orange-800"
                  onClick={() => {
                    setShowRecovery(false);
                    setRecoveryEmail(null);
                  }}
                >
                  Retour a la connexion
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="relative hidden overflow-hidden bg-white lg:flex lg:min-h-screen lg:items-center lg:justify-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(251,146,60,0.24),transparent_35%),radial-gradient(circle_at_82%_14%,rgba(99,102,241,0.14),transparent_34%),linear-gradient(140deg,#fff7ed_0%,#f8fafc_52%,#eef2ff_100%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-20 [background:repeating-linear-gradient(120deg,rgba(15,23,42,0.06)_0,rgba(15,23,42,0.06)_2px,transparent_2px,transparent_18px)]" />

          <div className="relative z-10 w-full max-w-3xl px-10">
            <p className="text-6xl font-black tracking-tight text-slate-950">
              Sparrtners
            </p>
            <p className="mt-4 text-xl font-semibold text-orange-700">
              Plateforme d&apos;entrainement entre partenaires
            </p>

            <div className="mt-12 rounded-2xl border border-orange-100/80 bg-white/85 p-8 text-slate-900 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.25)] backdrop-blur-sm">
              <h2 className="text-4xl font-black leading-tight text-slate-950">
                Organise tes sessions sans friction.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-slate-700">
                Reponds aux demandes, confirme les participants et discute
                directement dans le chat avant chaque entrainement.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
