import { StatsDashboard } from "@/components/stats/StatsDashboard";

export const metadata = {
  title: "使用統計",
  robots: { index: false, follow: false }, // 不要被搜尋引擎索引
};

export default function StatsPage() {
  return (
    <main className="flex flex-grow flex-col items-center justify-start py-12 px-4 sm:px-8 md:px-12">
      <StatsDashboard />
    </main>
  );
}
