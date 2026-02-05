'use client';

import * as React from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { OpenChatButton } from '@/components/app/open-chat-button';
import { SessionReviewModal } from '@/components/app/session-review-modal';
import { MoreVertical, Eye, EyeOff } from 'lucide-react';
import { SessionTableRow } from '@/components/app/session-requests-types';

type ColumnsOptions = {
  view: 'host' | 'requester' | 'completed';
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleDisableSession: (sessionId: string) => void;
  handleFullChange: (sessionId: string, checked: boolean) => void;
  onReviewComplete: (
    sessionId: string,
    patch: Partial<SessionTableRow>,
  ) => void;
  actionLoading: Record<string, boolean>;
  switchLoading: Record<string, boolean>;
};

export function getSessionRequestsColumns({
  view,
  expanded,
  setExpanded,
  handleDisableSession,
  handleFullChange,
  onReviewComplete,
  actionLoading,
  switchLoading,
}: ColumnsOptions): ColumnDef<SessionTableRow>[] {
  return [
    {
      accessorKey: 'title',
      header: 'Session',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-slate-900">
              {row.original.title}
            </div>
            {row.original.kind === 'host' &&
            row.original.requests?.some(
              (request) => request.can_review && !request.reviewed,
            ) ? (
              <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                Avis à donner
              </Badge>
            ) : null}
            {row.original.kind === 'requester' &&
            row.original.can_review &&
            !row.original.reviewed ? (
              <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                Avis à donner
              </Badge>
            ) : null}
          </div>
          <div className="text-xs text-slate-500">{row.original.starts_at}</div>
          <div className="text-xs text-slate-500">{row.original.place}</div>
          {!row.original.is_published ? (
            <Badge variant="secondary">Session désactivée</Badge>
          ) : null}
        </div>
      ),
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
          <Badge variant="outline">{row.original.status ?? 'pending'}</Badge>
        ) : (
          <div className="text-sm text-slate-600">
            {row.original.pending_count ?? 0} en attente ·{' '}
            {row.original.requests_count ?? 0} total
          </div>
        ),
    },
    {
      accessorKey: 'participant_count',
      header: view === 'requester' ? 'Participants' : 'Actions',
      cell: ({ row }) =>
        row.original.kind === 'requester' ? (
          <div className="text-sm text-slate-600">
            {row.original.participant_count ?? 1}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Switch
              checked={row.original.is_full ?? false}
              onCheckedChange={(checked) =>
                handleFullChange(row.original.id, checked)
              }
              disabled={
                !row.original.is_published ||
                !!switchLoading[row.original.id] ||
                row.original.is_finished
              }
            />
            <span>Session complète</span>
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
                reviewedUserName="l’hôte"
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
            {row.original.kind === 'host' ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={
                      !row.original.is_published || row.original.is_finished
                    }
                  >
                    <MoreVertical className="h-4 w-4" />
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
