// src/components/ReplyGeneratorForm.tsx
"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
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
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

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

const initialState: {
  reply?: string;
  error?: string;
  fieldErrors?: { scenario?: string[]; parentMessage?: string[] };
} = {
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
  const [state, formAction, isActionPendingOriginal] = useActionState(handleGenerateReplyAction, initialState);
  const [isTransitionPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [generatedReply, setGeneratedReply] = useState<string | undefined>(undefined);
  const [progress, setProgress] = useState(0);
  const replyCardRef = useRef<HTMLDivElement>(null);
  const [isScenarioSelectOpen, setIsScenarioSelectOpen] = useState(false);

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scenario: "",
      parentMessage: "",
    },
  });
  
  useEffect(() => {
    if (state?.reply && !isTransitionPending && !isActionPendingOriginal) {
      // Values are kept, form.reset is not called here
    } else if (!state?.reply && !state?.error && !state?.fieldErrors && !isTransitionPending && !isActionPendingOriginal) {
      // If there was no reply, no error, no field errors, and not pending,
      // it implies a reset or initial state might be desired by some logic,
      // but for keeping values, we do nothing here.
    }
  }, [state, isTransitionPending, isActionPendingOriginal, form]);


  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    const isActive = isTransitionPending || isActionPendingOriginal;

    if (isActive && !generatedReply) {
      setProgress(10);
      let currentProgress = 10;
      timer = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 10) + 5;
        if (currentProgress >= 95) {
          setProgress(95);
          clearInterval(timer);
        } else {
          setProgress(currentProgress);
        }
      }, 400);
    } else {
      clearInterval(timer);
      if (generatedReply) {
        setProgress(100);
        setTimeout(() => {
          setProgress(0); 
        }, 500);
      } else if (!isActive) {
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
      setTimeout(() => {
        replyCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        // Fallback for browsers that don't support navigator.clipboard
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

  const isCurrentlyPending = isTransitionPending || isActionPendingOriginal;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-xl bg-card">
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
                        setGeneratedReply(undefined);
                        setProgress(0); 
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
                  if (selectedScenarioValue && selectedScenarioIndex !== -1) {
                    triggerStyleClasses = `w-full ${optionColors[selectedScenarioIndex % optionColors.length]} bg-gradient-to-r from-pink-100 via-purple-100 to-indigo-100 dark:from-pink-900/70 dark:via-purple-900/70 dark:to-indigo-900/70 font-medium`;
                  } else {
                     triggerStyleClasses = "w-full bg-background"; 
                  }

                  return (
                    <FormItem>
                      <FormLabel className="inline-block px-3 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-500 rounded-lg shadow-md border border-indigo-600/50">選擇情境</FormLabel>
                      <Select
                        open={isScenarioSelectOpen}
                        onOpenChange={setIsScenarioSelectOpen}
                        onValueChange={(value) => {
                          field.onChange(value);
                        }}
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
                        className="mt-1 block w-full rounded-md shadow-sm p-3 bg-input text-foreground focus:ring-2 focus:ring-accent focus:border-accent hover:shadow-lg transition-all duration-300 ease-in-out placeholder-muted-foreground"
                      />
                    </FormControl>
                    <FormDescription>
                      您提供的上下文越多，小幫手的建議就會越好。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2"> 
                {isCurrentlyPending && !generatedReply && progress > 0 && (
                    <Progress value={progress} className="w-full h-3" />
                )}
                <CardFooter className="flex justify-center p-0 pt-2">
                    <SubmitButton isPending={isCurrentlyPending} />
                </CardFooter>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isCurrentlyPending && !generatedReply && (
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
      )}

      {state?.error && !state.fieldErrors && !isCurrentlyPending && (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>錯誤</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {generatedReply && !isCurrentlyPending && (
        <Card ref={replyCardRef} className="mt-6 shadow-xl bg-card">
          <CardHeader className="text-center p-4 rounded-t-lg bg-gradient-to-br from-primary/20 via-accent/15 to-secondary/20 border-b border-border shadow-sm">
            <CardTitle className="text-2xl font-bold text-primary tracking-tight">
              建議回覆
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div
              className={cn(
                "w-full rounded-md shadow-sm p-3 border text-sm",
                "bg-gradient-to-br from-primary/5 via-background to-accent/5 dark:from-primary/20 dark:via-black/10 dark:to-accent/20",
                "text-foreground border-border",
                "transition-all duration-300 ease-in-out leading-relaxed",
                "generated-reply-textarea min-h-[160px]" 
              )}
            >
              <ReactMarkdown
                components={{
                  // Optional: Add custom renderers here if needed
                  // e.g., p: ({node, ...props}) => <p className="my-2" {...props} />
                }}
              >
                {generatedReply}
              </ReactMarkdown>
            </div>
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

