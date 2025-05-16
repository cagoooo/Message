// src/app/page.tsx
import { ReplyGeneratorForm } from "@/components/ReplyGeneratorForm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start py-12 px-4 sm:px-8 md:px-12 bg-background">
      <ReplyGeneratorForm />
    </main>
  );
}
