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

type SessionReviewReminderEmailProps = {
  trainingType: string;
  reviewUrl?: string | null;
};

export function SessionReviewReminderEmail({
  trainingType,
  reviewUrl,
}: SessionReviewReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Laisser un avis · Session de {trainingType}</Preview>
      <Body style={styles.body}>
        <Container style={styles.card}>
          <Text style={styles.brand}>Sparrtners</Text>
          <Heading style={styles.title}>Session de {trainingType}</Heading>
          <Text style={styles.text}>
            Ta session est terminée. Laisse un avis pour aider la communauté.
          </Text>
          <Section style={styles.sessionBox}>
            <Text style={styles.sessionTitle}>Session de {trainingType}</Text>
          </Section>
          {reviewUrl ? (
            <Section style={styles.buttonRow}>
              <a href={reviewUrl} style={styles.button}>
                Laisser un avis
              </a>
            </Section>
          ) : null}
          <Text style={styles.helper}>
            Tu peux donner ton avis depuis ton espace Mes sessions.
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
  buttonRow: {
    marginBottom: '12px',
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
