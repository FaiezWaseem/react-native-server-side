"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Trash, ArrowLeft, Wand2, RefreshCw } from "lucide-react";
// @ts-ignore
import { Page } from "@prisma/client";
import Link from "next/link";
import Editor from "@monaco-editor/react";
import * as Babel from "@babel/standalone";
import { useState, useEffect, useRef, useMemo } from "react";
import { REACT_NATIVE_SYSTEM_PROMPT } from "@/lib/ai-prompt";
import { MobilePreview } from "./mobile-preview";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ConfirmModal } from "@/components/modals/confirm-modal";

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
  slug: z.string().min(1, {
    message: "Slug is required",
  }),
  content: z.string().optional(),
  transpiled_code: z.string().optional(),
  isPublished: z.boolean(),
});

interface PageFormProps {
  initialData: Page;
}

export const PageForm = ({ initialData }: PageFormProps) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title,
      slug: initialData.slug,
      content: initialData.content || "",
      transpiled_code: initialData.transpiled_code || "",
      isPublished: initialData.isPublished,
    },
  });

  const { isSubmitting, isValid } = form.formState;
  const watchedValues = form.watch();

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const onAiGenerate = async () => {
    if (!prompt.trim()) return;
    
    try {
      setIsAiLoading(true);
      const response = await axios.post("/api/chat", {
        messages: [
          { role: "system", content: REACT_NATIVE_SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ]
      });
      
      const aiMessage = response.data.choices[0].message.content;
      console.log(aiMessage)
      // Extract code block if present
      const codeBlockRegex = /```(?:jsx|javascript|js)?\s*([\s\S]*?)\s*```/;
      const match = aiMessage.match(codeBlockRegex);
      const code = match ? match[1] : aiMessage;
      
      form.setValue("content", code, { shouldDirty: true, shouldTouch: true });
      toast.success("AI generated code applied");
      setPrompt("");
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to generate code: " + (error.response?.data || error.message));
    } finally {
      setIsAiLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (values.content) {
        try {
          const output = Babel.transform(values.content, {
            presets: ['react'],
            plugins: ['transform-async-to-generator'],
            parserOpts: { allowReturnOutsideFunction: true }
          }).code;
          //@ts-ignore
          values.transpiled_code = output;
        } catch (error: any) {
          toast.error("Babel compilation failed: " + error.message);
          return;
        }
      }

      await axios.patch(`/api/admin/pages/${initialData.id}`, values);
      toast.success("Page updated");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const onDelete = async () => {
    try {
      await axios.delete(`/api/admin/pages/${initialData.id}`);
      toast.success("Page deleted");
      router.refresh();
      router.push("/admin/pages");
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-x-4">
          <Link href="/admin/pages" className="hover:opacity-75 transition">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="flex flex-col gap-y-1">
            <h1 className="text-2xl font-bold">Edit Page</h1>
            <span className="text-sm text-muted-foreground">
              Complete all fields to publish
            </span>
          </div>
        </div>
        <div className="flex items-center gap-x-2">
          <ConfirmModal onConfirm={onDelete}>
            <Button variant="destructive" size="sm">
              <Trash className="h-4 w-4" />
            </Button>
          </ConfirmModal>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Form */}
        <div className=" p-6 rounded-lg shadow-sm border h-fit">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input disabled={isSubmitting} placeholder="e.g. 'About Us'" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input disabled={isSubmitting} placeholder="e.g. 'about-us'" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Content</FormLabel>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" type="button" className="gap-2">
                              <Wand2 className="w-4 h-4" />
                              AI Generate
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Generate Page Content</DialogTitle>
                              <DialogDescription>
                                Describe the UI you want to build. The AI will generate React Native code for you.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <Textarea
                                placeholder="e.g. Create a login screen with email, password fields and a submit button..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="h-32"
                              />
                            </div>
                            <DialogFooter>
                              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                              <Button onClick={onAiGenerate} disabled={isAiLoading || !prompt.trim()}>
                                {isAiLoading ? "Generating..." : "Generate"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <FormControl>
                        <div className="h-[500px] border rounded-md overflow-hidden">
                          <Editor
                            height="100%"
                            defaultLanguage="jsx"
                            value={field.value}
                            theme="dark"
                            onChange={(value) => field.onChange(value || "")}
                            options={{
                              minimap: { enabled: false },
                              lineNumbers: "on",
                              wordWrap: "on",
                              readOnly: isSubmitting
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-slate-50 dark:bg-slate-700">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Publish
                        </FormLabel>
                        <FormDescription>
                          Make this page public
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex items-center gap-x-2">
                <Button disabled={!isValid || isSubmitting} type="submit" className="w-full">
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Right Column: Preview */}
        <div className="flex flex-col items-center justify-start pt-4 space-y-4">
          <h3 className="text-lg font-medium text-gray-500">Live Mobile Preview</h3>
          <MobilePreview
            title={watchedValues.title}
            content={watchedValues.content || ""}
          />
        </div>
      </div>
    </div>
  );
};
