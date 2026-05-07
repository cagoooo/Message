// src/app/page.tsx
import { ReplyGeneratorForm } from "@/components/ReplyGeneratorForm";

export default function Home() {
  return (
    <main className="relative flex flex-grow flex-col items-center justify-start pt-10 pb-16 px-4 sm:px-8 md:px-12">
      {/* Hero — Direction A 漸層大標 */}
      <section className="w-full max-w-2xl mx-auto mb-8 sm:mb-10 text-center sm:text-left animate-fade-up">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold border border-border/70 shadow-sm">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
          AI · 親師溝通好夥伴
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.18] text-foreground">
          把<em className="not-italic bg-gradient-to-br from-primary via-primary to-accent bg-clip-text text-transparent">家長的話</em>，
          <br className="hidden sm:inline" />
          變成你<em className="not-italic bg-gradient-to-br from-primary via-accent to-accent bg-clip-text text-transparent">想說的回覆</em>。
        </h1>
        <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto sm:mx-0">
          選擇情境、貼上訊息、調整語氣與長度——小幫手會用同理心和專業，幫你寫出剛剛好的回覆。
        </p>
      </section>

      <ReplyGeneratorForm />
    </main>
  );
}
