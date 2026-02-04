'use client';

import * as React from 'react';
import Image from 'next/image';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function LoginPage() {
  const { toast } = useToast();
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showRecovery, setShowRecovery] = React.useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
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

  const handleEmailPassword = async (mode: 'signin' | 'signup') => {
    setLoading(true);
    const normalizedEmail = email.trim();

    const { data, error } =
      mode === 'signup'
        ? await supabase.auth.signUp({
            email: normalizedEmail,
            password,
          })
        : await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });

    if (error) {
      toast({
        title: mode === 'signup' ? 'Inscription échouée' : 'Connexion échouée',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    toast({
      title: mode === 'signup' ? 'Compte créé' : 'Connecté',
      description:
        mode === 'signup'
          ? 'Ton compte est prêt. Tu peux te connecter.'
          : 'Tu es maintenant connecté.',
    });
    setLoading(false);
    if (mode === 'signin' || data?.session) {
      router.push('/app');
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      toast({
        title: 'Email requis',
        description: 'Renseigne ton email pour réinitialiser ton mot de passe.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({
        title: 'Réinitialisation échouée',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }
    toast({
      title: 'Email envoyé',
      description:
        'Vérifie ta boîte mail pour définir un nouveau mot de passe.',
    });
    setLoading(false);
  };

  return (
    <main>
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-2 pb-20 pt-6 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-16 md:px-6">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-slate-900">
              Se connecter
            </h1>
            <p className="text-sm text-slate-500">
              Accède à ton espace Sparrtners.
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

              {!showRecovery ? (
                <>
                  <form
                    className="space-y-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleEmailPassword('signin');
                    }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
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
                      Se connecter
                    </Button>
                  </form>

                  <div className="space-y-2 text-center text-sm">
                    <button
                      type="button"
                      className="text-slate-500 hover:text-slate-900"
                      onClick={() => setShowRecovery(true)}
                      disabled={loading}
                    >
                      Mot de passe oublié
                    </button>
                    <div className="text-slate-500">
                      Nouveau sur Sparrtners ?{' '}
                      <Link href="/signup" className="text-slate-900 underline">
                        Créer un compte
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2 text-center">
                    <h2 className="text-base font-semibold text-slate-900">
                      Récupération du mot de passe
                    </h2>
                    <p className="text-sm text-slate-500">
                      Entre ton email. Si un compte existe, on t’enverra un lien
                      pour réinitialiser ton mot de passe.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recovery-email">Email</Label>
                    <Input
                      id="recovery-email"
                      name="recovery-email"
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handlePasswordReset}
                    disabled={loading || !email}
                  >
                    Envoyer le lien de récupération
                  </Button>
                  <div className="text-center text-sm">
                    <button
                      type="button"
                      className="text-slate-500 hover:text-slate-900"
                      onClick={() => setShowRecovery(false)}
                      disabled={loading}
                    >
                      Retour à la connexion
                    </button>
                  </div>
                </div>
              )}
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
                className="h-auto w-full  object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
