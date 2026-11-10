import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { EmptyState } from "@/components/common/EmptyState";
import { formatHours } from "@/lib/dates";
import { subjectCssVar } from "@/lib/subject-colors";
import type { DayActivity } from "@/lib/stats";
import type { Subject } from "@/types";
import { PieChart as PieIcon } from "lucide-react";

const weeklyConfig = {
  studied: { label: "Studied", color: "var(--chart-1)" },
  planned: { label: "Planned", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function WeeklyActivityChart({ data, todayKey }: { data: DayActivity[]; todayKey: string }) {
  return (
    <ChartContainer config={weeklyConfig} className="aspect-auto h-64 w-full">
      <BarChart data={data} margin={{ left: -16, right: 4, top: 8 }} barGap={4}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={({ x, y, payload, index }) => {
            const isToday = data[index]?.dateKey === todayKey;
            return (
              <text
                x={x}
                y={y + 10}
                textAnchor="middle"
                className={isToday ? "fill-primary text-xs font-bold" : "fill-muted-foreground text-xs"}
              >
                {payload.value}
              </text>
            );
          }}
        />
        <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `${v}h`} />
        <ChartTooltip
          cursor={{ fillOpacity: 0.4 }}
          content={<ChartTooltipContent formatter={(value, name) => (
            <div className="flex w-full items-center justify-between gap-4">
              <span className="text-muted-foreground">{weeklyConfig[name as keyof typeof weeklyConfig]?.label}</span>
              <span className="tabular font-semibold text-foreground">{value}h</span>
            </div>
          )} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="planned" fill="var(--color-planned)" radius={[6, 6, 0, 0]} maxBarSize={22} />
        <Bar dataKey="studied" fill="var(--color-studied)" radius={[6, 6, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ChartContainer>
  );
}

export function AcademicProgressChart({
  subjects,
  minutesBySubject,
}: {
  subjects: Subject[];
  minutesBySubject: Record<string, number>;
}) {
  const data = subjects
    .map((s) => ({
      id: s.id,
      name: s.name,
      hours: Math.round(((minutesBySubject[s.id] ?? 0) / 60) * 10) / 10,
      fill: subjectCssVar(s.color),
    }))
    .filter((d) => d.hours > 0);

  if (data.length === 0) {
    return (
      <EmptyState
        compact
        icon={PieIcon}
        title="No study time yet"
        description="Complete sessions or focus rounds to see the split."
      />
    );
  }

  const total = data.reduce((sum, d) => sum + d.hours, 0);
  const config: ChartConfig = Object.fromEntries(
    data.map((d) => [d.id, { label: d.name, color: d.fill }]),
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <ChartContainer config={config} className="relative aspect-square h-48">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                nameKey="id"
                formatter={(value, _name, item) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground">{item.payload?.name}</span>
                    <span className="tabular font-semibold text-foreground">{value}h</span>
                  </div>
                )}
              />
            }
          />
          <Pie data={data} dataKey="hours" nameKey="id" innerRadius={52} outerRadius={84} paddingAngle={2} strokeWidth={0}>
            {data.map((d) => (
              <Cell key={d.id} fill={d.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <p className="-mt-2 text-sm text-muted-foreground">
        <span className="tabular font-display text-lg font-bold text-foreground">
          {formatHours(total * 60)}
        </span>{" "}
        total
      </p>
      <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-1.5">
        {data.map((d) => (
          <li key={d.id} className="flex min-w-0 items-center gap-2 text-xs">
            <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: d.fill }} />
            <span className="truncate text-muted-foreground">{d.name}</span>
            <span className="tabular ml-auto font-semibold">{d.hours}h</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
