import { render } from '@react-email/render';
import { SessionRequestStatusEmail } from '@/emails/session-request-status';
import { SessionCreatedEmail } from '@/emails/session-created';
import { SessionRequestReceivedEmail } from '@/emails/session-request-received';
import { SessionHostCalendarInviteEmail } from '@/emails/session-host-calendar-invite';
import { SessionReviewReminderEmail } from '@/emails/session-review-reminder';
import { ChatUnreadReminderEmail } from '@/emails/chat-unread-reminder';

type SessionDecisionStatus = 'accepted' | 'declined';

type SessionRequestStatusEmailArgs = {
  hostName: string;
  trainingType: string;
  startsAt?: string | null;
  durationMinutes?: number | null;
  place?: string | null;
  decision: SessionDecisionStatus;
};

export async function renderSessionRequestStatusEmail({
  hostName,
  trainingType,
  startsAt,
  durationMinutes,
  place,
  decision,
}: SessionRequestStatusEmailArgs) {
  return await render(
    SessionRequestStatusEmail({
      hostName,
      trainingType,
      startsAt,
      durationMinutes,
      place,
      decision,
    }),
  );
}

type SessionCreatedEmailArgs = {
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

export async function renderSessionCreatedEmail({
  trainingType,
  sessionUrl,
  startsAt,
  place,
  disciplines,
  capacity,
  durationMinutes,
  profile,
}: SessionCreatedEmailArgs) {
  return await render(
    SessionCreatedEmail({
      trainingType,
      sessionUrl,
      startsAt,
      place,
      disciplines,
      capacity,
      durationMinutes,
      profile,
    }),
  );
}

type SessionRequestReceivedEmailArgs = {
  requesterName: string;
  trainingType: string;
  sessionsUrl?: string | null;
};

export async function renderSessionRequestReceivedEmail({
  requesterName,
  trainingType,
  sessionsUrl,
}: SessionRequestReceivedEmailArgs) {
  return await render(
    SessionRequestReceivedEmail({
      requesterName,
      trainingType,
      sessionsUrl,
    }),
  );
}

type SessionHostCalendarInviteArgs = {
  trainingType: string;
  startsAt?: string | null;
  durationMinutes?: number | null;
  place?: string | null;
};

export async function renderSessionHostCalendarInviteEmail({
  trainingType,
  startsAt,
  durationMinutes,
  place,
}: SessionHostCalendarInviteArgs) {
  return await render(
    SessionHostCalendarInviteEmail({
      trainingType,
      startsAt,
      durationMinutes,
      place,
    }),
  );
}

type SessionReviewReminderEmailArgs = {
  trainingType: string;
  reviewUrl?: string | null;
};

export async function renderSessionReviewReminderEmail({
  trainingType,
  reviewUrl,
}: SessionReviewReminderEmailArgs) {
  return await render(
    SessionReviewReminderEmail({
      trainingType,
      reviewUrl,
    }),
  );
}

type ChatUnreadReminderEmailArgs = {
  senderName: string;
  messagePreview: string;
  chatUrl?: string | null;
};

export async function renderChatUnreadReminderEmail({
  senderName,
  messagePreview,
  chatUrl,
}: ChatUnreadReminderEmailArgs) {
  return await render(
    ChatUnreadReminderEmail({
      senderName,
      messagePreview,
      chatUrl,
    }),
  );
}
