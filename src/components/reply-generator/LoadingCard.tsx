"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export function LoadingCard() {
  return (
    <Card className="mt-6 shadow-xl bg-card">
      <CardHeader>
        <CardTitle className="text-xl flex items-center text-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          正在產生建議回覆...
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <Skeleton className="h-4 w-3/4 bg-muted/50" />
        <Skeleton className="h-4 w-full bg-muted/50" />
        <Skeleton className="h-4 w-full bg-muted/50" />
        <Skeleton className="h-4 w-1/2 bg-muted/50" />
      </CardContent>
    </Card>
  );
}
