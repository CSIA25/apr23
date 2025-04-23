
import * as React from "react";
import {
  AreaChart as RechartsAreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ChartData {
  name: string;
  value: number;
}

interface ChartProps {
  data: ChartData[];
  className?: string;
}

export function BarChart({ data, className }: ChartProps) {
  return (
    <ChartContainer
      className={className}
      config={{
        bar: {
          // Either use color OR theme, not both
          theme: {
            light: "#3b82f6",
            dark: "#60a5fa",
          },
        },
      }}
    >
      <RechartsBarChart data={data} margin={{ top: 20, right: 20, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis />
        <Bar
          dataKey="value"
          fill="var(--chart-bar, #3b82f6)"
          radius={[4, 4, 0, 0]}
        />
        <ChartTooltip
          cursor={{ fill: "var(--chart-tooltip-bg, rgba(24, 24, 27, 0.05))" }}
          content={<ChartTooltipContent />}
        />
      </RechartsBarChart>
    </ChartContainer>
  );
}

export function AreaChart({ data, className }: ChartProps) {
  return (
    <ChartContainer
      className={className}
      config={{
        area: {
          // Either use color OR theme, not both
          theme: {
            light: "#3b82f6",
            dark: "#60a5fa",
          },
        },
      }}
    >
      <RechartsAreaChart data={data} margin={{ top: 20, right: 20, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--chart-area, #3b82f6)"
          fill="var(--chart-area, #3b82f6)"
          fillOpacity={0.2}
        />
        <ChartTooltip
          cursor={{ fill: "var(--chart-tooltip-bg, rgba(24, 24, 27, 0.05))" }}
          content={<ChartTooltipContent />}
        />
      </RechartsAreaChart>
    </ChartContainer>
  );
}

export function LineChart({ data, className }: ChartProps) {
  return (
    <ChartContainer
      className={className}
      config={{
        line: {
          // Either use color OR theme, not both
          theme: {
            light: "#3b82f6",
            dark: "#60a5fa",
          },
        },
      }}
    >
      <RechartsLineChart data={data} margin={{ top: 20, right: 20, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--chart-line, #3b82f6)"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <ChartTooltip
          cursor={{ fill: "var(--chart-tooltip-bg, rgba(24, 24, 27, 0.05))" }}
          content={<ChartTooltipContent />}
        />
      </RechartsLineChart>
    </ChartContainer>
  );
}
