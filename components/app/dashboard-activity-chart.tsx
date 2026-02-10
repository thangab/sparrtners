'use client';

import * as React from 'react';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

type ActivityRow = {
  day: string;
  sessions_count: number;
  minutes: number;
};

type RangeKey = '7d' | '30d' | '90d';
type MetricKey = 'sessions' | 'hours';

const rangeOptions: Array<{ key: RangeKey; label: string }> = [
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '1 mois' },
  { key: '90d', label: '3 mois' },
];

const metricOptions: Array<{ key: MetricKey; label: string }> = [
  { key: 'sessions', label: 'Sessions' },
  { key: 'hours', label: 'Heures' },
];

const buildDateRange = (range: RangeKey) => {
  const days = range === '90d' ? 90 : range === '30d' ? 30 : 7;
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return { start, days };
};

const formatDayKey = (date: Date) => date.toISOString().slice(0, 10);

const formatDayLabel = (date: Date, range: RangeKey) =>
  date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: range === '7d' ? 'short' : '2-digit',
  });

export function DashboardActivityChart() {
  const [range, setRange] = React.useState<RangeKey>('7d');
  const [metric, setMetric] = React.useState<MetricKey>('sessions');
  const [rows, setRows] = React.useState<ActivityRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/dashboard/activity?range=${range}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((payload: { data?: ActivityRow[] }) => {
        if (!active) return;
        setRows(payload.data ?? []);
      })
      .catch(() => {
        if (!active) return;
        setRows([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range]);

  const { start, days } = React.useMemo(() => buildDateRange(range), [range]);
  const rowMap = React.useMemo(() => {
    const map = new Map<string, ActivityRow>();
    rows.forEach((row) => {
      map.set(row.day, row);
    });
    return map;
  }, [rows]);

  const series = React.useMemo(() => {
    const items: Array<{
      key: string;
      label: string;
      sessions: number;
      hours: number;
    }> = [];
    for (let i = 0; i < days; i += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const key = formatDayKey(day);
      const row = rowMap.get(key);
      items.push({
        key,
        label: formatDayLabel(day, range),
        sessions: row?.sessions_count ?? 0,
        hours: Math.round(((row?.minutes ?? 0) / 60) * 10) / 10,
      });
    }
    return items;
  }, [days, start, rowMap, range]);

  const totalSessions = rows.reduce((sum, row) => sum + row.sessions_count, 0);
  const totalHours =
    Math.round((rows.reduce((sum, row) => sum + row.minutes, 0) / 60) * 10) /
    10;

  const chartConfig = React.useMemo(
    () => ({
      sessions: {
        label: 'Sessions',
        color: 'hsl(222 47% 11%)',
      },
      hours: {
        label: 'Heures',
        color: 'hsl(220 90% 56%)',
      },
    }),
    [],
  );

  return (
    <Card className="w-full max-w-full overflow-hidden border-slate-200/80 shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black text-slate-950">
              Activité sportive
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Suis tes sessions et tes heures sur la période choisie.
            </p>
          </div>
          <div className="grid w-full min-w-0 grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5 sm:w-auto">
            {metricOptions.map((option) => (
              <Button
                key={option.key}
                variant="ghost"
                size="sm"
                className={
                  `min-w-0 px-2 text-xs sm:text-sm ${
                    metric === option.key
                      ? 'bg-white text-slate-900 shadow-sm hover:bg-white'
                      : 'text-slate-600 hover:bg-white/70'
                  }`
                }
                onClick={() => setMetric(option.key)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="grid w-full min-w-0 grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5 sm:w-auto">
            {rangeOptions.map((option) => (
              <Button
                key={option.key}
                variant="ghost"
                size="sm"
                className={
                  `min-w-0 px-2 text-xs sm:text-sm ${
                    range === option.key
                      ? 'bg-white text-slate-900 shadow-sm hover:bg-white'
                      : 'text-slate-600 hover:bg-white/70'
                  }`
                }
                onClick={() => setRange(option.key)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {metric === 'sessions'
              ? `${totalSessions} sessions`
              : `${totalHours} h`}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <ChartContainer
          className="h-72 rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/70 p-2"
          config={chartConfig}
        >
          <LineChart data={series} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval={range === '90d' ? 6 : range === '30d' ? 3 : 0}
              fontSize={11}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    metric === 'sessions' ? `${value}` : `${value} h`
                  }
                />
              }
            />
            <Line
              type="linear"
              dataKey={metric}
              stroke={`var(--color-${metric})`}
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
        {loading ? (
          <p className="text-xs text-muted-foreground">Chargement…</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
