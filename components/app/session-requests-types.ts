export type SessionTableRow = {
  id: string;
  kind: 'host' | 'requester';
  title: string;
  starts_at: string;
  starts_at_raw?: string;
  duration_minutes?: number | null;
  is_finished?: boolean;
  place: string;
  impressions?: number | null;
  detail_clicks?: number | null;
  status?: string | null;
  participant_count?: number | null;
  requests_count?: number;
  pending_count?: number;
  is_published: boolean;
  is_full?: boolean;
  host_id?: string | null;
  conversation_id?: string | null;
  can_review?: boolean;
  reviewed?: boolean;
  requests?: Array<{
    id: string;
    session_id: string;
    user_id: string;
    status: string;
    created_at: string;
    participant_count: number;
    conversation_id?: string | null;
    can_review?: boolean;
    reviewed?: boolean;
    requester?: {
      display_name?: string | null;
      avatar_url?: string | null;
    } | null;
  }>;
};

export type SessionRequestsTableProps = {
  created: SessionTableRow[];
  requested: SessionTableRow[];
  completed: SessionTableRow[];
};
