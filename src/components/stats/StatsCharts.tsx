"use client";

import { motion } from "motion/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { StatsResponse } from "./StatsDashboard";
import { Sparkles, Image as ImageIcon, Settings2, Trophy } from "lucide-react";

const SCENARIO_COLORS = [
  "#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#6366F1", "#14B8A6", "#F97316", "#06B6D4",
  "#84CC16", "#10B981",
];

interface StatsChartsProps {
  stats: StatsResponse;
  getScenarioLabel: (value: string) => string;
}

export function StatsCharts({ stats, getScenarioLabel }: StatsChartsProps) {
  // 折線圖資料：日期 ASC（最舊在左）
  const dailyAsc = [...stats.daily].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  // 圓餅圖資料：彙整所有日期的 byScenario
  const scenarioTotals: Record<string, number> = {};
  for (const d of stats.daily) {
    for (const [k, v] of Object.entries(d.byScenario ?? {})) {
      scenarioTotals[k] = (scenarioTotals[k] ?? 0) + v;
    }
  }
  const scenarioPie = Object.entries(scenarioTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({
      name: getScenarioLabel(name),
      value,
    }));

  return (
    <div className="space-y-4">
      {/* 摘要卡片 */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.07 } },
        }}
      >
        <SummaryCard
          icon={<Sparkles className="h-4 w-4" />}
          label="總呼叫次數"
          value={stats.summary.totalCount.toLocaleString()}
          unit=""
          color="bg-primary/10 text-primary"
        />
        <SummaryCard
          icon={<Settings2 className="h-4 w-4" />}
          label="平均回覆字數"
          value={stats.summary.avgReplyChars.toString()}
          unit="字"
          color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <SummaryCard
          icon={<ImageIcon className="h-4 w-4" />}
          label="附截圖比例"
          value={stats.summary.withImagePercent.toString()}
          unit="%"
          color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <SummaryCard
          icon={<Trophy className="h-4 w-4" />}
          label="最常用情境"
          value={
            stats.summary.topScenario
              ? getScenarioLabel(stats.summary.topScenario.name)
              : "—"
          }
          unit={
            stats.summary.topScenario
              ? `（${stats.summary.topScenario.count} 次）`
              : ""
          }
          color="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          valueClass="text-base"
        />
      </motion.div>

      {/* 每日呼叫折線圖 */}
      {dailyAsc.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">每日呼叫次數</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyAsc}
                    margin={{ top: 10, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(d: string) => d.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "hsl(var(--primary))" }}
                      activeDot={{ r: 6 }}
                      name="次數"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 情境分佈圓餅圖 */}
      {scenarioPie.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">情境使用分佈</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={scenarioPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      label={({ name, percent }) =>
                        percent && percent > 0.05
                          ? `${name} ${Math.round(percent * 100)}%`
                          : ""
                      }
                      labelLine={false}
                    >
                      {scenarioPie.map((_, i) => (
                        <Cell
                          key={i}
                          fill={SCENARIO_COLORS[i % SCENARIO_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconSize={10}
                      wrapperStyle={{ fontSize: "11px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 沒有資料時的提示 */}
      {stats.daily.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BarChart3Icon />
            <p className="mt-3">最近還沒有使用紀錄。先去產生幾份回覆吧！</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  unit,
  color,
  valueClass = "text-2xl",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  color: string;
  valueClass?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12, scale: 0.95 },
        show: { opacity: 1, y: 0, scale: 1 },
      }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
    >
      <Card className="border-border/60">
        <CardContent className="p-4 space-y-1.5">
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${color}`}>
            {icon}
            {label}
          </div>
          <div className={`${valueClass} font-bold`}>
            {value}
            {unit && (
              <span className="text-xs font-normal text-muted-foreground ml-1">
                {unit}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function BarChart3Icon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mx-auto opacity-40"
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9M13 17V5M8 17v-3" />
    </svg>
  );
}
