'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { SessionRequestsList } from '@/components/app/session-requests-list';
import {
  SessionRequestsTableProps,
  SessionTableRow,
} from '@/components/app/session-requests-types';
import { getSessionRequestsColumns } from '@/components/app/session-requests-columns';
import { OpenChatButton } from '@/components/app/open-chat-button';
import { SessionReviewModal } from '@/components/app/session-review-modal';
import {
  Eye,
  Filter,
  Search,
  CalendarClock,
  MapPin,
  Users,
  Activity,
  ChevronDown,
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

type QuickFilter = 'all' | 'attention' | 'reviews' | 'inactive';

function getRequesterStatusTone(status?: string | null) {
  if (status === 'canceled' || status === 'withdrawn') {
    return 'border-slate-300 bg-slate-100 text-slate-700';
  }
  if (status === 'accepted') {
    return 'border-emerald-200 bg-emerald-50/70 text-emerald-700';
  }
  if (status === 'declined') {
    return 'border-rose-200 bg-rose-50/70 text-rose-700';
  }
  return 'border-orange-200 bg-orange-50/80 text-orange-700';
}

export function SessionRequestsTable({
  created,
  requested,
  completed,
}: SessionRequestsTableProps) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const { toast } = useToast();
  const [view, setView] = React.useState<'host' | 'requester' | 'completed'>(
    'host',
  );
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [createdRows, setCreatedRows] =
    React.useState<SessionTableRow[]>(created);
  const [requestedRows, setRequestedRows] =
    React.useState<SessionTableRow[]>(requested);
  const [completedRows, setCompletedRows] =
    React.useState<SessionTableRow[]>(completed);
  const [actionLoading, setActionLoading] = React.useState<
    Record<string, boolean>
  >({});
  const [switchLoading, setSwitchLoading] = React.useState<
    Record<string, boolean>
  >({});
  const [cancelLoading, setCancelLoading] = React.useState<
    Record<string, boolean>
  >({});
  const [searchQuery, setSearchQuery] = React.useState('');
  const [quickFilter, setQuickFilter] = React.useState<QuickFilter>('all');

  const searchParams = useSearchParams();
  const router = useRouter();
  const [deepLinkTarget, setDeepLinkTarget] = React.useState<{
    kind: 'host' | 'requester' | 'completed';
    sessionId: string;
    reviewedUserId: string;
    reviewedUserName: string;
    sessionTitle: string;
    sessionPlace: string;
    sessionStartsAt: string;
  } | null>(null);

  const reviewSessionId = searchParams.get('session_id') ?? '';
  const reviewUserId = searchParams.get('reviewed_user_id') ?? '';
  const reviewParam = searchParams.get('review');
  const tabParam = searchParams.get('tab');
  const hasReviewParams =
    reviewParam === '1' && reviewSessionId && reviewUserId;

  React.useEffect(() => {
    setCreatedRows(created);
  }, [created]);

  React.useEffect(() => {
    setRequestedRows(requested);
  }, [requested]);

  React.useEffect(() => {
    setCompletedRows(completed);
  }, [completed]);

  const hostRows = React.useMemo(
    () => createdRows.filter((row) => !row.is_finished && row.is_published),
    [createdRows],
  );
  const requesterRows = React.useMemo(
    () =>
      requestedRows.filter(
        (row) =>
          !row.is_finished &&
          row.is_published &&
          ['pending', 'accepted'].includes((row.status ?? '').toLowerCase()),
      ),
    [requestedRows],
  );
  const allRowsForView = React.useMemo(
    () =>
      view === 'host'
        ? hostRows
        : view === 'requester'
          ? requesterRows
          : completedRows,
    [view, hostRows, requesterRows, completedRows],
  );

  const reviewTarget = React.useMemo(() => {
    if (!reviewParam || reviewParam !== '1') return null;
    if (!reviewSessionId || !reviewUserId) return null;

    const hostRow = createdRows.find((row) => row.id === reviewSessionId);
    if (hostRow?.requests) {
      const request = hostRow.requests.find(
        (item) => item.user_id === reviewUserId,
      );
      if (request) {
        return {
          kind: hostRow.is_finished
            ? ('completed' as const)
            : ('host' as const),
          sessionId: reviewSessionId,
          reviewedUserId: reviewUserId,
          reviewedUserName: request.requester?.display_name ?? 'Sportif',
          sessionTitle: hostRow.title,
          sessionPlace: hostRow.place,
          sessionStartsAt: hostRow.starts_at,
        };
      }
    }

    const requesterRow = requestedRows.find(
      (row) => row.id === reviewSessionId && row.host_id === reviewUserId,
    );
    if (requesterRow) {
      return {
        kind: requesterRow.is_finished
          ? ('completed' as const)
          : ('requester' as const),
        sessionId: reviewSessionId,
        reviewedUserId: reviewUserId,
        reviewedUserName: requesterRow.host_display_name ?? 'l’hôte',
        sessionTitle: requesterRow.title,
        sessionPlace: requesterRow.place,
        sessionStartsAt: requesterRow.starts_at,
      };
    }

    return null;
  }, [createdRows, requestedRows, reviewParam, reviewSessionId, reviewUserId]);

  React.useEffect(() => {
    if (!reviewTarget) return;
    setDeepLinkTarget(reviewTarget);
    if (!hasReviewParams) return;
    const params = new URLSearchParams(window.location.search);
    params.delete('review');
    params.delete('session_id');
    params.delete('reviewed_user_id');
    const next = params.toString();
    const url = next
      ? `${window.location.pathname}?${next}`
      : window.location.pathname;
    window.history.replaceState({}, '', url);
  }, [reviewTarget, hasReviewParams]);

  React.useEffect(() => {
    if (!tabParam) return;
    if (
      tabParam === 'requester' ||
      tabParam === 'completed' ||
      tabParam === 'host'
    ) {
      setView(tabParam);
    }
  }, [tabParam]);

  React.useEffect(() => {
    if (!deepLinkTarget) return;
    setView(deepLinkTarget.kind);
    if (deepLinkTarget.kind === 'host') {
      setExpanded((current) => ({
        ...current,
        [deepLinkTarget.sessionId]: true,
      }));
      return;
    }
    if (deepLinkTarget.kind === 'completed') {
      const targetRow = completedRows.find(
        (row) => row.id === deepLinkTarget.sessionId,
      );
      if (targetRow?.kind === 'host') {
        setExpanded((current) => ({
          ...current,
          [deepLinkTarget.sessionId]: true,
        }));
      }
    }
  }, [deepLinkTarget, completedRows]);

  const updateCreatedRow = React.useCallback(
    (id: string, patch: Partial<SessionTableRow>) => {
      setCreatedRows((current) =>
        current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
      );
    },
    [],
  );

  const updateRequestedRow = React.useCallback(
    (id: string, patch: Partial<SessionTableRow>) => {
      setRequestedRows((current) =>
        current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
      );
    },
    [],
  );

  const markReviewAsSent = React.useCallback(
    (sessionId: string, reviewedUserId: string) => {
      setRequestedRows((current) =>
        current.map((row) =>
          row.id === sessionId && row.host_id === reviewedUserId
            ? { ...row, reviewed: true }
            : row,
        ),
      );

      setCreatedRows((current) =>
        current.map((row) => {
          if (row.id !== sessionId) return row;
          if (!row.requests || row.requests.length === 0) return row;
          return {
            ...row,
            requests: row.requests.map((request) =>
              request.user_id === reviewedUserId
                ? { ...request, reviewed: true }
                : request,
            ),
          };
        }),
      );

      setCompletedRows((current) =>
        current.map((row) => {
          if (row.id !== sessionId) return row;

          if (row.kind === 'requester' && row.host_id === reviewedUserId) {
            return { ...row, reviewed: true };
          }

          if (row.kind === 'host' && row.requests && row.requests.length > 0) {
            return {
              ...row,
              requests: row.requests.map((request) =>
                request.user_id === reviewedUserId
                  ? { ...request, reviewed: true }
                  : request,
              ),
            };
          }

          return row;
        }),
      );
    },
    [],
  );

  const handleDisableSession = React.useCallback(
    async (sessionId: string) => {
      setActionLoading((current) => ({ ...current, [sessionId]: true }));
      const { error } = await supabase
        .from('sessions')
        .update({ is_published: false })
        .eq('id', sessionId);
      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        setActionLoading((current) => ({ ...current, [sessionId]: false }));
        return;
      }
      updateCreatedRow(sessionId, { is_published: false });
      toast({
        title: 'Session désactivée',
        description: "Elle n'apparaît plus dans la recherche.",
      });
      setActionLoading((current) => ({ ...current, [sessionId]: false }));
    },
    [supabase, toast, updateCreatedRow],
  );

  const handleFullChange = React.useCallback(
    async (sessionId: string, checked: boolean) => {
      setSwitchLoading((current) => ({ ...current, [sessionId]: true }));
      const { error } = await supabase
        .from('sessions')
        .update({ is_full: checked })
        .eq('id', sessionId);
      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        setSwitchLoading((current) => ({ ...current, [sessionId]: false }));
        return;
      }
      updateCreatedRow(sessionId, { is_full: checked });
      toast({
        title: checked ? 'Session complète' : 'Session ouverte',
        description: checked
          ? 'Les demandes sont bloquées.'
          : 'Les demandes sont réouvertes.',
      });
      setSwitchLoading((current) => ({ ...current, [sessionId]: false }));
    },
    [supabase, toast, updateCreatedRow],
  );

  const handleCancelRequest = React.useCallback(
    async (sessionId: string) => {
      setCancelLoading((current) => ({ ...current, [sessionId]: true }));
      const targetRow = requestedRows.find((row) => row.id === sessionId);
      const wasAccepted =
        (targetRow?.status ?? '').toLowerCase() === 'accepted';
      const { error } = await supabase.rpc('cancel_my_session_request', {
        p_session_id: sessionId,
        p_reason: null,
      });
      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        setCancelLoading((current) => ({ ...current, [sessionId]: false }));
        return;
      }

      let completedRow: SessionTableRow | null = null;
      setRequestedRows((current) =>
        current.map((row) => {
          if (row.id !== sessionId) return row;
          completedRow = { ...row, status: 'withdrawn' };
          return completedRow;
        }),
      );
      if (completedRow) {
        setCompletedRows((current) => [
          completedRow as SessionTableRow,
          ...current.filter(
            (row) =>
              !(
                row.id === (completedRow as SessionTableRow).id &&
                row.kind === (completedRow as SessionTableRow).kind
              ),
          ),
        ]);
      }

      toast({
        title: 'Demande annulée',
        description: 'Ta participation a bien été retirée.',
      });
      if (targetRow?.request_id) {
        try {
          await fetch('/api/notifications/session-request-withdrawn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestId: targetRow.request_id,
              sendEmail: wasAccepted,
            }),
          });
        } catch (mailError) {
          console.warn('Session request withdrawn notification failed', mailError);
        }
      }
      setCancelLoading((current) => ({ ...current, [sessionId]: false }));
    },
    [requestedRows, supabase, toast],
  );

  const viewCounts = React.useMemo(
    () => ({
      host: hostRows.length,
      requester: requesterRows.length,
      completed: completedRows.length,
    }),
    [hostRows.length, requesterRows.length, completedRows.length],
  );

  const attentionCount = React.useMemo(
    () =>
      allRowsForView.filter((row) => {
        if (row.kind === 'host') {
          const pending = (row.pending_count ?? 0) > 0;
          const reviewNeeded =
            row.requests?.some(
              (request) => request.can_review && !request.reviewed,
            ) ?? false;
          return pending || reviewNeeded;
        }
        if (row.kind === 'requester') {
          return row.status === 'pending' || (row.can_review && !row.reviewed);
        }
        return false;
      }).length,
    [allRowsForView],
  );

  const reviewCount = React.useMemo(
    () =>
      allRowsForView.filter((row) => {
        if (row.kind === 'requester') return !!row.can_review && !row.reviewed;
        if (row.kind === 'host') {
          return (
            row.requests?.some(
              (request) => request.can_review && !request.reviewed,
            ) ?? false
          );
        }
        return false;
      }).length,
    [allRowsForView],
  );

  const inactiveCount = React.useMemo(
    () => allRowsForView.filter((row) => !row.is_published).length,
    [allRowsForView],
  );

  const filteredData = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allRowsForView.filter((row) => {
      const matchFilter =
        quickFilter === 'all'
          ? true
          : quickFilter === 'inactive'
            ? !row.is_published
            : quickFilter === 'reviews'
              ? row.kind === 'requester'
                ? !!row.can_review && !row.reviewed
                : (row.requests?.some(
                    (request) => request.can_review && !request.reviewed,
                  ) ?? false)
              : row.kind === 'host'
                ? (row.pending_count ?? 0) > 0 ||
                  (row.requests?.some(
                    (request) => request.can_review && !request.reviewed,
                  ) ??
                    false)
                : row.status === 'pending' || (row.can_review && !row.reviewed);

      const matchQuery =
        !query ||
        row.title.toLowerCase().includes(query) ||
        row.place.toLowerCase().includes(query);

      return matchFilter && matchQuery;
    });
  }, [allRowsForView, quickFilter, searchQuery]);

  const columns = React.useMemo(
    () =>
      getSessionRequestsColumns({
        view,
        expanded,
        setExpanded,
        handleDisableSession,
        handleCancelRequest,
        handleFullChange,
        onReviewComplete: (sessionId, patch) => {
          if (patch.reviewed !== true) {
            updateRequestedRow(sessionId, patch);
            return;
          }
          const target = requestedRows.find((row) => row.id === sessionId);
          if (!target?.host_id) {
            updateRequestedRow(sessionId, patch);
            return;
          }
          markReviewAsSent(sessionId, target.host_id);
        },
        actionLoading,
        switchLoading,
        cancelLoading,
      }),
    [
      view,
      expanded,
      handleDisableSession,
      handleCancelRequest,
      handleFullChange,
      updateRequestedRow,
      requestedRows,
      markReviewAsSent,
      actionLoading,
      switchLoading,
      cancelLoading,
    ],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getRowId: (row) => `${row.kind}-${row.id}`,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  React.useEffect(() => {
    table.setPageIndex(0);
    if (view === 'completed') {
      const nextExpanded: Record<string, boolean> = {};
      completedRows.forEach((row) => {
        if (row.kind !== 'host') return;
        const hasPendingReview =
          row.requests?.some(
            (request) => request.can_review && !request.reviewed,
          ) ?? false;
        if (hasPendingReview) {
          nextExpanded[row.id] = true;
        }
      });
      setExpanded(nextExpanded);
    } else {
      setExpanded({});
    }
  }, [table, view, completedRows, searchQuery, quickFilter]);

  const filterItems: Array<{ key: QuickFilter; label: string; count: number }> =
    [
      { key: 'all', label: 'Tout', count: allRowsForView.length },
      { key: 'attention', label: 'À traiter', count: attentionCount },
      { key: 'reviews', label: 'Avis à donner', count: reviewCount },
      { key: 'inactive', label: 'Désactivées', count: inactiveCount },
    ];

  const handleViewChange = (next: 'host' | 'requester' | 'completed') => {
    setView(next);
    setQuickFilter('all');
    const params = new URLSearchParams(window.location.search);
    params.set('tab', next);
    router.replace(`/app/sessions/requests?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-full space-y-5 overflow-x-hidden">
      {deepLinkTarget ? (
        <SessionReviewModal
          key={`${deepLinkTarget.sessionId}:${deepLinkTarget.reviewedUserId}`}
          sessionId={deepLinkTarget.sessionId}
          reviewedUserId={deepLinkTarget.reviewedUserId}
          reviewedUserName={deepLinkTarget.reviewedUserName}
          sessionTitle={deepLinkTarget.sessionTitle}
          sessionPlace={deepLinkTarget.sessionPlace}
          sessionStartsAt={deepLinkTarget.sessionStartsAt}
          hideTrigger
          autoOpen={false}
          initialOpen
          alreadyReviewed={false}
          onReviewed={() => {
            markReviewAsSent(
              deepLinkTarget.sessionId,
              deepLinkTarget.reviewedUserId,
            );
            setDeepLinkTarget(null);
          }}
        />
      ) : null}

      <section className="w-full max-w-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3">
          <div className="-mx-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
            <div className="flex min-w-0 gap-2 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5 sm:grid sm:grid-cols-3 sm:gap-2">
            <button
              type="button"
              onClick={() => handleViewChange('host')}
              className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-center text-sm font-semibold transition sm:min-w-0 sm:whitespace-normal ${
                view === 'host'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white/70'
              }`}
            >
              Mes sessions
              <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                {viewCounts.host}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('requester')}
              className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-center text-sm font-semibold transition sm:min-w-0 sm:whitespace-normal ${
                view === 'requester'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white/70'
              }`}
            >
              Mes demandes
              <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                {viewCounts.requester}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('completed')}
              className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-center text-sm font-semibold transition sm:min-w-0 sm:whitespace-normal ${
                view === 'completed'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:bg-white/70'
              }`}
            >
              Terminées
              <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                {viewCounts.completed}
              </span>
            </button>
            </div>
          </div>

          <div className="grid min-w-0 gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-9"
                placeholder="Rechercher une session ou un lieu"
              />
            </div>
            <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
                <Filter className="h-3.5 w-3.5" />
                Filtres
              </span>
              {filterItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setQuickFilter(item.key)}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    quickFilter === item.key
                      ? 'border-orange-600 bg-orange-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="w-full max-w-full space-y-3 md:hidden">
        {filteredData.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            Aucun résultat pour ce filtre.
          </Card>
        ) : (
          filteredData.map((row) => {
            const sessionLink = `/sessions/${row.id}`;
            const editLink = `/app/sessions/${row.id}/edit`;
            const isFinished = !!row.is_finished;
            const hostNeedsReview =
              row.requests?.some(
                (request) => request.can_review && !request.reviewed,
              ) ?? false;
            const showAttention =
              row.kind === 'host'
                ? hostNeedsReview || (row.pending_count ?? 0) > 0
                : row.can_review && !row.reviewed;

            return (
              <Card
                key={`${row.kind}-${row.id}`}
                className="w-full max-w-full space-y-3 rounded-2xl border-slate-200/80 p-4 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-slate-300 bg-white text-slate-700"
                      >
                        {row.kind === 'host' ? 'Hôte' : 'Demandeur'}
                      </Badge>
                      <p className="min-w-0 wrap-break-word text-base font-semibold text-slate-900">
                        {row.title}
                      </p>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{row.starts_at}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span className="min-w-0 wrap-break-word">
                          {row.place}
                        </span>
                      </div>
                      {row.kind === 'host' ? (
                        <div className="flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {row.impressions ?? 0} impressions ·{' '}
                            {row.detail_clicks ?? 0} clics
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {row.participant_count ?? 1} participant(s)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    {showAttention ? (
                      <Badge className="bg-orange-100 text-orange-900 hover:bg-orange-100">
                        Action requise
                      </Badge>
                    ) : null}
                    {!row.is_published ? (
                      <Badge variant="secondary">Désactivée</Badge>
                    ) : null}
                    {row.kind !== 'host' ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className={`rounded-full border px-2 py-0.5 font-medium ${getRequesterStatusTone(
                            row.status,
                          )}`}
                        >
                          {row.status ?? 'pending'}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {row.kind === 'host' ? (
                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-sm">
                      <Badge
                        variant="outline"
                        className={
                          row.is_full
                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }
                      >
                        {row.is_full ? 'Demandes fermées' : 'Demandes ouvertes'}
                      </Badge>
                      <Button
                        size="sm"
                        variant={row.is_full ? 'outline' : 'default'}
                        className={
                          row.is_full
                            ? ''
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }
                        onClick={() =>
                          handleFullChange(row.id, !(row.is_full ?? false))
                        }
                        disabled={
                          !row.is_published ||
                          !!switchLoading[row.id] ||
                          isFinished
                        }
                      >
                        {row.is_full ? 'Rouvrir' : 'Fermer'}
                      </Button>
                    </div>
                  ) : null}

                  <div className="flex min-w-0 flex-wrap gap-2">
                    {row.kind === 'host' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setExpanded((current) => ({
                            ...current,
                            [row.id]: !current[row.id],
                          }))
                        }
                        disabled={
                          !row.requests ||
                          row.requests.length === 0 ||
                          !row.is_published
                        }
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        {expanded[row.id]
                          ? 'Masquer demandes'
                          : 'Voir demandes'}
                      </Button>
                    ) : null}

                    {row.kind === 'requester' &&
                    row.status === 'accepted' &&
                    row.is_published &&
                    row.host_id &&
                    !isFinished ? (
                      <OpenChatButton
                        sessionId={row.id}
                        otherUserId={row.host_id}
                        conversationId={row.conversation_id}
                      />
                    ) : null}

                    {row.kind === 'requester' &&
                    row.can_review &&
                    !row.reviewed &&
                    row.host_id ? (
                      <SessionReviewModal
                        sessionId={row.id}
                        reviewedUserId={row.host_id}
                        reviewedUserName={row.host_display_name ?? 'l’hôte'}
                        sessionTitle={row.title}
                        sessionPlace={row.place}
                        sessionStartsAt={row.starts_at}
                        triggerLabel="Donner mon avis"
                        autoOpen={false}
                        alreadyReviewed={row.reviewed}
                        onReviewed={() => {
                          if (!row.host_id) return;
                          markReviewAsSent(row.id, row.host_id);
                        }}
                      />
                    ) : null}

                    {row.kind === 'requester' && row.reviewed ? (
                      <Badge variant="secondary">Avis envoyé</Badge>
                    ) : null}
                    {row.kind === 'requester' &&
                    ['pending', 'accepted'].includes(
                      (row.status ?? '').toLowerCase(),
                    ) &&
                    !isFinished ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelRequest(row.id)}
                        disabled={!!cancelLoading[row.id]}
                      >
                        {(row.status ?? '').toLowerCase() === 'accepted'
                          ? 'Quitter la session'
                          : 'Annuler ma demande'}
                      </Button>
                    ) : null}

                    {row.kind === 'host' ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!row.is_published || isFinished}
                          >
                            Options
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {row.is_published && !isFinished ? (
                            <DropdownMenuItem asChild>
                              <Link href={editLink}>Modifier</Link>
                            </DropdownMenuItem>
                          ) : null}
                          {row.is_published && !isFinished ? (
                            <DropdownMenuItem asChild>
                              <Link href={sessionLink}>Voir</Link>
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={(event) => {
                              event.preventDefault();
                              handleDisableSession(row.id);
                            }}
                            disabled={
                              actionLoading[row.id] ||
                              !row.is_published ||
                              isFinished
                            }
                          >
                            Désactiver
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>

                  {row.kind === 'host' && expanded[row.id] ? (
                    <div className="pt-2">
                      <SessionRequestsList
                        requests={row.requests ?? []}
                        sessionDisabled={!row.is_published || isFinished}
                        sessionTitle={row.title}
                        sessionPlace={row.place}
                        sessionStartsAt={row.starts_at}
                      />
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Card className="hidden overflow-hidden rounded-3xl border border-slate-200/80 md:block">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-5 py-3">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Aucun résultat pour ce filtre.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr className="border-t border-slate-100 align-top hover:bg-slate-50/60">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-5 py-4">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                    {row.original.kind === 'host' &&
                    expanded[row.original.id] ? (
                      <tr className="border-t border-slate-100 bg-slate-50/70">
                        <td colSpan={columns.length} className="px-5 py-4">
                          <SessionRequestsList
                            requests={row.original.requests ?? []}
                            sessionDisabled={
                              !row.original.is_published ||
                              !!row.original.is_finished
                            }
                            sessionTitle={row.original.title}
                            sessionPlace={row.original.place}
                            sessionStartsAt={row.original.starts_at}
                          />
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="text-slate-500">
          Page {table.getState().pagination.pageIndex + 1} sur{' '}
          {table.getPageCount()}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Précédent
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
