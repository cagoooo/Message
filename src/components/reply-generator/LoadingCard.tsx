"use client";

import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export function LoadingCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Card className="mt-6 shadow-xl bg-card">
        <CardHeader>
          <CardTitle className="text-xl flex items-center text-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            正在產生建議回覆...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {[
            "h-4 w-3/4",
            "h-4 w-full",
            "h-4 w-full",
            "h-4 w-1/2",
          ].map((cls, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.25 }}
            >
              <Skeleton className={`${cls} bg-muted/50`} />
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
