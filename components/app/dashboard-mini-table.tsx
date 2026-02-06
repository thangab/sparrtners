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
};

export function DashboardMiniTable<T>({
  title,
  linkHref,
  linkTab,
  linkLabel,
  emptyLabel,
  data,
  columns,
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-base">{title}</CardTitle>
        <Link href={linkTarget} className="text-sm text-slate-500 hover:underline">
          {linkLabel}
        </Link>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="pb-2">
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
                      <td key={cell.id} className="py-3 pr-4">
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
      <div className="font-medium text-slate-900">{row.original.title}</div>
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
        <Badge variant="secondary">Publié</Badge>
      ) : (
        <Badge variant="outline">Désactivée</Badge>
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
      <div className="font-medium text-slate-900">{row.original.title}</div>
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
      <Badge variant="outline">{row.original.status}</Badge>
    ),
  },
];
