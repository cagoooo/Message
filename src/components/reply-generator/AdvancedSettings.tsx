"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings2,
  Save,
  RotateCcw,
  Building2,
  User,
  GraduationCap,
  StickyNote,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UseFormReturn } from "react-hook-form";

const GRADES = [
  "幼兒園",
  "國小一年級",
  "國小二年級",
  "國小三年級",
  "國小四年級",
  "國小五年級",
  "國小六年級",
  "國中一年級",
  "國中二年級",
  "國中三年級",
  "高中一年級",
  "高中二年級",
  "高中三年級",
];

export interface AdvancedFormValues {
  scenario: string;
  parentMessage: string;
  schoolName?: string;
  teacherName?: string;
  studentGrade?: string;
  notes?: string;
}

interface AdvancedSettingsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  onSaveDefaults: () => void;
  onClearDefaults: () => void;
  hasDefaults: boolean;
}

// 共用：欄位 label 帶圖示 + 主色點
function FieldLabel({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <FormLabel className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground/90">
      <Icon className="h-3.5 w-3.5 text-primary" />
      {children}
    </FormLabel>
  );
}

// 共用：input className（圓角 + focus 主色 ring）
const inputCls = cn(
  "rounded-xl border-border/70 bg-card/70 backdrop-blur-sm",
  "transition-all duration-200",
  "hover:border-primary/40",
  "focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
);

export function AdvancedSettings({
  form,
  onSaveDefaults,
  onClearDefaults,
  hasDefaults,
}: AdvancedSettingsProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem
        value="advanced"
        className={cn(
          "overflow-hidden rounded-2xl border border-primary/15",
          "bg-gradient-to-br from-card via-secondary/30 to-card",
          "shadow-sm shadow-primary/5",
          "data-[state=open]:shadow-md data-[state=open]:shadow-primary/10",
          "data-[state=open]:border-primary/25",
          "transition-all duration-300",
        )}
      >
        {/* === Trigger（折疊標題列）=== */}
        <AccordionTrigger className="hover:no-underline px-5 py-4 group/trigger">
          <span className="flex items-center gap-3 flex-1 text-left">
            {/* 圓角徽章 icon — 呼應 nav logo */}
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-sm shadow-primary/30 ring-2 ring-background/50 shrink-0">
              <Settings2 className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-foreground">
                進階情境
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">（選填）</span>
              </span>
              <span className="block text-xs text-muted-foreground mt-0.5 truncate">
                讓回覆更貼近你的學校與班級
              </span>
            </span>
          </span>
        </AccordionTrigger>

        {/* === 內容 === */}
        <AccordionContent className="px-5 pt-1 pb-5">
          {/* 說明卡：紫色細邊條 + 主色強調 */}
          <div
            className={cn(
              "relative rounded-xl bg-primary/5 border border-primary/10",
              "px-4 py-3 mb-5 text-xs sm:text-[13px] leading-relaxed text-muted-foreground",
              "before:content-[''] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1 before:rounded-r-full before:bg-gradient-to-b before:from-primary before:to-accent",
              "pl-5",
            )}
          >
            填入學校、老師名、年級，AI 會在回覆中適度納入語氣與用詞。
            <span className="text-primary font-semibold">儲存後下次自動帶入</span>
            ，純存在本機（
            <span className="font-medium">不上雲端</span>）。
          </div>

          {/* === Sub-section 1：常用設定（會儲存） === */}
          <div className="rounded-2xl bg-card/60 border border-border/50 p-4 space-y-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <h4 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-primary/80">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                常用設定
              </h4>
              <span className="text-[10.5px] text-muted-foreground/80">儲存後下次帶入</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="schoolName"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FieldLabel icon={Building2}>學校</FieldLabel>
                    <FormControl>
                      <Input
                        placeholder="例：桃園市石門國小"
                        {...field}
                        value={field.value ?? ""}
                        className={inputCls}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="teacherName"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FieldLabel icon={User}>老師姓名</FieldLabel>
                    <FormControl>
                      <Input
                        placeholder="例：阿凱老師"
                        {...field}
                        value={field.value ?? ""}
                        className={inputCls}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="studentGrade"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FieldLabel icon={GraduationCap}>學生年級</FieldLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger className={inputCls}>
                        <SelectValue placeholder="選擇年級（選填）" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl border-border/70">
                      {GRADES.map((g) => (
                        <SelectItem
                          key={g}
                          value={g}
                          className="rounded-lg my-0.5 mx-1 cursor-pointer focus:bg-secondary"
                        >
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 儲存 / 清除 按鈕 */}
            <div className="flex flex-wrap gap-2 pt-1 -mb-1">
              <Button
                type="button"
                size="sm"
                onClick={onSaveDefaults}
                className={cn(
                  "rounded-full px-4 text-xs font-semibold",
                  "bg-gradient-to-r from-primary to-accent text-primary-foreground",
                  "shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30",
                  "hover:brightness-110 transition-all",
                )}
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                儲存為預設
              </Button>
              {hasDefaults && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClearDefaults}
                  className="rounded-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  清除預設
                </Button>
              )}
            </div>
          </div>

          {/* === Sub-section 2：本次備註（不儲存） === */}
          <div className="rounded-2xl bg-accent/5 border border-accent/15 p-4 space-y-3 mt-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <h4 className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-accent">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" />
                本次備註
              </h4>
              <span className="text-[10.5px] text-muted-foreground/80">不儲存・每次獨立</span>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FieldLabel icon={StickyNote}>特殊備註（針對這次回覆）</FieldLabel>
                  <FormControl>
                    <Textarea
                      placeholder="例：這位家長特別重視書面紀錄／孩子有過敏體質／已多次溝通..."
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                      className={cn(inputCls, "resize-none")}
                    />
                  </FormControl>
                  <FormDescription className="flex items-start gap-1.5 text-[11.5px] text-muted-foreground">
                    <Sparkles className="h-3 w-3 mt-0.5 shrink-0 text-accent" />
                    <span>
                      此欄不會儲存為預設，AI 會把它當成本次回覆的特別提示。
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
