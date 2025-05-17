
// src/components/ReplyGeneratorForm.tsx
"use client";

import { useState, useEffect, useTransition, useActionState as useActionStateReact, useRef } from "react";
import { useFormStatus } from "react-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { handleGenerateReplyAction } from "@/lib/actions";
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
import { useToast } from "@/hooks/use-toast";
import { BotMessageSquare, Sparkles, Copy, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const formSchema = z.object({
  scenario: z.string({ required_error: "請選擇一個情境。" }).min(1, "必須填寫情境。"),
  parentMessage: z.string().min(10, { message: "家長訊息至少需10個字元。" }),
});

type FormSchemaType = z.infer<typeof formSchema>;

const scenarios = [
  { value: "Child Injury", label: "孩童受傷" },
  { value: "Serious Conflict", label: "嚴重衝突" },
  { value: "Irrational Message", label: "回應不理性訊息" },
  { value: "Academic Concern", label: "學業問題" },
  { value: "Behavioral Issue", label: "行為問題" },
  { value: "Positive Feedback", label: "家長正面回饋" },
  { value: "Request for Meeting", label: "家長要求會面" },
  { value: "Missed Homework/Assignment", label: "缺交作業" },
  { value: "Upcoming Event Inquiry", label: "活動詢問" },
  { value: "Health Concern", label: "健康問題（如過敏、生病）" },
  { value: "General Inquiry", label: "一般詢問" },
  { value: "Other", label: "其他" },
];

const optionColors = [
  "text-red-500",
  "text-blue-500",
  "text-green-500",
  "text-yellow-500",
  "text-purple-500",
  "text-pink-500",
  "text-indigo-500",
  "text-teal-500",
  "text-orange-500",
  "text-cyan-500",
  "text-lime-500",
  "text-emerald-500",
];

const initialState = {
  reply: undefined,
  error: undefined,
  fieldErrors: undefined,
};

interface SubmitButtonProps {
  isPending: boolean;
}

function SubmitButton({ isPending }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isPending}
      className={`w-full sm:w-auto bg-warm-orange-red text-warm-orange-red-foreground hover:bg-warm-orange-red/90 
                 transform transition-transform duration-300 ease-in-out 
                 hover:scale-110 active:scale-105 
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warm-orange-red/80`}
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
  const [state, formAction, isActionPendingOriginal] = useActionStateReact(handleGenerateReplyAction, initialState);
  const [isTransitionPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [generatedReply, setGeneratedReply] = useState<string | undefined>(undefined);
  const [progress, setProgress] = useState(0); // State for progress bar
  const replyCardRef = useRef<HTMLDivElement>(null); // Ref for scrolling

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scenario: "",
      parentMessage: "",
    },
  });

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    const isActive = isTransitionPending || isActionPendingOriginal;

    if (isActive && !generatedReply) {
      setProgress(10); // Start with a bit of progress
      let currentProgress = 10;
      timer = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 10) + 5;
        if (currentProgress >= 95) { // Go up to 95% while pending
          setProgress(95);
          clearInterval(timer);
        } else {
          setProgress(currentProgress);
        }
      }, 400);
    } else {
      clearInterval(timer);
      if (generatedReply) { // When reply is received
        setProgress(100);
        setTimeout(() => {
          setProgress(0); // Reset after a short delay
        }, 500); 
      } else if (!isActive) { // If pending stops for other reasons (e.g. error, or initial load)
        setProgress(0);
      }
    }

    return () => {
      clearInterval(timer);
    };
  }, [isTransitionPending, isActionPendingOriginal, generatedReply]);

  useEffect(() => {
    if (state?.reply) {
      setGeneratedReply(state.reply);
      toast({
        title: "回覆已產生！",
        description: "小幫手已建議一個回覆。",
      });
      // form.reset(); // Removed to keep form input values
      // Scroll to reply section
      setTimeout(() => {
        replyCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100); // Delay to allow DOM update
    }
    if (state?.error && !state?.fieldErrors) {
      toast({
        variant: "destructive",
        title: "產生回覆時發生錯誤",
        description: state.error,
      });
    }
     if (state?.fieldErrors?.scenario) {
      form.setError("scenario", { type: "server", message: state.fieldErrors.scenario[0] });
    }
    if (state?.fieldErrors?.parentMessage) {
      form.setError("parentMessage", { type: "server", message: state.fieldErrors.parentMessage[0] });
    }
  }, [state, toast, form]);


  const handleCopyReply = () => {
    if (generatedReply) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(generatedReply).then(() => {
          toast({
            title: "回覆已複製！",
            description: "建議的回覆已複製到您的剪貼簿 (API)。",
          });
        }).catch(err => {
          console.warn("Clipboard API 複製失敗，嘗試備援方法: ", err);
          try {
            const textArea = document.createElement("textarea");
            textArea.value = generatedReply;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) {
              toast({
                title: "回覆已複製！",
                description: "建議的回覆已複製到您的剪貼簿 (備援)。",
              });
            } else {
              throw new Error('備援複製指令失敗');
            }
          } catch (fallbackErr) {
            console.error("備援複製方法也失敗了: ", fallbackErr);
            toast({
              variant: "destructive",
              title: "複製失敗",
              description: "抱歉，無法自動複製回覆到剪貼簿。請手動複製。",
            });
          }
        });
      } else {
        try {
          const textArea = document.createElement("textarea");
          textArea.value = generatedReply;
          textArea.style.position = "fixed";
          textArea.style.left = "-9999px";
          textArea.style.top = "-9999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          if (successful) {
            toast({
              title: "回覆已複製！",
              description: "建議的回覆已複製到您的剪貼簿 (備援)。",
            });
          } else {
            throw new Error('備援複製指令失敗');
          }
        } catch (fallbackErr) {
          console.error("備援複製方法失敗: ", fallbackErr);
          toast({
            variant: "destructive",
            title: "複製失敗",
            description: "抱歉，無法自動複製回覆到剪貼簿。請手動複製。",
          });
        }
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-xl bg-gradient-to-br from-rose-50 via-purple-50 to-sky-50 dark:from-rose-900/50 dark:via-purple-900/50 dark:to-sky-900/50">
        <CardHeader className="text-center bg-primary/5 p-6">
          <div className="flex items-center justify-center mb-2">
            <BotMessageSquare className="h-10 w-10 text-primary mr-3" />
            <CardTitle className="text-4xl font-bold tracking-tight text-primary">教師回應訊息建議小幫手</CardTitle>
          </div>
          <CardDescription className="text-lg text-muted-foreground/90 mt-1">
            為家長訊息獲取小幫手支援的同理心與專業回覆建議。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-8"
              onSubmit={(evt) => {
                evt.preventDefault();
                form.handleSubmit(
                    (data) => {
                        const formData = new FormData();
                        formData.append("scenario", data.scenario);
                        formData.append("parentMessage", data.parentMessage);
                        setGeneratedReply(undefined); // Clear previous reply
                        setProgress(0); // Reset progress
                        startTransition(() => {
                           formAction(formData);
                        });
                    }
                )();
            }}>
              <FormField
                control={form.control}
                name="scenario"
                render={({ field }) => {
                  const selectedScenarioValue = field.value;
                  const selectedScenarioIndex = scenarios.findIndex(s => s.value === selectedScenarioValue);
                  
                  let triggerStyleClasses = "w-full";
                  if (selectedScenarioIndex !== -1) {
                    triggerStyleClasses = `w-full ${optionColors[selectedScenarioIndex % optionColors.length]} bg-gradient-to-r from-pink-100 via-purple-100 to-indigo-100 dark:from-pink-900/70 dark:via-purple-900/70 dark:to-indigo-900/70 font-medium`;
                  }

                  return (
                    <FormItem>
                      <FormLabel className="inline-block px-3 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-500 rounded-lg shadow-md border border-indigo-600/50">選擇情境</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger className={triggerStyleClasses}>
                            <SelectValue placeholder="選擇一個常見情況" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400">
                          {scenarios.map((s, index) => (
                            <SelectItem 
                              key={s.value} 
                              value={s.value} 
                              className={`${optionColors[index % optionColors.length]} p-2 rounded-md my-0.5 mx-1 bg-white/80 dark:bg-neutral-800/80 hover:bg-white/95 dark:hover:bg-neutral-900/90 font-medium`}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        選擇最符合家長訊息的情境，有助於小幫手提供更精準的回覆建議。下拉式選單將提供多種情境選項，讓老師可以挑選到最合適的狀況，並連動小幫手產生回覆。
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="parentMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="inline-block px-3 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg shadow-md border border-teal-600/50">家長訊息or陳述狀況</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="在此貼上家長的訊息，或簡要描述情況..."
                        rows={6}
                        {...field}
                        className="mt-1 block w-full rounded-md shadow-sm p-3 bg-gradient-to-br from-rose-100 via-fuchsia-100 to-indigo-100 dark:from-rose-900 dark:via-fuchsia-900 dark:to-indigo-900 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 hover:shadow-lg dark:hover:shadow-fuchsia-700/50 transition-all duration-300 ease-in-out placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100"
                      />
                    </FormControl>
                    <FormDescription>
                      您提供的上下文越多，小幫手的建議就會越好。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(isTransitionPending || isActionPendingOriginal) && !generatedReply && progress > 0 && (
                <div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              <CardFooter className="flex justify-center p-0 pt-6">
                <SubmitButton isPending={isTransitionPending || isActionPendingOriginal} />
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>

      {(isTransitionPending || isActionPendingOriginal) && !generatedReply && (
         <Card className="mt-6 shadow-xl bg-gradient-to-br from-rose-50 via-purple-50 to-sky-50 dark:from-rose-900/50 dark:via-purple-900/50 dark:to-sky-900/50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center text-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              正在產生建議回覆...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Progress bar removed from here */}
            <Skeleton className="h-4 w-3/4 bg-muted/50" />
            <Skeleton className="h-4 w-full bg-muted/50" />
            <Skeleton className="h-4 w-full bg-muted/50" />
            <Skeleton className="h-4 w-1/2 bg-muted/50" />
          </CardContent>
        </Card>
      )}

      {state?.error && !state.fieldErrors && !(isTransitionPending || isActionPendingOriginal) && (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>錯誤</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {generatedReply && !(isTransitionPending || isActionPendingOriginal) && (
        <Card ref={replyCardRef} className="mt-6 shadow-xl bg-gradient-to-br from-rose-50 via-purple-50 to-sky-50 dark:from-rose-900/50 dark:via-purple-900/50 dark:to-sky-900/50">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">建議回覆</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={generatedReply}
              readOnly
              rows={8}
              className="w-full rounded-md shadow-sm p-3 bg-muted text-foreground border-border hover:border-primary/50 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300 ease-in-out leading-relaxed"
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={handleCopyReply} 
              variant="default"
              className={`transform transition-transform duration-300 ease-in-out hover:scale-110 active:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/80`}>
              <Copy className="mr-2 h-4 w-4" />
              複製回覆
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

