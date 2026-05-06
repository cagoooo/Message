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
import { Settings2, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        className="border border-dashed border-border/70 rounded-lg px-4 bg-muted/20"
      >
        <AccordionTrigger className="hover:no-underline py-3">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Settings2 className="h-4 w-4 text-primary" />
            進階情境（選填）— 讓回覆更貼近你的學校與班級
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2 pb-4">
          <p className="text-xs text-muted-foreground -mt-2 mb-2">
            填入學校、老師名、年級，AI 會在回覆中適度納入語氣與用詞。
            <span className="text-primary font-medium">儲存後下次自動帶入</span>，
            純存在本機（不上雲端）。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="schoolName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">學校</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="例：桃園市石門國小"
                      {...field}
                      value={field.value ?? ""}
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
                <FormItem>
                  <FormLabel className="text-sm">老師姓名</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="例：阿凱老師"
                      {...field}
                      value={field.value ?? ""}
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
              <FormItem>
                <FormLabel className="text-sm">學生年級</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇年級（選填）" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GRADES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">本次特殊備註</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="例：這位家長特別重視書面紀錄／孩子有過敏體質／已多次溝通..."
                    rows={3}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  此欄不會被儲存為預設值，每次回覆獨立填寫。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-wrap gap-2 justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSaveDefaults}
              className="text-xs"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              儲存學校／老師／年級為預設
            </Button>
            {hasDefaults && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearDefaults}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                清除預設
              </Button>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
