'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManageBillingButton } from '@/components/app/manage-billing-button';
import { DeleteAccountCard } from '@/components/app/delete-account-card';

type AccountSettingsTabsProps = {
  email: string;
  firstname: string;
  lastname: string;
  memberSince: string;
  premium: boolean;
  isLifetime: boolean;
  premiumUntil: string | null;
};

export function AccountSettingsTabs({
  email,
  firstname,
  lastname,
  memberSince,
  premium,
  isLifetime,
  premiumUntil,
}: AccountSettingsTabsProps) {
  return (
    <Tabs defaultValue="info" className="space-y-4">
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-slate-100 p-1.5">
        <TabsTrigger
          value="info"
          className="rounded-xl px-4 py-2 data-[state=active]:bg-white"
        >
          Infos du compte
        </TabsTrigger>
        <TabsTrigger
          value="billing"
          className="rounded-xl px-4 py-2 data-[state=active]:bg-white"
        >
          Abonnement et compte
        </TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="mt-0">
        <Card className="border-slate-200/90">
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg">Informations du compte</CardTitle>
            <p className="text-sm text-slate-600">
              Vérifie tes informations principales et accède rapidement aux
              pages importantes de ton compte.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Nom
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {lastname}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Préom
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {firstname}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Email
                </p>
                <p className="truncate text-sm font-semibold text-slate-900">
                  {email}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Membre depuis
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {memberSince}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Plan
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={premium ? 'default' : 'secondary'}>
                    {premium ? 'PRO' : 'Free'}
                  </Badge>
                  {isLifetime ? (
                    <Badge variant="outline">Lifetime</Badge>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/app/me">Modifier mon profil</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/app/notifications">Mes notifications</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="billing" className="mt-0">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-slate-200/90">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg">Abonnement</CardTitle>
              <p className="text-sm text-slate-600">
                Modifie ton plan, ton moyen de paiement ou annule le
                renouvellement automatique.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={premium ? 'default' : 'secondary'}>
                  {premium ? 'PRO' : 'Free'}
                </Badge>
                {isLifetime ? <Badge variant="outline">Lifetime</Badge> : null}
                {premiumUntil ? (
                  <span className="text-sm text-slate-500">
                    Actif jusqu&apos;au {premiumUntil}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <ManageBillingButton />
                <Button asChild variant="outline">
                  <Link href="/pricing">Voir les offres</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-200 bg-rose-50/30">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg text-rose-900">
                Zone sensible
              </CardTitle>
              <p className="text-sm text-rose-800/90">
                Supprimer ton compte retire définitivement ton profil, tes
                sessions et tes données associées.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <DeleteAccountCard />
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
