'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { SessionRequestsList } from '@/components/app/session-requests-list';
import {
  SessionRequestsTableProps,
  SessionTableRow,
} from '@/components/app/session-requests-types';
import { getSessionRequestsColumns } from '@/components/app/session-requests-columns';

export function SessionRequestsTable({
  created,
  requested,
}: SessionRequestsTableProps) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const { toast } = useToast();
  const [view, setView] = React.useState<'host' | 'requester'>('host');
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [createdRows, setCreatedRows] =
    React.useState<SessionTableRow[]>(created);
  const [requestedRows, setRequestedRows] =
    React.useState<SessionTableRow[]>(requested);
  const [actionLoading, setActionLoading] = React.useState<
    Record<string, boolean>
  >({});
  const [switchLoading, setSwitchLoading] = React.useState<
    Record<string, boolean>
  >({});

  React.useEffect(() => {
    setCreatedRows(created);
  }, [created]);

  React.useEffect(() => {
    setRequestedRows(requested);
  }, [requested]);

  const data = React.useMemo(
    () => (view === 'host' ? createdRows : requestedRows),
    [view, createdRows, requestedRows],
  );

  const updateCreatedRow = React.useCallback(
    (id: string, patch: Partial<SessionTableRow>) => {
      setCreatedRows((current) =>
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
        actionLoading,
        switchLoading,
      }),
    [
      view,
      expanded,
      handleDisableSession,
      handleFullChange,
      actionLoading,
      switchLoading,
    ],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  React.useEffect(() => {
    table.setPageIndex(0);
    setExpanded({});
  }, [table, view]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={view === 'host' ? 'default' : 'outline'}
          onClick={() => setView('host')}
        >
          Sessions créées
        </Button>
        <Button
          size="sm"
          variant={view === 'requester' ? 'default' : 'outline'}
          onClick={() => setView('requester')}
        >
          Sessions demandées
        </Button>
      </div>

      <Card className="overflow-hidden border-slate-200/70">
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
                            sessionDisabled={!row.original.is_published}
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
