'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                >
                  {mobileVariant === 'sessions' ? (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {(item as DashboardSessionRow).title}
                      </p>
                      <p className="text-xs text-slate-500">
                        Créée le {(item as DashboardSessionRow).created_at}
                      </p>
                      {(item as DashboardSessionRow).is_published ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-100 text-emerald-800"
                        >
                          Publié
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-slate-300">
                          Désactivée
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {(item as DashboardRequestRow).title}
                      </p>
                      <p className="text-xs text-slate-500">
                        Demande du {(item as DashboardRequestRow).created_at}
                      </p>
                      <Badge variant="outline" className="capitalize">
                        {(item as DashboardRequestRow).status}
                      </Badge>
                    </div>
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
                  <tr key={row.id} className="border-t border-slate-100">
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
  created_at: string;
  is_published: boolean;
};

export type DashboardRequestRow = {
  id: string;
  title: string;
  created_at: string;
  status: string;
};

export const dashboardSessionsColumns: Array<
  ColumnDef<DashboardSessionRow>
> = [
  {
    accessorKey: 'title',
    header: 'Session',
    cell: ({ row }) => (
      <div className="min-w-0 break-words font-medium text-slate-900">
        {row.original.title}
      </div>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Créée',
    cell: ({ row }) => (
      <div className="text-xs text-slate-500">{row.original.created_at}</div>
    ),
  },
  {
    accessorKey: 'is_published',
    header: 'Statut',
    cell: ({ row }) =>
      row.original.is_published ? (
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
          Publié
        </Badge>
      ) : (
        <Badge variant="outline" className="border-slate-300">
          Désactivée
        </Badge>
      ),
  },
];

export const dashboardRequestsColumns: Array<
  ColumnDef<DashboardRequestRow>
> = [
  {
    accessorKey: 'title',
    header: 'Session',
    cell: ({ row }) => (
      <div className="min-w-0 break-words font-medium text-slate-900">
        {row.original.title}
      </div>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Demande',
    cell: ({ row }) => (
      <div className="text-xs text-slate-500">{row.original.created_at}</div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.original.status}
      </Badge>
    ),
  },
];
