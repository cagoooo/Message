
// src/components/ReplyGeneratorForm.tsx
"use client";

import { useState, useEffect, useActionState } from "react";
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

const initialState = {
  reply: undefined,
  error: undefined,
  fieldErrors: undefined,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
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
  const [state, formAction] = useActionState(handleGenerateReplyAction, initialState);
  const { toast } = useToast();
  const [generatedReply, setGeneratedReply] = useState<string | undefined>(undefined);

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scenario: "",
      parentMessage: "",
    },
  });

  useEffect(() => {
    if (state?.reply) {
      setGeneratedReply(state.reply);
      toast({
        title: "回覆已產生！",
        description: "AI已建議一個回覆。",
      });
      form.reset();
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
      navigator.clipboard.writeText(generatedReply).then(() => {
        toast({
          title: "回覆已複製！",
          description: "建議的回覆已複製到您的剪貼簿。",
        });
      }).catch(err => {
        console.error("複製失敗: ", err);
        toast({
          variant: "destructive",
          title: "複製失敗",
          description: "無法將回覆複製到剪貼簿。",
        });
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <BotMessageSquare className="h-10 w-10 text-primary mr-2" />
            <CardTitle className="text-3xl font-bold">教師AI助理</CardTitle>
          </div>
          <CardDescription className="text-md">
            為家長訊息獲取AI支援的同理心與專業回覆建議。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form action={formAction} className="space-y-6" onSubmit={form.handleSubmit(
                (data) => {
                    const formData = new FormData();
                    formData.append("scenario", data.scenario);
                    formData.append("parentMessage", data.parentMessage);
                    setGeneratedReply(undefined); // Clear previous reply when submitting
                    formAction(formData);
                }
            )}>
              <FormField
                control={form.control}
                name="scenario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>選擇情境</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇一個常見情況" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {scenarios.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      選擇最符合家長訊息的情境，有助於AI提供更精準的回覆建議。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parentMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>家長訊息</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="在此貼上家長的訊息，或簡要描述情況..."
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      您提供的上下文越多，AI的建議就會越好。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <CardFooter className="flex justify-center p-0 pt-4">
                <SubmitButton />
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>

      {useFormStatus().pending && !generatedReply && (
         <Card className="mt-6 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              正在產生建議回覆...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      )}

      {state?.error && !state.fieldErrors && !useFormStatus().pending && (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>錯誤</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {generatedReply && !useFormStatus().pending && (
        <Card className="mt-6 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">建議回覆</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={generatedReply}
              readOnly
              rows={8}
              className="w-full bg-secondary/30 text-foreground p-3 rounded-md shadow-inner text-sm leading-relaxed focus-visible:ring-accent border-border"
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleCopyReply} variant="outline">
              <Copy className="mr-2 h-4 w-4" />
              複製回覆
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
