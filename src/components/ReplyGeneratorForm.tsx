"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { generateReply, type ActionResult } from "@/lib/actions";
import { useHistory, type HistoryEntry } from "@/hooks/use-history";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useFakeProgress } from "@/hooks/use-fake-progress";
import { useToast } from "@/hooks/use-toast";
import { HistoryPanel } from "@/components/HistoryPanel";
import { GeneratedReplyCard } from "@/components/reply-generator/GeneratedReplyCard";
import { LoadingCard } from "@/components/reply-generator/LoadingCard";
import {
  SCENARIOS,
  OPTION_COLORS,
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
  parentMessage: z.string().min(10, { message: "家長訊息至少需10個字元。" }),
});
type FormSchemaType = z.infer<typeof formSchema>;

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button
      type="submit"
      disabled={isPending}
      className="w-full sm:w-auto bg-warm-orange-red text-warm-orange-red-foreground hover:bg-warm-orange-red/90 transform transition-transform duration-300 ease-in-out hover:scale-110 active:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warm-orange-red/80"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          產生中...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          產生回覆建議
        </>
      )}
    </Button>
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

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: { scenario: "", parentMessage: "" },
  });

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

  const handleResetForm = useCallback(() => {
    form.reset({ scenario: "", parentMessage: "" });
    setGeneratedReply(undefined);
    setState({});
    setTurnstileToken("");
    turnstileRef.current?.reset();
    toast({
      title: "已重設",
      description: "表單已清空，可開始新的回覆草稿。",
    });
  }, [form, toast]);

  const handleSubmit = (data: FormSchemaType) => {
    if (!turnstileToken) {
      toast({
        variant: "destructive",
        title: "請先完成人機驗證",
        description: "請等待右側「我不是機器人」驗證完成後再送出。",
      });
      return;
    }
    setGeneratedReply(undefined);
    setState({});
    startTransition(async () => {
      const result = await generateReply({ ...data, turnstileToken });
      setState(result);
      // 用過的 token 立即重置（單次有效）
      turnstileRef.current?.reset();
      setTurnstileToken("");
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-xl bg-card">
        <CardHeader className="text-center bg-primary/5 p-6 relative">
          {historyHydrated && (
            <div className="absolute top-3 right-3">
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
          <div className="flex items-center justify-center mb-2">
            <BotMessageSquare className="h-10 w-10 text-primary mr-3" />
            <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight text-primary">
              教師回應訊息建議小幫手
            </CardTitle>
          </div>
          <CardDescription className="text-base md:text-lg text-muted-foreground/90 mt-1">
            為家長訊息獲取小幫手支援的同理心與專業回覆建議。
          </CardDescription>
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
                  const triggerCls =
                    field.value && idx !== -1
                      ? `w-full ${OPTION_COLORS[idx % OPTION_COLORS.length]} bg-gradient-to-r from-pink-100 via-purple-100 to-indigo-100 dark:from-pink-900/70 dark:via-purple-900/70 dark:to-indigo-900/70 font-medium`
                      : "w-full bg-background";
                  return (
                    <FormItem>
                      <FormLabel className="inline-block px-3 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-500 rounded-lg shadow-md border border-indigo-600/50">
                        選擇情境
                      </FormLabel>
                      <Select
                        open={isScenarioSelectOpen}
                        onOpenChange={setIsScenarioSelectOpen}
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger className={triggerCls}>
                            <SelectValue placeholder="選擇一個常見情況" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400">
                          {SCENARIOS.map((s, i) => (
                            <SelectItem
                              key={s.value}
                              value={s.value}
                              className={`${OPTION_COLORS[i % OPTION_COLORS.length]} p-2 rounded-md my-0.5 mx-1 bg-white/80 dark:bg-neutral-800/80 hover:bg-white/95 dark:hover:bg-neutral-900/90 font-medium`}
                            >
                              {s.label}
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

              <FormField
                control={form.control}
                name="parentMessage"
                render={({ field }) => {
                  const len = field.value?.length ?? 0;
                  const hint =
                    len === 0
                      ? { text: "您提供的上下文越多，小幫手的建議就會越好。", tone: "muted" as const }
                      : len < 10
                        ? { text: `${len} 字元 — 至少需要 10 個字元`, tone: "warn" as const }
                        : len < 50
                          ? { text: `${len} 字元 — 建議補到 50 字以獲得更佳結果`, tone: "warn" as const }
                          : len > 1500
                            ? { text: `${len} 字元 — 訊息較長，AI 處理時間可能延長`, tone: "warn" as const }
                            : { text: `${len} 字元 — 內容充足，可獲得高品質建議 ✓`, tone: "good" as const };
                  const toneCls =
                    hint.tone === "good"
                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                      : hint.tone === "warn"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground";
                  return (
                    <FormItem>
                      <FormLabel className="inline-block px-3 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg shadow-md border border-teal-600/50">
                        家長訊息or陳述狀況
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="在此貼上家長的訊息，或簡要描述情況..."
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

      {generatedReply && !isPending && (
        <GeneratedReplyCard
          ref={replyCardRef}
          reply={generatedReply}
          onCopy={handleCopyReply}
        />
      )}
    </div>
  );
}
