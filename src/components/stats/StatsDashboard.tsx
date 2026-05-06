"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { httpsCallable } from "firebase/functions";
import { getFn } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart3, AlertTriangle, Loader2, Lock, RefreshCw } from "lucide-react";
import { StatsCharts } from "./StatsCharts";
import { getScenarioLabel } from "@/components/reply-generator/constants";

interface DailyStats {
  date: string;
  count: number;
  totalReplyChars?: number;
  withImageCount?: number;
  withAdvancedCount?: number;
  byScenario?: Record<string, number>;
  byMode?: Record<string, number>;
}

export interface StatsResponse {
  daily: DailyStats[];
  summary: {
    totalCount: number;
    activeDays: number;
    avgReplyChars: number;
    withImagePercent: number;
    withAdvancedPercent: number;
    topScenario: { name: string; count: number } | null;
  };
  generatedAt: string;
}

export function StatsDashboard() {
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchStats = async (pw: string) => {
    setLoading(true);
    setError("");
    try {
      const callable = httpsCallable<{ password: string }, StatsResponse>(
        getFn(),
        "getStats",
      );
      const result = await callable({ password: pw });
      setStats(result.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    void fetchStats(password);
  };

  if (!stats) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              使用統計儀表板
            </CardTitle>
            <CardDescription>
              此頁僅限管理員。請輸入管理員密碼查看校內使用情形。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">管理員密碼</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="off"
                  placeholder="請輸入"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>無法載入</AlertTitle>
                  <AlertDescription className="text-xs leading-relaxed">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                disabled={loading || !password}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    驗證中...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    查看統計
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-5xl space-y-4"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            使用統計儀表板
          </h1>
          <p className="text-sm text-muted-foreground">
            最近 {stats.summary.activeDays} 天的活動 ｜ 載入時間：
            {new Date(stats.generatedAt).toLocaleString("zh-TW")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void fetchStats(password)}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          重新整理
        </Button>
      </div>

      <StatsCharts stats={stats} getScenarioLabel={getScenarioLabel} />
    </motion.div>
  );
}
