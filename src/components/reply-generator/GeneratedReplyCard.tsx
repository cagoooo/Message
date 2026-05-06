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
import { Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface GeneratedReplyCardProps {
  reply: string;
  onCopy: () => void;
}

export const GeneratedReplyCard = forwardRef<HTMLDivElement, GeneratedReplyCardProps>(
  function GeneratedReplyCard({ reply, onCopy }, ref) {
    return (
      <Card ref={ref} className="mt-6 shadow-xl bg-card">
        <CardHeader className="text-center p-4 rounded-t-lg bg-gradient-to-br from-primary/20 via-accent/15 to-secondary/20 border-b border-border shadow-sm">
          <CardTitle className="text-2xl font-bold text-primary tracking-tight">
            建議回覆
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "w-full rounded-md shadow-sm p-3 border text-sm",
              "bg-gradient-to-br from-primary/15 via-background to-accent/15 dark:from-primary/30 dark:via-background/20 dark:to-accent/30",
              "text-foreground border-border",
              "transition-all duration-300 ease-in-out leading-relaxed",
              "generated-reply-textarea min-h-[160px]",
            )}
          >
            <ReactMarkdown>{reply}</ReactMarkdown>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={onCopy}
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
