"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { generateReply, type ActionResult } from "@/lib/actions";
import { useHistory, type HistoryEntry } from "@/hooks/use-history";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useFakeProgress } from "@/hooks/use-fake-progress";
import { useFormDefaults } from "@/hooks/use-form-defaults";
import { useToast } from "@/hooks/use-toast";
import { detectPII, maskPII, type PIIWarning } from "@/lib/pii-detector";
import { HistoryPanel } from "@/components/HistoryPanel";
import { SideHistory } from "@/components/SideHistory";
import {
  GeneratedReplyCard,
  type RefineInstruction,
} from "@/components/reply-generator/GeneratedReplyCard";
import { AdvancedSettings } from "@/components/reply-generator/AdvancedSettings";
import { ImageUpload } from "@/components/reply-generator/ImageUpload";
import type { ProcessedImage } from "@/lib/image-processor";
import { LoadingCard } from "@/components/reply-generator/LoadingCard";
import {
  SCENARIOS,
  getScenarioLabel,
} from "@/components/reply-generator/constants";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/components/reply-generator/TurnstileWidget";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  BotMessageSquare,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

const formSchema = z.object({
  scenario: z
    .string({ required_error: "請選擇一個情境。" })
    .min(1, "必須填寫情境。"),
  // 訊息長度的條件式驗證（有圖片可不填、無圖片至少 5 字）改在 handleSubmit 自訂處理，
  // schema 本身不擋空字串。
  parentMessage: z.string().default(""),
  // 進階情境（皆 optional）
  schoolName: z.string().max(100).optional(),
  teacherName: z.string().max(50).optional(),
  studentGrade: z.string().max(30).optional(),
  notes: z.string().max(500).optional(),
});
type FormSchemaType = z.infer<typeof formSchema>;

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// Direction A 長度與語氣指示注入 — 將前端使用者選擇拼到訊息前綴，
// 由 LLM 自然遵守，零後端 schema 改動。
const LENGTH_INSTRUCTIONS = {
  short:    "請寫成簡短版本，僅 1–2 句、不超過 60 字。",
  standard: "請寫成標準版本，約 1 段、120–250 字。",
  detailed: "請寫成完整版本，含問候、背景描述、行動方案、收尾，約 300–500 字。",
} as const;
const TONE_LABELS = ["極正式", "正式", "平衡", "親切", "非常親切"] as const;
const TONE_INSTRUCTIONS = [
  "用極正式、公文式的語氣，使用敬語與書面用語。",
  "用正式、客氣、中性的語氣。",
  "用平衡的語氣，兼具專業與親切。",
  "用親切、溫暖的語氣，可以用一些口語但仍保持專業。",
  "用非常親切、溫暖、像對朋友一樣的口吻，但仍尊重彼此。",
] as const;
function toneToIndex(v: number): number {
  if (v < 0.125) return 0;
  if (v < 0.375) return 1;
  if (v < 0.625) return 2;
  if (v < 0.875) return 3;
  return 4;
}
function wrapWithInstructions(
  raw: string,
  length: keyof typeof LENGTH_INSTRUCTIONS,
  toneVal: number,
): string {
  return [
    "【寫作指示】",
    `- 長度：${LENGTH_INSTRUCTIONS[length]}`,
    `- 語氣：${TONE_INSTRUCTIONS[toneToIndex(toneVal)]}`,
    "",
    "【家長原始訊息／情境敘述】",
    raw,
  ].join("\n");
}

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button
      type="submit"
      disabled={isPending}
      size="lg"
      className="w-full sm:w-auto px-8 py-6 text-base font-semibold rounded-full bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 hover:brightness-110 transform transition-all duration-300 ease-out hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/70 disabled:opacity-70 disabled:hover:scale-100"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          產生中…
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-5 w-5" />
          產生回覆建議
        </>
      )}
    </Button>
  );
}

/**
 * Direction A 工具列：回覆長度（簡短/標準/詳細）+ 語氣滑桿（極正式 ↔ 非常親切）
 */
function ToneAndLengthToolbar({
  length,
  onLengthChange,
  toneVal,
  onToneChange,
}: {
  length: "short" | "standard" | "detailed";
  onLengthChange: (v: "short" | "standard" | "detailed") => void;
  toneVal: number;
  onToneChange: (v: number) => void;
}) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(false);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const lengthOpts: Array<{ k: "short" | "standard" | "detailed"; label: string; hint: string }> = [
    { k: "short",    label: "簡短", hint: "1–2 句" },
    { k: "standard", label: "標準", hint: "1 段" },
    { k: "detailed", label: "詳細", hint: "完整版" },
  ];

  const setFromX = (clientX: number) => {
    if (!sliderRef.current) return;
    const r = sliderRef.current.getBoundingClientRect();
    const x = clientX - r.left;
    onToneChange(Math.max(0, Math.min(1, x / r.width)));
  };

  useEffect(() => {
    if (!drag) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const cx = "touches" in e ? e.touches[0]?.clientX ?? 0 : (e as MouseEvent).clientX;
      setFromX(cx);
    };
    const onUp = () => setDrag(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [drag]);

  const idx = toneToIndex(toneVal);

  return (
    <div className="da-toolbar">
      <div>
        <h5>回覆長度</h5>
        <div className="da-seg">
          {lengthOpts.map((o) => (
            <button
              type="button"
              key={o.k}
              className={length === o.k ? "on" : ""}
              onClick={() => onLengthChange(o.k)}
            >
              {o.label}
              <span className="hint">{o.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <h5>語氣調整</h5>
        <div className="da-tone">
          <div className="da-tone-row">
            <span className="da-tone-end">📋 正式</span>
            <div
              className="da-slider"
              ref={sliderRef}
              onMouseDown={(e) => {
                setDrag(true);
                setFromX(e.clientX);
              }}
              onTouchStart={(e) => {
                setDrag(true);
                setFromX(e.touches[0].clientX);
              }}
            >
              <div className="da-track" />
              {ticks.map((t) => (
                <div key={t} className="da-tick" style={{ left: t * 100 + "%" }} />
              ))}
              <div className="da-fill" style={{ width: toneVal * 100 + "%" }} />
              <div className="da-knob" style={{ left: toneVal * 100 + "%" }} />
            </div>
            <span className="da-tone-end">🤗 親切</span>
          </div>
          <div className="da-tone-label">
            語氣：<b>{TONE_LABELS[idx]}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReplyGeneratorForm() {
  const [state, setState] = useState<ActionResult>({});
  const [isPending, startTransition] = useTransition();
  const [generatedReply, setGeneratedReply] = useState<string | undefined>();
  const [isScenarioSelectOpen, setIsScenarioSelectOpen] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const replyCardRef = useRef<HTMLDivElement>(null);
  const [uploadedImage, setUploadedImage] = useState<ProcessedImage | null>(null);

  // Direction A 工具列：回覆長度 + 語氣 — 透過 instruction 前綴注入到 prompt
  const [length, setLength] = useState<"short" | "standard" | "detailed">("standard");
  const [toneVal, setToneVal] = useState<number>(0.6);

  // PII 警示狀態：偵測到敏感資料時暫停送出，等使用者確認
  const [piiDialog, setPiiDialog] = useState<{
    open: boolean;
    warnings: PIIWarning[];
    pendingData: FormSchemaType | null;
  }>({ open: false, warnings: [], pendingData: null });

  const { toast } = useToast();
  const copyToClipboard = useCopyToClipboard();
  const progress = useFakeProgress(isPending, !!generatedReply);
  const {
    items: historyItems,
    hydrated: historyHydrated,
    add: addHistory,
    remove: removeHistory,
    clear: clearHistory,
    max: historyMax,
  } = useHistory();

  const {
    defaults: savedDefaults,
    hydrated: defaultsHydrated,
    save: saveDefaults,
    clear: clearDefaults,
  } = useFormDefaults();

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scenario: "",
      parentMessage: "",
      schoolName: "",
      teacherName: "",
      studentGrade: "",
      notes: "",
    },
  });

  // 偏好設定載入後，補回表單（不覆蓋使用者已輸入的）
  useEffect(() => {
    if (!defaultsHydrated) return;
    const current = form.getValues();
    if (savedDefaults.schoolName && !current.schoolName) {
      form.setValue("schoolName", savedDefaults.schoolName);
    }
    if (savedDefaults.teacherName && !current.teacherName) {
      form.setValue("teacherName", savedDefaults.teacherName);
    }
    if (savedDefaults.studentGrade && !current.studentGrade) {
      form.setValue("studentGrade", savedDefaults.studentGrade);
    }
  }, [defaultsHydrated, savedDefaults, form]);

  // 結果處理：成功 → 加入歷史 + scroll；錯誤 → toast；fieldErrors → form.setError
  useEffect(() => {
    if (state?.reply) {
      setGeneratedReply(state.reply);
      const formData = form.getValues();
      if (formData.scenario && formData.parentMessage) {
        addHistory({
          scenario: formData.scenario,
          scenarioLabel: getScenarioLabel(formData.scenario),
          parentMessage: formData.parentMessage,
          reply: state.reply,
        });
      }
      toast({
        title: "回覆已產生！",
        description: "小幫手已建議一個回覆，並自動存入歷史紀錄。",
        variant: "success",
      });
      setTimeout(() => {
        replyCardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
    if (state?.error && !state?.fieldErrors) {
      toast({
        variant: "destructive",
        title: "產生回覆時發生錯誤",
        description: state.error,
      });
    }
    if (state?.fieldErrors?.scenario) {
      form.setError("scenario", {
        type: "server",
        message: state.fieldErrors.scenario[0],
      });
    }
    if (state?.fieldErrors?.parentMessage) {
      form.setError("parentMessage", {
        type: "server",
        message: state.fieldErrors.parentMessage[0],
      });
    }
  }, [state, toast, form, addHistory]);

  const handleCopyReply = useCallback(() => {
    if (generatedReply) void copyToClipboard(generatedReply);
  }, [generatedReply, copyToClipboard]);

  const handleApplyHistory = useCallback(
    (entry: HistoryEntry) => {
      form.reset({
        scenario: entry.scenario,
        parentMessage: entry.parentMessage,
      });
      setGeneratedReply(entry.reply);
      setState({});
      toast({
        title: "已套回表單",
        description: `已載入「${entry.scenarioLabel}」這份紀錄。`,
        variant: "success",
      });
      setTimeout(() => {
        replyCardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    },
    [form, toast],
  );

  // refine 模式：把目前 reply + 修改方向送回 callable，產出修訂版回覆
  const handleRefine = useCallback(
    (instruction: RefineInstruction) => {
      if (!generatedReply) return;
      if (!turnstileToken) {
        toast({
          variant: "destructive",
          title: "請先完成人機驗證",
          description: "重新調整也需要過驗證。等下方驗證綠色「成功！」再點。",
        });
        return;
      }
      const formData = form.getValues();
      if (!formData.scenario || !formData.parentMessage) return;
      setState({});
      startTransition(async () => {
        const result = await generateReply({
          scenario: formData.scenario,
          parentMessage: wrapWithInstructions(formData.parentMessage, length, toneVal),
          turnstileToken,
          refineInstruction: instruction,
          previousReply: generatedReply,
          schoolName: formData.schoolName || undefined,
          teacherName: formData.teacherName || undefined,
          studentGrade: formData.studentGrade || undefined,
          notes: formData.notes || undefined,
          // refine 時不需要再傳一次圖（previousReply 已含 OCR 結果），
          // 省下一次 multimodal token 也避免延遲
        });
        setState(result);
        turnstileRef.current?.reset();
        setTurnstileToken("");
      });
    },
    [generatedReply, turnstileToken, form, toast, length, toneVal],
  );

  const handleResetForm = useCallback(() => {
    // 重設只清空情境 / 訊息 / 截圖，保留進階情境（學校/老師/年級）方便下次連續使用
    form.reset({
      scenario: "",
      parentMessage: "",
      schoolName: form.getValues("schoolName") ?? "",
      teacherName: form.getValues("teacherName") ?? "",
      studentGrade: form.getValues("studentGrade") ?? "",
      notes: "",
    });
    setGeneratedReply(undefined);
    setState({});
    setTurnstileToken("");
    setUploadedImage(null);
    turnstileRef.current?.reset();
    toast({
      title: "已重設",
      description: "表單已清空（保留進階情境設定），可開始新的回覆草稿。",
    });
  }, [form, toast]);

  const handleSaveDefaults = useCallback(() => {
    const v = form.getValues();
    saveDefaults({
      schoolName: v.schoolName?.trim() || undefined,
      teacherName: v.teacherName?.trim() || undefined,
      studentGrade: v.studentGrade?.trim() || undefined,
    });
    toast({
      title: "預設已儲存",
      description: "下次打開網站會自動帶入學校／老師／年級。",
      variant: "success",
    });
  }, [form, saveDefaults, toast]);

  const handleClearDefaults = useCallback(() => {
    clearDefaults();
    toast({
      title: "預設已清除",
      description: "下次打開不會自動帶入。當前表單值不變。",
    });
  }, [clearDefaults, toast]);

  const hasSavedDefaults = !!(
    savedDefaults.schoolName ||
    savedDefaults.teacherName ||
    savedDefaults.studentGrade
  );

  const actuallySubmit = useCallback(
    (data: FormSchemaType) => {
      setGeneratedReply(undefined);
      setState({});
      startTransition(async () => {
        const result = await generateReply({
          scenario: data.scenario,
          parentMessage: wrapWithInstructions(data.parentMessage, length, toneVal),
          turnstileToken,
          schoolName: data.schoolName || undefined,
          teacherName: data.teacherName || undefined,
          studentGrade: data.studentGrade || undefined,
          notes: data.notes || undefined,
          imageDataUrl: uploadedImage?.dataUrl,
        });
        setState(result);
        // 用過的 token 立即重置（單次有效）
        turnstileRef.current?.reset();
        setTurnstileToken("");
      });
    },
    [turnstileToken, uploadedImage, length, toneVal],
  );

  const handleSubmit = (data: FormSchemaType) => {
    // 條件式驗證：訊息與截圖至少要有一個；只有訊息時要 ≥ 5 字
    const msg = (data.parentMessage ?? "").trim();
    const hasImage = !!uploadedImage;
    if (!msg && !hasImage) {
      form.setError("parentMessage", {
        type: "manual",
        message: "請貼上家長訊息、簡述情況，或上傳一張對話截圖。",
      });
      return;
    }
    if (!hasImage && msg.length < 5) {
      form.setError("parentMessage", {
        type: "manual",
        message: "若沒附截圖，訊息至少需 5 個字元。",
      });
      return;
    }

    if (!turnstileToken) {
      toast({
        variant: "destructive",
        title: "請先完成人機驗證",
        description: "請等待右側「我不是機器人」驗證完成後再送出。",
      });
      return;
    }

    // 個資警示：偵測到敏感資料時跳 confirm dialog 提醒（只有訊息有內容才檢查）
    if (msg) {
      const warnings = detectPII(msg);
      if (warnings.length > 0) {
        setPiiDialog({ open: true, warnings, pendingData: data });
        return;
      }
    }

    actuallySubmit(data);
  };

  const handlePiiConfirm = useCallback(() => {
    const data = piiDialog.pendingData;
    setPiiDialog({ open: false, warnings: [], pendingData: null });
    if (data) actuallySubmit(data);
  }, [piiDialog.pendingData, actuallySubmit]);

  const handlePiiCancel = useCallback(() => {
    setPiiDialog({ open: false, warnings: [], pendingData: null });
  }, []);

  // 步驟提示文字 — 有訊息或截圖任一即可進入第 2 步
  const parentMsgValue = form.watch("parentMessage") ?? "";
  const hasInput = parentMsgValue.trim().length > 0 || !!uploadedImage;
  const stepText = !hasInput
    ? "1️⃣ 貼上訊息或上傳截圖"
    : !generatedReply && !isPending
      ? "2️⃣ 點擊產生"
      : isPending
        ? "✨ 正在思考…"
        : "✅ 回覆完成";

  return (
    <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 lg:gap-8 items-start animate-fade-up">
      {/* === 左欄：主對話卡 + 結果 === */}
      <div className="min-w-0">
      <Card className="overflow-hidden border-primary/15 shadow-2xl shadow-primary/10 bg-card/95 backdrop-blur-sm rounded-3xl">
        <CardHeader className="relative p-5 sm:p-6 bg-gradient-to-br from-primary/8 via-secondary/40 to-accent/8 border-b border-dashed border-border/60">
          {/* 對話草稿區 + 步驟 pill — 左側「回」徽章 + 副標、右側 step pill / HistoryPanel 入口 */}
          <div className="relative flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-lg shadow-md shadow-primary/30">
                回
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
                  對話草稿區
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  家長訊息 · 選擇情境 · 產生回覆
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="da-step-pill">{stepText}</span>
              {historyHydrated && (
                <div className="lg:hidden">
                  <HistoryPanel
                    items={historyItems}
                    max={historyMax}
                    onApply={handleApplyHistory}
                    onRemove={removeHistory}
                    onClear={clearHistory}
                    onCopy={(text) => void copyToClipboard(text)}
                  />
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-8"
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit(handleSubmit)();
              }}
            >
              <FormField
                control={form.control}
                name="scenario"
                render={({ field }) => {
                  const idx = SCENARIOS.findIndex((s) => s.value === field.value);
                  const selectedScenario = idx !== -1 ? SCENARIOS[idx] : null;
                  const triggerCls = selectedScenario
                    ? "w-full font-semibold border-primary/40 bg-secondary/60"
                    : "w-full bg-background";
                  return (
                    <FormItem>
                      <FormLabel className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold rounded-full bg-secondary text-secondary-foreground border border-border/70 shadow-sm">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                        選擇情境
                      </FormLabel>
                      <Select
                        open={isScenarioSelectOpen}
                        onOpenChange={setIsScenarioSelectOpen}
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger
                            className={triggerCls}
                            style={
                              selectedScenario
                                ? { color: selectedScenario.color }
                                : undefined
                            }
                          >
                            {selectedScenario ? (
                              <span className="flex items-center gap-2">
                                <span
                                  className="inline-flex items-center justify-center rounded-md text-base"
                                  style={{
                                    width: 24,
                                    height: 24,
                                    background: selectedScenario.color + "22",
                                    color: selectedScenario.color,
                                  }}
                                >
                                  {selectedScenario.icon}
                                </span>
                                {selectedScenario.label}
                              </span>
                            ) : (
                              <SelectValue placeholder="選擇一個常見情況" />
                            )}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover/95 backdrop-blur-sm border-border/70 shadow-xl rounded-xl">
                          {SCENARIOS.map((s) => (
                            <SelectItem
                              key={s.value}
                              value={s.value}
                              className="p-2 rounded-md my-0.5 mx-1 hover:bg-secondary/70 focus:bg-secondary data-[state=checked]:bg-secondary font-medium cursor-pointer"
                              style={{ color: s.color }}
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className="inline-flex items-center justify-center rounded-md text-base"
                                  style={{
                                    width: 24,
                                    height: 24,
                                    background: s.color + "22",
                                    color: s.color,
                                  }}
                                >
                                  {s.icon}
                                </span>
                                {s.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        選擇最符合家長訊息的情境，有助於小幫手提供更精準的回覆建議。
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <AdvancedSettings
                form={form}
                onSaveDefaults={handleSaveDefaults}
                onClearDefaults={handleClearDefaults}
                hasDefaults={hasSavedDefaults}
              />

              <FormField
                control={form.control}
                name="parentMessage"
                render={({ field }) => {
                  const len = field.value?.length ?? 0;
                  const hasImage = !!uploadedImage;
                  // hint 邏輯：
                  // - 有圖片：訊息為非必填（綠色），有訊息時仍提示字數
                  // - 沒圖片：原規則（≥5 字才能送）
                  const hint = hasImage
                    ? len === 0
                      ? { text: "📷 已附截圖，AI 會直接讀圖，文字非必填 ✓", tone: "good" as const }
                      : len > 1500
                        ? { text: `${len} 字元 — 訊息較長，AI 處理時間可能延長`, tone: "warn" as const }
                        : { text: `${len} 字元 — 連同截圖一起送 ✓`, tone: "good" as const }
                    : len === 0
                      ? { text: "您提供的上下文越多，小幫手的建議就會越好。", tone: "muted" as const }
                      : len < 5
                        ? { text: `${len} 字元 — 至少需要 5 個字元（或改附截圖）`, tone: "warn" as const }
                        : len > 1500
                          ? { text: `${len} 字元 — 訊息較長，AI 處理時間可能延長`, tone: "warn" as const }
                          : { text: `${len} 字元 — 可送出 ✓`, tone: "good" as const };
                  const toneCls =
                    hint.tone === "good"
                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                      : hint.tone === "warn"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground";
                  return (
                    <FormItem>
                      <FormLabel className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold rounded-full bg-secondary text-secondary-foreground border border-border/70 shadow-sm">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" />
                        家長訊息 / 陳述狀況
                        {hasImage && (
                          <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                            （已附截圖・可不填）
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={
                            hasImage
                              ? "已附截圖，AI 會直接讀圖。如有額外想補充的細節再填這裡（選填）..."
                              : "在此貼上家長的訊息，或簡要描述情況..."
                          }
                          rows={6}
                          {...field}
                          className="mt-1 block w-full rounded-md shadow-sm p-3 bg-input text-foreground focus:ring-2 focus:ring-accent focus:border-accent hover:shadow-lg transition-all duration-300 ease-in-out placeholder-muted-foreground"
                        />
                      </FormControl>
                      <FormDescription className={toneCls}>
                        {hint.text}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Direction A 工具列：回覆長度 + 語氣調整 */}
              <ToneAndLengthToolbar
                length={length}
                onLengthChange={setLength}
                toneVal={toneVal}
                onToneChange={setToneVal}
              />

              <ImageUpload
                value={uploadedImage}
                onChange={setUploadedImage}
                disabled={isPending}
              />

              <div className="space-y-3">
                {/* Cloudflare Turnstile：保護 Gemini API quota 不被腳本攻擊耗用 */}
                {TURNSTILE_SITE_KEY && (
                  <div className="flex flex-col items-center gap-1">
                    <TurnstileWidget
                      ref={turnstileRef}
                      siteKey={TURNSTILE_SITE_KEY}
                      onVerify={(token) => setTurnstileToken(token)}
                      onExpire={() => setTurnstileToken("")}
                      onError={() => setTurnstileToken("")}
                    />
                    <p className="text-xs text-muted-foreground">
                      由 Cloudflare Turnstile 驗證您不是機器人，無感且不需點選圖片。
                    </p>
                  </div>
                )}

                {isPending && !generatedReply && progress > 0 && (
                  <Progress value={progress} className="w-full h-3" />
                )}
                <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-3 p-0 pt-2">
                  <SubmitButton isPending={isPending} />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={handleResetForm}
                    className="w-full sm:w-auto transform transition-transform duration-300 ease-in-out hover:scale-105 active:scale-100"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    重設表單
                  </Button>
                </CardFooter>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isPending && !generatedReply && <LoadingCard />}

      {state?.error && !state.fieldErrors && !isPending && (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>錯誤</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {generatedReply && (
        <GeneratedReplyCard
          ref={replyCardRef}
          reply={generatedReply}
          onCopy={handleCopyReply}
          onRefine={handleRefine}
          isRefining={isPending}
          refineDisabled={!turnstileToken}
        />
      )}

      {/* PII 個資警示 Dialog */}
      <AlertDialog
        open={piiDialog.open}
        onOpenChange={(open) => {
          if (!open) handlePiiCancel();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              偵測到敏感個資
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p>您的訊息中包含以下個資，建議移除後再送出，避免不必要外流：</p>
                <ul className="space-y-1.5">
                  {piiDialog.warnings.map((w) => (
                    <li
                      key={w.type}
                      className="text-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded px-3 py-2"
                    >
                      <span className="font-semibold">{w.type}</span>
                      <span className="ml-2 text-muted-foreground">
                        {w.matches.map(maskPII).join("、")}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                  AI 處理過程會把訊息傳到 Google Gemini，個資也會被傳送。
                  如果這些資訊對 AI 產生回覆並非必要，建議先移除。
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handlePiiCancel}>
              取消，回去修改
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePiiConfirm}
              className="bg-amber-600 hover:bg-amber-700"
            >
              我已確認，繼續送出
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
      {/* === 右欄：側欄歷史紀錄（≥ lg 才顯示，手機用 CardHeader 內的 HistoryPanel）=== */}
      {historyHydrated && (
        <div className="hidden lg:block">
          <SideHistory items={historyItems} onApply={handleApplyHistory} />
        </div>
      )}
    </div>
  );
}
