'use client';

import * as React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@radix-ui/react-tooltip';
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
} from 'recharts';
import { cn } from '@/lib/utils';

type ChartConfigValue = {
  label?: string;
  color?: string;
};

export type ChartConfig = Record<string, ChartConfigValue>;

type ChartContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig;
  children: React.ReactElement;
};

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ className, children, config, ...props }, ref) => {
    const style = React.useMemo(() => {
      const entries = Object.entries(config).map(([key, value]) => [
        `--color-${key}`,
        value.color ?? 'currentColor',
      ]);
      return Object.fromEntries(entries) as React.CSSProperties;
    }, [config]);

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        style={style}
        {...props}
      >
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    );
  },
);
ChartContainer.displayName = 'ChartContainer';

type ChartTooltipContentProps = {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    dataKey?: string;
    color?: string;
  }>;
  label?: string;
  formatter?: (value: number | string) => string;
  labelFormatter?: (label: string) => string;
};

function ChartTooltipContent({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      {label ? (
        <div className="mb-2 text-xs font-medium text-slate-600">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      ) : null}
      <div className="space-y-1">
        {payload.map((item, index) => (
          <div key={`${item.dataKey}-${index}`} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-600">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs">
                {item.name ?? item.dataKey ?? 'Valeur'}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-900">
              {formatter ? formatter(item.value ?? 0) : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const ChartTooltip = RechartsTooltip;
const ChartLegend = RechartsLegend;

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
};
