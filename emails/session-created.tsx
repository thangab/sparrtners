import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

type SessionCreatedEmailProps = {
  trainingType: string;
  sessionUrl?: string | null;
  startsAt?: string | null;
  place?: string | null;
  disciplines?: string[];
  capacity?: number | null;
  durationMinutes?: number | null;
  profile?: {
    weightMin?: number | null;
    weightMax?: number | null;
    heightMin?: number | null;
    heightMax?: number | null;
    dominantHand?: string | null;
    gloveSize?: string | null;
  };
};

export function SessionCreatedEmail({
  trainingType,
  sessionUrl,
  startsAt,
  place,
  disciplines,
  capacity,
  durationMinutes,
  profile,
}: SessionCreatedEmailProps) {
  const hasProfile =
    profile &&
    (profile.weightMin ||
      profile.weightMax ||
      profile.heightMin ||
      profile.heightMax ||
      profile.dominantHand ||
      profile.gloveSize);
  const dominantLabel =
    profile?.dominantHand === 'right'
      ? 'Droitier'
      : profile?.dominantHand === 'left'
        ? 'Gaucher'
        : profile?.dominantHand === 'both'
          ? 'Ambidextre'
          : null;
  return (
    <Html>
      <Head />
      <Preview>Nouvelle session créée · {trainingType}</Preview>
      <Body style={styles.body}>
        <Container style={styles.card}>
          <Text style={styles.brand}>Sparrtners</Text>
          <Heading style={styles.title}>Session de {trainingType}</Heading>
          <Text style={styles.text}>Ta session est bien créée et publiée.</Text>
          <Section style={styles.sessionBox}>
            {startsAt ? (
              <Text style={styles.sessionMeta}>Date · {startsAt}</Text>
            ) : null}
            {place ? (
              <Text style={styles.sessionMeta}>Lieu · {place}</Text>
            ) : null}
            {durationMinutes ? (
              <Text style={styles.sessionMeta}>
                Durée · {durationMinutes} min
              </Text>
            ) : null}
            {capacity ? (
              <Text style={styles.sessionMeta}>Capacité · {capacity}</Text>
            ) : null}
          </Section>
          {disciplines && disciplines.length > 0 ? (
            <Section style={styles.sessionBox}>
              <Text style={styles.sectionTitle}>Disciplines</Text>
              {disciplines.map((item) => (
                <Text key={item} style={styles.listItem}>
                  • {item}
                </Text>
              ))}
            </Section>
          ) : null}
          {hasProfile ? (
            <Section style={styles.sessionBox}>
              <Text style={styles.sectionTitle}>Profil recherché</Text>
              {profile?.weightMin || profile?.weightMax ? (
                <Text style={styles.listItem}>
                  Poids · {profile.weightMin ?? '?'}-{profile.weightMax ?? '?'}{' '}
                  kg
                </Text>
              ) : null}
              {profile?.heightMin || profile?.heightMax ? (
                <Text style={styles.listItem}>
                  Taille · {profile.heightMin ?? '?'}-{profile.heightMax ?? '?'}{' '}
                  cm
                </Text>
              ) : null}
              {dominantLabel ? (
                <Text style={styles.listItem}>
                  Main forte · {dominantLabel}
                </Text>
              ) : null}
              {profile?.gloveSize ? (
                <Text style={styles.listItem}>Gants · {profile.gloveSize}</Text>
              ) : null}
            </Section>
          ) : null}
          {sessionUrl ? (
            <Section style={styles.buttonRow}>
              <a href={sessionUrl} style={styles.button}>
                Voir ta session
              </a>
            </Section>
          ) : null}
          <Text style={styles.helper}>
            Tu peux la retrouver dans ton espace “Mes sessions”.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#f8fafc',
    fontFamily: 'Arial, sans-serif',
    padding: '24px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    maxWidth: '520px',
    margin: '0 auto',
  },
  brand: {
    fontSize: '12px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: '8px',
  },
  title: {
    margin: '0 0 12px',
    fontSize: '20px',
    color: '#0f172a',
  },
  text: {
    margin: '0 0 16px',
    fontSize: '14px',
    color: '#334155',
  },
  sessionBox: {
    backgroundColor: '#f1f5f9',
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '16px',
  },
  sessionTitle: {
    margin: 0,
    fontSize: '14px',
    color: '#0f172a',
    fontWeight: 600,
  },
  sessionMeta: {
    margin: '6px 0 0',
    fontSize: '12px',
    color: '#64748b',
  },
  sectionTitle: {
    margin: '0 0 6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  listItem: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: '#334155',
  },
  buttonRow: {
    marginBottom: '16px',
  },
  button: {
    display: 'inline-block',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    textDecoration: 'none',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 600,
  },
  helper: {
    margin: 0,
    fontSize: '12px',
    color: '#94a3b8',
  },
};
