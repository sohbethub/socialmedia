"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyPoint, MultiSeriesPoint } from "@/lib/charts";

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#9333ea", "#ea580c"];

function shortNumber(n: number): string {
  return new Intl.NumberFormat("tr-TR", { notation: "compact" }).format(n);
}

function shortDate(d: string): string {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function TotalViewsChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={shortNumber} tick={{ fontSize: 12 }} width={48} />
        <Tooltip
          formatter={(value) => [shortNumber(Number(value)), "Toplam izlenme"]}
          labelFormatter={(label) => shortDate(String(label))}
        />
        <Area
          type="monotone"
          dataKey="views"
          stroke="#2563eb"
          strokeWidth={2}
          fill="url(#viewsFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TopPostsChart({
  data,
  series,
}: {
  data: MultiSeriesPoint[];
  series: { key: string; label: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={shortNumber} tick={{ fontSize: 12 }} width={48} />
        <Tooltip
          formatter={(value, name) => {
            const s = series.find((s) => s.key === name);
            return [shortNumber(Number(value)), s?.label ?? String(name)];
          }}
          labelFormatter={(label) => shortDate(String(label))}
        />
        <Legend formatter={(value) => series.find((s) => s.key === value)?.label ?? value} />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
