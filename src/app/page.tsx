// src/app/page.tsx
import { ReplyGeneratorForm } from "@/components/ReplyGeneratorForm";

export default function Home() {
  return (
    <main className="relative flex flex-grow flex-col items-stretch pt-8 pb-16 px-4 sm:px-6 md:px-10">
      {/* Hero — Direction A 漸層大標 */}
      <section className="w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[1440px] mx-auto mb-8 sm:mb-10 text-center md:text-left animate-fade-up">
        <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full bg-primary/15 text-primary text-sm font-bold border border-primary/25 shadow-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-primary" />
          AI · 親師溝通好夥伴
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.15] text-foreground drop-shadow-sm">
          把<em className="not-italic bg-gradient-to-br from-primary via-primary to-accent bg-clip-text text-transparent">家長的話</em>，
          <br className="hidden sm:inline" />
          變成你<em className="not-italic bg-gradient-to-br from-primary via-accent to-accent bg-clip-text text-transparent">想說的回覆</em>。
        </h1>
        <p className="mt-5 text-base sm:text-lg md:text-xl text-foreground/80 font-medium leading-relaxed max-w-2xl mx-auto md:mx-0">
          選擇情境、貼上訊息、調整語氣與長度——小幫手會用同理心和專業，幫你寫出剛剛好的回覆。
        </p>
      </section>

      {/* Direction A 設計檔的 grid：左對話卡 + 右側欄 */}
      <ReplyGeneratorForm />
    </main>
  );
}
