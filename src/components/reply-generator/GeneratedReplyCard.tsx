"use client";

import { forwardRef } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Share2,
  Heart,
  Briefcase,
  Scissors,
  Plus,
  Loader2,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

export type RefineInstruction =
  | "再溫和一點"
  | "再正式一點"
  | "縮短"
  | "加更多細節";

export interface RefineOption {
  key: RefineInstruction;
  icon: typeof Heart;
  className: string;
}

const REFINE_OPTIONS: RefineOption[] = [
  {
    key: "再溫和一點",
    icon: Heart,
    className:
      "border-pink-300 text-pink-700 hover:bg-pink-50 dark:text-pink-300 dark:hover:bg-pink-950/30",
  },
  {
    key: "再正式一點",
    icon: Briefcase,
    className:
      "border-blue-300 text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/30",
  },
  {
    key: "縮短",
    icon: Scissors,
    className:
      "border-amber-300 text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30",
  },
  {
    key: "加更多細節",
    icon: Plus,
    className:
      "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30",
  },
];

interface GeneratedReplyCardProps {
  reply: string;
  onCopy: () => void;
  onRefine?: (instruction: RefineInstruction) => void;
  /** refine 進行中時 disable 所有 refine 按鈕 */
  isRefining?: boolean;
  /** 沒 token / 等驗證時 disable */
  refineDisabled?: boolean;
}

function shareToLine(text: string) {
  const url = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export const GeneratedReplyCard = forwardRef<HTMLDivElement, GeneratedReplyCardProps>(
  function GeneratedReplyCard(
    { reply, onCopy, onRefine, isRefining = false, refineDisabled = false },
    ref,
  ) {
    return (
      <Card ref={ref} className="mt-6 shadow-xl bg-card">
        <CardHeader className="text-center p-4 rounded-t-lg bg-gradient-to-br from-primary/20 via-accent/15 to-secondary/20 border-b border-border shadow-sm">
          <CardTitle className="text-2xl font-bold text-primary tracking-tight">
            建議回覆
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cn(
              "w-full rounded-md shadow-sm p-3 border text-sm",
              "bg-gradient-to-br from-primary/15 via-background to-accent/15 dark:from-primary/30 dark:via-background/20 dark:to-accent/30",
              "text-foreground border-border",
              "transition-all duration-300 ease-in-out leading-relaxed",
              "generated-reply-textarea min-h-[160px]",
              isRefining && "opacity-60 pointer-events-none",
            )}
          >
            <ReactMarkdown>{reply}</ReactMarkdown>
          </div>

          {/* refine 快速調整按鈕 */}
          {onRefine && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Wand2 className="h-3.5 w-3.5" />
                想再調整？點下方一鍵重新產生
              </div>
              <div className="flex flex-wrap gap-2">
                {REFINE_OPTIONS.map(({ key, icon: Icon, className }) => (
                  <Button
                    key={key}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isRefining || refineDisabled}
                    onClick={() => onRefine(key)}
                    className={cn(
                      "transition-transform hover:scale-105 active:scale-100",
                      className,
                    )}
                  >
                    {isRefining ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Icon className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {key}
                  </Button>
                ))}
              </div>
              {refineDisabled && !isRefining && (
                <p className="text-xs text-muted-foreground/80">
                  請先等下方人機驗證完成（綠色「成功！」）才能再次調整。
                </p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 justify-end">
          <Button
            type="button"
            onClick={() => shareToLine(reply)}
            variant="outline"
            disabled={isRefining}
            className="bg-[#06C755] text-white border-[#06C755] hover:bg-[#05a648] hover:text-white transition-transform duration-300 hover:scale-105 active:scale-100"
            aria-label="分享到 LINE"
          >
            <Share2 className="mr-2 h-4 w-4" />
            分享到 LINE
          </Button>
          <Button
            type="button"
            onClick={onCopy}
            disabled={isRefining}
            variant="default"
            className="transform transition-transform duration-300 ease-in-out hover:scale-110 active:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/80"
          >
            <Copy className="mr-2 h-4 w-4" />
            複製回覆
          </Button>
        </CardFooter>
      </Card>
    );
  },
);
