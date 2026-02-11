'use client';

import * as React from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { OpenChatButton } from '@/components/app/open-chat-button';
import { SessionReviewModal } from '@/components/app/session-review-modal';
import {
  Eye,
  EyeOff,
  CalendarClock,
  MapPin,
  Users,
  Activity,
  ChevronDown,
  CircleHelp,
} from 'lucide-react';
import { SessionTableRow } from '@/components/app/session-requests-types';

type ColumnsOptions = {
  view: 'host' | 'requester' | 'completed';
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleDisableSession: (sessionId: string) => void;
  handleCancelRequest: (sessionId: string) => void;
  handleFullChange: (sessionId: string, checked: boolean) => void;
  onReviewComplete: (
    sessionId: string,
    patch: Partial<SessionTableRow>,
  ) => void;
  actionLoading: Record<string, boolean>;
  switchLoading: Record<string, boolean>;
  cancelLoading: Record<string, boolean>;
};

export function getSessionRequestsColumns({
  view,
  expanded,
  setExpanded,
  handleDisableSession,
  handleCancelRequest,
  handleFullChange,
  onReviewComplete,
  actionLoading,
  switchLoading,
  cancelLoading,
}: ColumnsOptions): ColumnDef<SessionTableRow>[] {
  return [
    {
      accessorKey: 'title',
      header: 'Session',
      cell: ({ row }) => {
        const isHost = row.original.kind === 'host';
        const reviewPending = isHost
          ? row.original.requests?.some(
              (request) => request.can_review && !request.reviewed,
            ) ?? false
          : !!row.original.can_review && !row.original.reviewed;

        return (
          <div className="min-w-[260px] rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-3 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-900">{row.original.title}</p>
              <Badge
                variant="outline"
                className="border-slate-300 bg-white text-slate-600"
              >
                {isHost ? 'Hôte' : 'Demandeur'}
              </Badge>
              {reviewPending ? (
                <Badge className="bg-orange-100 text-orange-900 hover:bg-orange-100">
                  Avis à donner
                </Badge>
              ) : null}
              {!row.original.is_published ? (
                <Badge variant="secondary">Désactivée</Badge>
              ) : null}
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                <span>{row.original.starts_at}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>{row.original.place}</span>
              </div>
              {isHost ? (
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    {row.original.impressions ?? 0} impressions ·{' '}
                    {row.original.detail_clicks ?? 0} clics
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span>{row.original.participant_count ?? 1} participant(s)</span>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header:
        view === 'requester'
          ? 'Statut'
          : view === 'host'
            ? 'Demandes'
            : 'Statut / demandes',
      cell: ({ row }) =>
        row.original.kind === 'requester' ? (
          <Badge variant="outline" className="capitalize">
            {row.original.status ?? 'pending'}
          </Badge>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-orange-200 bg-orange-50 text-orange-700"
            >
              {row.original.pending_count ?? 0} en attente
            </Badge>
            <Badge
              variant="outline"
              className="border-slate-200 bg-slate-100 text-slate-700"
            >
              {row.original.requests_count ?? 0} total
            </Badge>
          </div>
        ),
    },
    {
      accessorKey: 'participant_count',
      header: view === 'requester' ? 'Participants' : 'Gestion',
      cell: ({ row }) =>
        row.original.kind === 'requester' ? (
          <div className="text-sm text-slate-600">
            {row.original.participant_count ?? 1}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Switch
              checked={!!row.original.is_full}
              onCheckedChange={(checked) =>
                handleFullChange(row.original.id, checked)
              }
              disabled={
                !row.original.is_published ||
                !!switchLoading[row.original.id] ||
                row.original.is_finished
              }
            />
            <span className="text-sm font-medium text-slate-700">
              {row.original.is_full ? 'Demandes fermées' : 'Demandes ouvertes'}
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Aide sur le statut des demandes"
                >
                  <CircleHelp className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                className="w-[min(92vw,20rem)] rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-600"
              >
                Quand ce switch est activé, personne ne peut envoyer de
                nouvelle demande sur cette session jusqu’à ce que tu la
                réouvres.
              </PopoverContent>
            </Popover>
          </div>
        ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const sessionLink = `/sessions/${row.original.id}`;
        const editLink = `/app/sessions/${row.original.id}/edit`;
        return (
          <div className="flex flex-wrap justify-end gap-2">
            {row.original.kind === 'host' ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setExpanded((current) => ({
                    ...current,
                    [row.original.id]: !current[row.original.id],
                  }))
                }
                disabled={
                  !row.original.requests ||
                  row.original.requests.length === 0 ||
                  !row.original.is_published
                }
              >
                {expanded[row.original.id] ? (
                  <EyeOff className="mr-2 h-4 w-4" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                Demandes
                <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                  {row.original.requests_count ?? 0}
                </span>
              </Button>
            ) : null}
            {row.original.kind === 'requester' &&
            row.original.status === 'accepted' &&
            row.original.is_published &&
            row.original.host_id &&
            !row.original.is_finished ? (
              <OpenChatButton
                sessionId={row.original.id}
                otherUserId={row.original.host_id}
                conversationId={row.original.conversation_id}
              />
            ) : null}
            {row.original.kind === 'requester' &&
            row.original.can_review &&
            !row.original.reviewed &&
            row.original.host_id ? (
              <SessionReviewModal
                sessionId={row.original.id}
                reviewedUserId={row.original.host_id}
                reviewedUserName={row.original.host_display_name ?? 'l’hôte'}
                sessionTitle={row.original.title}
                sessionPlace={row.original.place}
                sessionStartsAt={row.original.starts_at}
                triggerLabel="Donner mon avis"
                autoOpen={false}
                onReviewed={() =>
                  onReviewComplete(row.original.id, { reviewed: true })
                }
              />
            ) : null}
            {row.original.kind === 'requester' && row.original.reviewed ? (
              <Badge variant="secondary">Avis envoyé</Badge>
            ) : null}
            {row.original.kind === 'requester' &&
            ['pending', 'accepted'].includes(
              (row.original.status ?? '').toLowerCase(),
            ) &&
            !row.original.is_finished ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCancelRequest(row.original.id)}
                disabled={!!cancelLoading[row.original.id]}
              >
                {(row.original.status ?? '').toLowerCase() === 'accepted'
                  ? 'Quitter la session'
                  : 'Annuler ma demande'}
              </Button>
            ) : null}
            {row.original.kind === 'host' ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      !row.original.is_published || row.original.is_finished
                    }
                  >
                    Options
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!row.original.is_finished && (
                    <DropdownMenuItem asChild>
                      <Link href={editLink}>Modifier</Link>
                    </DropdownMenuItem>
                  )}
                  {row.original.is_published && !row.original.is_finished && (
                    <DropdownMenuItem asChild>
                      <Link href={sessionLink}>Voir</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      handleDisableSession(row.original.id);
                    }}
                    disabled={
                      actionLoading[row.original.id] ||
                      !row.original.is_published ||
                      row.original.is_finished
                    }
                  >
                    Désactiver
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        );
      },
    },
  ];
}
