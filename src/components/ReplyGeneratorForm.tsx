// src/components/ReplyGeneratorForm.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
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
  scenario: z.string({ required_error: "Please select a scenario." }).min(1, "Scenario is required."),
  parentMessage: z.string().min(10, { message: "Parent message must be at least 10 characters." }),
});

type FormSchemaType = z.infer<typeof formSchema>;

const scenarios = [
  { value: "Child Injury", label: "Child Injury" },
  { value: "Serious Conflict", label: "Serious Conflict" },
  { value: "Irrational Message", label: "Responding to Irrational Message" },
  { value: "Academic Concern", label: "Academic Concern" },
  { value: "Behavioral Issue", label: "Behavioral Issue" },
  { value: "Other", label: "Other" },
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
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Reply Suggestion
        </>
      )}
    </Button>
  );
}

export function ReplyGeneratorForm() {
  const [state, formAction] = useFormState(handleGenerateReplyAction, initialState);
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
        title: "Reply Generated!",
        description: "The AI has suggested a reply.",
      });
      form.reset(); // Reset form fields after successful generation
    }
    if (state?.error && !state?.fieldErrors) { // Only show general error toast if no field errors
      toast({
        variant: "destructive",
        title: "Error Generating Reply",
        description: state.error,
      });
    }
    // Field errors are handled by FormMessage components if they exist in state.fieldErrors
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
          title: "Reply Copied!",
          description: "The suggested reply has been copied to your clipboard.",
        });
      }).catch(err => {
        console.error("Failed to copy: ", err);
        toast({
          variant: "destructive",
          title: "Copy Failed",
          description: "Could not copy the reply to clipboard.",
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
            <CardTitle className="text-3xl font-bold">Teacher's AI Assistant</CardTitle>
          </div>
          <CardDescription className="text-md">
            Get AI-powered suggestions for empathetic and professional replies to parent messages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form action={formAction} className="space-y-6" onSubmit={form.handleSubmit(
                (data) => { // data is validated form data
                    const formData = new FormData();
                    formData.append("scenario", data.scenario);
                    formData.append("parentMessage", data.parentMessage);
                    setGeneratedReply(undefined); // Clear previous reply
                    formAction(formData);
                }
            )}>
              <FormField
                control={form.control}
                name="scenario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Scenario</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a common situation" />
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parentMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent's Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the parent's message here, or briefly describe the situation..."
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The more context you provide, the better the AI's suggestion will be.
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
              Generating Suggested Reply...
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
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {generatedReply && !useFormStatus().pending && (
        <Card className="mt-6 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Suggested Reply</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={generatedReply}
              readOnly
              rows={8}
              className="bg-secondary/50 border-border focus-visible:ring-accent"
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleCopyReply} variant="outline">
              <Copy className="mr-2 h-4 w-4" />
              Copy Reply
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
