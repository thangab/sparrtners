'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function ResetPasswordPage() {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const { toast } = useToast();
  const router = useRouter();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password || password.length < 8) {
      toast({
        title: 'Mot de passe invalide',
        description: 'Utilise au moins 8 caractères.',
        variant: 'destructive',
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: 'Confirmation invalide',
        description: 'Les mots de passe ne correspondent pas.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({
        title: 'Mise à jour échouée',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }
    toast({
      title: 'Mot de passe mis à jour',
      description: 'Tu peux maintenant te reconnecter.',
    });
    setLoading(false);
    router.push('/app/me');
  };

  return (
    <main>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-2 pb-20 pt-6 md:px-6">
        <div>
          <h1 className="text-3xl font-semibold">Nouveau mot de passe</h1>
          <p className="text-muted-foreground">
            Choisis un nouveau mot de passe pour ton compte.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Réinitialiser</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleReset}>
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  Confirmer le mot de passe
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={loading}>
                Mettre à jour
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
