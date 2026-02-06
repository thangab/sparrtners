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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Eye, MoreVertical } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const [deepLinkTarget, setDeepLinkTarget] = React.useState<{
    kind: 'host' | 'requester' | 'completed';
    sessionId: string;
    reviewedUserId: string;
    reviewedUserName: string;
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
      requestedRows.filter((row) => !row.is_finished && row.is_published),
    [requestedRows],
  );
  const data = React.useMemo(
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
          kind: hostRow.is_finished ? ('completed' as const) : ('host' as const),
          sessionId: reviewSessionId,
          reviewedUserId: reviewUserId,
          reviewedUserName: request.requester?.display_name ?? 'Sportif',
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
        reviewedUserName: 'l’hôte',
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
    if (tabParam === 'requester' || tabParam === 'completed' || tabParam === 'host') {
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

  const columns = React.useMemo(
    () =>
      getSessionRequestsColumns({
        view,
        expanded,
        setExpanded,
        handleDisableSession,
        handleFullChange,
        onReviewComplete: updateRequestedRow,
        actionLoading,
        switchLoading,
      }),
    [
      view,
      expanded,
      handleDisableSession,
      handleFullChange,
      updateRequestedRow,
      actionLoading,
      switchLoading,
    ],
  );

  const table = useReactTable({
    data,
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
  }, [table, view, completedRows]);

  return (
    <div className="space-y-4">
      {deepLinkTarget ? (
        <SessionReviewModal
          key={`${deepLinkTarget.sessionId}:${deepLinkTarget.reviewedUserId}`}
          sessionId={deepLinkTarget.sessionId}
          reviewedUserId={deepLinkTarget.reviewedUserId}
          reviewedUserName={deepLinkTarget.reviewedUserName}
          hideTrigger
          autoOpen={false}
          initialOpen
          alreadyReviewed={false}
        />
      ) : null}
      <Tabs
        value={view}
        onValueChange={(value) => {
          const next = value as 'host' | 'requester' | 'completed';
          setView(next);
          const params = new URLSearchParams(window.location.search);
          params.set('tab', next);
          router.replace(`/app/sessions/requests?${params.toString()}`);
        }}
      >
        <TabsList>
          <TabsTrigger value="host">Mes sessions</TabsTrigger>
          <TabsTrigger value="requester">Mes demandes</TabsTrigger>
          <TabsTrigger value="completed">Sessions terminées</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3 md:hidden">
        {data.length === 0 ? (
          <Card className="px-4 py-8 text-center text-sm text-slate-500">
            Aucune session pour le moment.
          </Card>
        ) : (
          data.map((row) => {
            const sessionLink = `/sessions/${row.id}`;
            const editLink = `/app/sessions/${row.id}/edit`;
            const isFinished = !!row.is_finished;
            return (
              <Card
                key={`${row.kind}-${row.id}`}
                className="space-y-3 p-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-base font-semibold text-slate-900">
                      {row.title}
                    </div>
                    {row.kind === 'host' &&
                    row.requests?.some(
                      (request) => request.can_review && !request.reviewed,
                    ) ? (
                      <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                        Avis à donner
                      </Badge>
                    ) : null}
                    {row.kind === 'requester' &&
                    row.can_review &&
                    !row.reviewed ? (
                      <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                        Avis à donner
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-xs text-slate-500">{row.starts_at}</div>
                  <div className="text-xs text-slate-500">{row.place}</div>
                  {row.kind === 'host' ? (
                    <div className="text-xs text-slate-500">
                      {row.impressions ?? 0} impressions ·{' '}
                      {row.detail_clicks ?? 0} clics
                    </div>
                  ) : null}
                  {!row.is_published ? (
                    <Badge variant="secondary">Session désactivée</Badge>
                  ) : null}
                </div>

                {row.kind === 'requester' ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="outline">{row.status ?? 'pending'}</Badge>
                    <span className="text-slate-500">
                      {row.participant_count ?? 1} participant(s)
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-slate-600">
                    {row.pending_count ?? 0} en attente ·{' '}
                    {row.requests_count ?? 0} total
                  </div>
                )}

                {row.kind === 'host' ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Switch
                      checked={row.is_full ?? false}
                      onCheckedChange={(checked) =>
                        handleFullChange(row.id, checked)
                      }
                      disabled={
                        !row.is_published ||
                        !!switchLoading[row.id] ||
                        isFinished
                      }
                    />
                    <span>Session complète</span>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
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
                      {expanded[row.id] ? 'Masquer' : 'Demandes'}
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
                      reviewedUserName="l’hôte"
                      triggerLabel="Donner mon avis"
                      autoOpen={false}
                      alreadyReviewed={row.reviewed}
                      onReviewed={() =>
                        updateRequestedRow(row.id, { reviewed: true })
                      }
                    />
                  ) : null}
                  {row.kind === 'requester' && row.reviewed ? (
                    <Badge variant="secondary">Avis envoyé</Badge>
                  ) : null}
                  {row.kind === 'host' ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!row.is_published || isFinished}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {row.is_published && !isFinished && (
                          <DropdownMenuItem asChild>
                            <Link href={editLink}>Modifier</Link>
                          </DropdownMenuItem>
                        )}
                        {row.is_published && !isFinished && (
                          <DropdownMenuItem asChild>
                            <Link href={sessionLink}>Voir</Link>
                          </DropdownMenuItem>
                        )}
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
                          Désactiver la session
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
                    />
                  </div>
                ) : null}
              </Card>
            );
          })
        )}
      </div>

      <Card className="hidden overflow-hidden border-slate-200/70 md:block">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Aucune session pour le moment.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr className="border-t border-slate-100 align-top">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-4">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                    {row.original.kind === 'host' &&
                    expanded[row.original.id] ? (
                      <tr className="border-t border-slate-100 bg-slate-50/60">
                        <td colSpan={columns.length} className="px-4 py-4">
                          <SessionRequestsList
                            requests={row.original.requests ?? []}
                            sessionDisabled={
                              !row.original.is_published ||
                              !!row.original.is_finished
                            }
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
