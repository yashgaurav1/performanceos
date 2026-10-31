"use client";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

export function Sparkline({
  data,
  color = "#FF5533",
  height = 36,
  domain,
}: {
  data: { x: string; y: number | null }[];
  color?: string;
  height?: number;
  domain?: [number, number];
}) {
  const id = `spark-${color.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={domain ?? ["dataMin - 5", "dataMax + 5"]} />
          <Area
            type="monotone"
            dataKey="y"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            connectNulls
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
