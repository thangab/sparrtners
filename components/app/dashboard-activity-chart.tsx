'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
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
  }, [days, start, rowMap, metric, range]);

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
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Activité sportive</CardTitle>
            <p className="text-sm text-muted-foreground">
              Suis tes sessions et tes heures sur la période choisie.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {metricOptions.map((option) => (
              <Button
                key={option.key}
                variant={metric === option.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMetric(option.key)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex flex-wrap gap-2">
            {rangeOptions.map((option) => (
              <Button
                key={option.key}
                variant={range === option.key ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setRange(option.key)}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div>
            {metric === 'sessions'
              ? `${totalSessions} sessions`
              : `${totalHours} h`}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-72" config={chartConfig}>
          <BarChart data={series} margin={{ left: 0, right: 8, top: 8 }}>
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
            <Bar
              dataKey={metric}
              radius={[8, 8, 0, 0]}
              fill={`var(--color-${metric})`}
            />
          </BarChart>
        </ChartContainer>
        {loading ? (
          <p className="mt-2 text-xs text-muted-foreground">Chargement…</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
