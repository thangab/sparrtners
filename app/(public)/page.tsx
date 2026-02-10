import Image from 'next/image';
import { HomeSearchForm } from '@/components/app/home-search-form';
import { PricingSection } from '@/components/app/pricing-section';
import {
  ArrowRight,
  CalendarClock,
  Dumbbell,
  Flame,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react';

const steps = [
  {
    id: '01',
    icon: UserRound,
    title: 'Profil ultra-ciblé',
    description:
      'Renseigne disciplines, niveau, gabarit et préférences pour matcher avec les bons partenaires dès la première recherche.',
  },
  {
    id: '02',
    icon: MapPin,
    title: 'Sessions proches et pertinentes',
    description:
      'Filtre par zone, créneau, type de session et niveau. Tu vois uniquement ce qui correspond à ton rythme.',
  },
  {
    id: '03',
    icon: MessageCircle,
    title: 'Organisation instantanée',
    description:
      'Validation des demandes, chat intégré, suivi des disponibilités: tout se passe dans un seul flux clair.',
  },
  {
    id: '04',
    icon: Dumbbell,
    title: 'Progression continue',
    description:
      'Répète, ajuste, progresse. Sparrtners te permet de construire une routine d’entraînement durable.',
  },
];

const spotlightSessions = [
  {
    title: 'Session de sparring',
    trainingType: 'Sparring',
    host: 'Yanis M.',
    date: 'Mardi 19:30',
    duration: '90 min',
    location: 'Temple Gym',
    address: 'Paris 11',
    participantsWanted: 2,
    disciplines: [
      { name: 'Boxe anglaise', level: 'Intermédiaire' },
      { name: 'Kickboxing', level: 'Débutant +' },
    ],
  },
  {
    title: 'Session de technique',
    trainingType: 'Technique',
    host: 'Luca R.',
    date: 'Jeudi 20:00',
    duration: '75 min',
    location: 'Fight Club 75',
    address: 'Paris 15',
    participantsWanted: 1,
    disciplines: [
      { name: 'Muay Thai', level: 'Confirmé' },
      { name: 'Lutte', level: 'Intermédiaire' },
      { name: 'MMA', level: 'Intermédiaire' },
    ],
  },
  {
    title: 'Session de cardio',
    trainingType: 'Cardio',
    host: 'Marie L.',
    date: 'Samedi 10:30',
    duration: '60 min',
    location: 'Arena Boxing',
    address: 'Levallois',
    participantsWanted: 4,
    disciplines: [
      { name: 'Boxe anglaise', level: 'Débutant' },
      { name: 'Run', level: 'Tous niveaux' },
    ],
  },
];

const testimonials = [
  {
    name: 'Nora A.',
    role: 'Boxe anglaise · Paris',
    quote:
      'Je trouve mes partenaires en 10 minutes, je confirme, et c’est parti. L’app m’a remis dans une vraie routine.',
  },
  {
    name: 'Sofiane K.',
    role: 'MMA · Boulogne',
    quote:
      'Le fait de filtrer par niveau et discipline évite les mauvaises surprises. Tout est beaucoup plus sérieux.',
  },
  {
    name: 'Camille R.',
    role: 'Kickboxing · Vincennes',
    quote:
      'Le chat intégré change tout. On cale les détails rapidement et les sessions sont bien plus fluides à organiser.',
  },
];

const faqItems = [
  'Que contient exactement l’offre PRO ?',
  'Puis-je annuler mon abonnement quand je veux ?',
  'Puis-je utiliser Sparrtners sur mobile ?',
  'Comment fonctionne l’offre PRO à vie ?',
  'Puis-je changer de formule en cours de route ?',
];

export default async function HomePage({
  searchParams,
}: {
  searchParams?:
    | { [key: string]: string | string[] | undefined }
    | Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const defaultLabel =
    typeof resolvedSearchParams?.place_label === 'string'
      ? resolvedSearchParams.place_label
      : '';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7ed_0,#f8fafc_40%,#eef2ff_100%)] text-slate-900">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 pb-20 pt-8 md:px-6 md:gap-20">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 px-6 py-8 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.55)] backdrop-blur md:px-10 md:py-12">
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-orange-200/50 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-22.5 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
                  Trouve ton
                  <br />
                  <span className="text-orange-600 italic">
                    sparring partenaire
                  </span>
                  <br />
                  dans le bon cadre.
                </h1>
                <p className="max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
                  Sparrtners connecte des sportifs compatibles selon le niveau,
                  la discipline, le lieu et le créneau pour organiser des
                  sessions sérieuses, régulières et efficaces.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="/find-sessions"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Explorer les sessions
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-3">
                {[
                  {
                    icon: ShieldCheck,
                    label: 'Profils fiables',
                    value: 'Contrôle qualité avant session',
                  },
                  {
                    icon: MapPin,
                    label: 'Local',
                    value: 'Trouve autour de toi',
                  },
                  {
                    icon: MessageCircle,
                    label: 'Rapide',
                    value: 'Chat intégré pour valider',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-200/70 bg-white/90 p-3"
                    >
                      <div className="mb-2 inline-flex rounded-lg bg-slate-100 p-2 text-slate-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="font-semibold text-slate-900">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-600">{item.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <Image
              src="/hero-sparring-v2.webp"
              alt="Illustration d'une session de sparring"
              width={900}
              height={700}
              className="h-95 w-full object-cover object-center"
              priority
            />
          </div>
        </section>

        <div className="sticky top-20 z-30">
          <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-2 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.5)] backdrop-blur">
            <HomeSearchForm defaultLabel={defaultLabel} />
          </div>
        </div>

        <section className="space-y-7">
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Comment ça marche
            </p>
            <h2 className="text-3xl font-black text-slate-950 md:text-5xl">
              Un process clair, du profil à la session
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.id}
                  className="group rounded-2xl border border-slate-200/80 bg-white/85 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-4xl font-black text-slate-200 transition group-hover:text-orange-200">
                      {step.id}
                    </span>
                    <span className="rounded-xl bg-orange-100 p-2 text-orange-600">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Exemples concrets
              </p>
              <h2 className="text-3xl font-black text-slate-950 md:text-4xl">
                Sessions en ce moment
              </h2>
            </div>
            <a
              href="/find-sessions"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 underline underline-offset-4"
            >
              Voir toutes les sessions
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {spotlightSessions.map((session) => (
              <article
                key={session.title + session.host}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                    {session.title}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {session.trainingType}
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-900">
                  Host: {session.host}
                </p>

                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-slate-500" />
                    <span>
                      {session.date} · {session.duration}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <span>
                      <span className="font-medium">{session.location}</span>
                      <span className="text-slate-500">
                        {' '}
                        · {session.address}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-500" />
                    <span>
                      Recherche {session.participantsWanted} participant
                      {session.participantsWanted > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {session.disciplines.map((discipline) => (
                    <span
                      key={`${session.host}-${discipline.name}-${discipline.level}`}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                    >
                      {discipline.name} · {discipline.level}
                    </span>
                  ))}
                </div>

                <a
                  href="/find-sessions"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  <Flame className="h-4 w-4" />
                  Rejoindre
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Avis membres
            </p>
            <h2 className="text-3xl font-black text-slate-950 md:text-4xl">
              Ils s&apos;entraînent déjà avec Sparrtners
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <article
                key={item.name}
                className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm"
              >
                <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {item.role}
                </div>
                <p className="text-sm leading-relaxed text-slate-700">
                  “{item.quote}”
                </p>
                <p className="mt-4 text-sm font-bold text-slate-900">
                  {item.name}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-8 rounded-3xl border border-slate-200/70 bg-white/90 p-5 md:p-8">
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Abonnement
            </p>
            <h2 className="text-3xl font-black leading-tight text-orange-600 md:text-5xl">
              Passe en PRO et accélère
              <br />
              ton organisation
            </h2>
          </div>
          <PricingSection />
        </section>

        <section className="mx-auto w-full max-w-3xl space-y-4 rounded-3xl border border-slate-200/70 bg-white/90 p-6 md:p-8">
          <h2 className="text-center text-2xl font-black text-slate-900">
            Questions fréquentes
          </h2>
          <div className="space-y-2">
            {faqItems.map((item) => (
              <details
                key={item}
                className="group rounded-xl border border-slate-200 px-4 py-3"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-800">
                  {item}
                  <span className="text-lg text-indigo-600 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm text-slate-600">
                  Réponse en préparation. Écris-nous et on te répond rapidement.
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
