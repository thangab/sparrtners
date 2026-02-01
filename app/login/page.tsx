'use client';

import * as React from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { TopHeader } from '@/components/app/top-header';

export default function LoginPage() {
  const { toast } = useToast();
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = React.useState(false);

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

  const handleEmailOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      toast({
        title: 'Envoi du lien échoué',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    toast({
      title: 'Lien envoyé',
      description: 'Vérifie tes emails pour te connecter.',
    });
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-white via-slate-50 to-slate-100 pt-16">
      <TopHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16">
        <div>
          <h1 className="text-3xl font-semibold">Connexion Sparrtners</h1>
          <p className="text-muted-foreground">
            Accède à ton dashboard et publie des sessions.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Google OAuth</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={handleGoogle}
                disabled={loading}
              >
                Continuer avec Google
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Avec Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="space-y-3" onSubmit={handleEmailOtp}>
                <div className="space-y-2">
                  <Label htmlFor="otp-email">Email</Label>
                  <Input id="otp-email" name="email" type="email" required />
                </div>
                <Button
                  className="w-full"
                  type="submit"
                  variant="secondary"
                  disabled={loading}
                >
                  Envoyer
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
