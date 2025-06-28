import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

export function FloatingAdButton() {
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "transform transition-all duration-300 ease-in-out",
        "hover:scale-110"
      )}
    >
      <Button
        asChild
        size="lg"
        className={cn(
          "h-auto rounded-full bg-special-button-gold text-special-button-gold-foreground",
          "hover:bg-special-button-gold/90",
          "shadow-xl hover:shadow-2xl",
          "px-6 py-3 text-base font-bold"
        )}
      >
        <a
          href="https://line.me/R/ti/p/@733oiboa?oat_content=url&ts=05120012"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Wand2 className="mr-2 h-5 w-5" />
          點『石』成金🐝(評語優化)
        </a>
      </Button>
    </div>
  );
}
