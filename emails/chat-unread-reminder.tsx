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

type ChatUnreadReminderEmailProps = {
  senderName: string;
  messagePreview: string;
  chatUrl?: string | null;
};

export function ChatUnreadReminderEmail({
  senderName,
  messagePreview,
  chatUrl,
}: ChatUnreadReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Nouveau message de {senderName}</Preview>
      <Body style={styles.body}>
        <Container style={styles.card}>
          <Text style={styles.brand}>Sparrtners</Text>
          <Heading style={styles.title}>Nouveau message</Heading>
          <Text style={styles.text}>
            Tu as un message de {senderName} qui attend ta réponse.
          </Text>
          <Section style={styles.messageBox}>
            <Text style={styles.messageText}>{messagePreview}</Text>
          </Section>
          {chatUrl ? (
            <Section style={styles.buttonRow}>
              <a href={chatUrl} style={styles.button}>
                Ouvrir le chat
              </a>
            </Section>
          ) : null}
          <Text style={styles.helper}>
            Connecte-toi à l’app pour répondre.
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
  messageBox: {
    backgroundColor: '#f1f5f9',
    padding: '12px 16px',
    borderRadius: '10px',
    marginBottom: '16px',
  },
  messageText: {
    margin: 0,
    fontSize: '14px',
    color: '#0f172a',
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
