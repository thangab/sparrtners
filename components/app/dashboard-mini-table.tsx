'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function formatRequestStatus(status?: string | null) {
  const value = (status ?? '').toLowerCase();
  if (value === 'pending') return 'En attente';
  if (value === 'accepted') return 'Acceptée';
  if (value === 'declined') return 'Refusée';
  if (value === 'withdrawn') return 'Retirée';
  if (value === 'canceled') return 'Annulée';
  return status ?? 'Inconnu';
}

type DashboardMiniTableProps<T> = {
  title: string;
  linkHref: string;
  linkTab?: 'host' | 'requester' | 'completed';
  linkLabel: string;
  emptyLabel: string;
  data: T[];
  columns: Array<ColumnDef<T>>;
  mobileVariant: 'sessions' | 'requests';
};

export function DashboardMiniTable<T>({
  title,
  linkHref,
  linkTab,
  linkLabel,
  emptyLabel,
  data,
  columns,
  mobileVariant,
}: DashboardMiniTableProps<T>) {
  const router = useRouter();
  const getSessionHref = React.useCallback(
    (item: T) => {
      if (mobileVariant === 'sessions') {
        return `/sessions/${(item as DashboardSessionRow).id}`;
      }
      return `/sessions/${(item as DashboardRequestRow).session_id ?? (item as DashboardRequestRow).id}`;
    },
    [mobileVariant],
  );
  const linkTarget = React.useMemo(() => {
    if (!linkTab) return linkHref;
    const params = new URLSearchParams();
    params.set('tab', linkTab);
    return `${linkHref}?${params.toString()}`;
  }, [linkHref, linkTab]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="w-full max-w-full overflow-hidden border-slate-200/80">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-base">{title}</CardTitle>
        <Link
          href={linkTarget}
          className="shrink-0 text-sm font-medium text-slate-600 underline-offset-4 hover:underline"
        >
          {linkLabel}
        </Link>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-muted-foreground">
            {emptyLabel}
          </p>
        ) : (
          <>
            <div className="space-y-2 md:hidden">
              {data.map((item, index) => (
                <div key={index}>
                  {mobileVariant === 'sessions' ? (
                    <Link
                      href={getSessionHref(item)}
                      className="block rounded-xl border border-slate-200 bg-slate-50/60 p-3 transition-colors hover:border-orange-400"
                    >
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {(item as DashboardSessionRow).title}
                        </p>
                        <p className="text-xs text-slate-500">
                          Prévue le {(item as DashboardSessionRow).starts_at}
                        </p>
                        {(item as DashboardSessionRow).is_published ? (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-800"
                          >
                            Publiée
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-slate-300">
                            Désactivée
                          </Badge>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <Link
                      href={getSessionHref(item)}
                      className="block rounded-xl border border-slate-200 bg-slate-50/60 p-3 transition-colors hover:border-orange-400"
                    >
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {(item as DashboardRequestRow).title}
                        </p>
                        <p className="text-xs text-slate-500">
                          Prévue le {(item as DashboardRequestRow).starts_at}
                        </p>
                        <Badge variant="outline" className="capitalize">
                          {formatRequestStatus(
                            (item as DashboardRequestRow).status,
                          )}
                        </Badge>
                      </div>
                    </Link>
                  )}
                </div>
              ))}
            </div>
            <div className="hidden w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white md:block">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="px-3 py-2">
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
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(getSessionHref(row.original))}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          router.push(getSessionHref(row.original));
                        }
                      }}
                      className={`border-t border-slate-100 ${'cursor-pointer transition-colors hover:bg-orange-50/40 focus-visible:bg-orange-50/40'}`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-3 pr-4 align-top">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export type DashboardSessionRow = {
  id: string;
  title: string;
  starts_at: string;
  is_published: boolean;
};

export type DashboardRequestRow = {
  id: string;
  session_id?: string;
  title: string;
  starts_at: string;
  status: string;
};

export const dashboardSessionsColumns: Array<ColumnDef<DashboardSessionRow>> = [
  {
    accessorKey: 'title',
    header: 'Session',
    cell: ({ row }) => (
      <div className="min-w-0 wrap-break-word font-medium text-slate-900">
        {row.original.title}
      </div>
    ),
  },
  {
    accessorKey: 'starts_at',
    header: 'Prévue le',
    cell: ({ row }) => (
      <div className="text-xs text-slate-500">{row.original.starts_at}</div>
    ),
  },
  {
    accessorKey: 'is_published',
    header: 'Statut',
    cell: ({ row }) =>
      row.original.is_published ? (
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
          Publiée
        </Badge>
      ) : (
        <Badge variant="outline" className="border-slate-300">
          Désactivée
        </Badge>
      ),
  },
];

export const dashboardRequestsColumns: Array<ColumnDef<DashboardRequestRow>> = [
  {
    accessorKey: 'title',
    header: 'Session',
    cell: ({ row }) => (
      <div className="min-w-0 wrap-break-word font-medium text-slate-900">
        {row.original.title}
      </div>
    ),
  },
  {
    accessorKey: 'starts_at',
    header: 'Prévue le',
    cell: ({ row }) => (
      <div className="text-xs text-slate-500">{row.original.starts_at}</div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => (
      <Badge variant="outline">
        {formatRequestStatus(row.original.status)}
      </Badge>
    ),
  },
];
