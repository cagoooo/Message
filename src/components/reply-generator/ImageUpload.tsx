"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, Loader2 } from "lucide-react";
import {
  processImage,
  formatBytes,
  type ProcessedImage,
} from "@/lib/image-processor";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  value: ProcessedImage | null;
  onChange: (image: ProcessedImage | null) => void;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    try {
      const processed = await processImage(file);
      onChange(processed);
      toast({
        title: "已附加截圖",
        description: `原始 ${formatBytes(processed.originalSizeBytes)} → 壓縮後 ${formatBytes(processed.sizeBytes)}（${processed.width}×${processed.height}）`,
        variant: "success",
      });
    } catch (err) {
      console.error("[ImageUpload] processImage failed", err);
      toast({
        variant: "destructive",
        title: "圖片處理失敗",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setProcessing(false);
      // 清空 input value，讓使用者可以再次選同一個檔案
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (value) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.dataUrl}
            alt="已上傳的對話截圖"
            className="max-h-32 max-w-[180px] rounded border border-border shadow-sm"
          />
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-xs font-medium text-foreground">已附加截圖</p>
            <p className="text-xs text-muted-foreground">
              {value.width} × {value.height}
              <span className="mx-1">·</span>
              {formatBytes(value.sizeBytes)}
            </p>
            <p className="text-xs text-muted-foreground/80">
              送出時 AI 會直接讀圖辨識內容。
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
            aria-label="移除截圖"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            移除
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
        aria-label="選擇對話截圖"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handlePick}
        disabled={disabled || processing}
        className="gap-1.5 transition-transform hover:scale-105 active:scale-100"
      >
        {processing ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            處理中...
          </>
        ) : (
          <>
            <Camera className="h-3.5 w-3.5" />
            上傳對話截圖（選填）
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground">
        可附 LINE / 簡訊截圖，AI 會自動讀圖辨識文字。
        支援 JPG / PNG / WebP，最大 10 MB。
      </p>
    </div>
  );
}
