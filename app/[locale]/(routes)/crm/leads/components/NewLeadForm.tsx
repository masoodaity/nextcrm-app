"use client";

import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";

import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

//TODO: fix all the types
type NewTaskFormProps = {
  users: any[];
  accounts: any[];
};

export function NewLeadForm({ users, accounts }: NewTaskFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const formSchema = z.object({
    email: z.string().email().optional().or(z.literal("")),
    first_name: z.string(),
    last_name: z.string().min(3).max(30).nonempty(),
    assigned_to: z.string().optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    whatsapp_phone: z.string().optional().or(z.literal("")),
    website_url: z.string().url().optional().or(z.literal("")),
    lead_source: z.string().optional().or(z.literal("")),
    status: z.string().optional().or(z.literal("")),
    // treat as text input, convert before submit
    follow_up_count: z.string().optional().or(z.literal("")),
    next_action: z.string().optional().or(z.literal("")),
    twitter_username: z.string().optional().or(z.literal("")),
    linkedin_url: z.string().url().optional().or(z.literal("")),
    start_date: z.string().optional().or(z.literal("")),
  });

  type NewLeadFormValues = z.infer<typeof formSchema>;

  const form = useForm<NewLeadFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      assigned_to: "",
      phone: "",
      whatsapp_phone: "",
      website_url: "",
      lead_source: "",
      status: "OUTREACH_SENT",
      follow_up_count: "",
      next_action: "",
      twitter_username: "",
      linkedin_url: "",
      start_date: "",
    },
  });

  const onSubmit = async (data: NewLeadFormValues) => {
    setIsLoading(true);
    try {
      const payload: any = {
        ...data,
        follow_up_count:
          data.follow_up_count && String(data.follow_up_count).trim() !== ""
            ? Number(data.follow_up_count)
            : undefined,
      };
      await axios.post("/api/crm/leads", payload);
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data,
      });
    } finally {
      setIsLoading(false);
      form.reset({
        email: "",
        first_name: "",
        last_name: "",
        assigned_to: "",
        phone: "",
        whatsapp_phone: "",
        website_url: "",
        lead_source: "",
        status: "OUTREACH_SENT",
        follow_up_count: undefined,
        next_action: "",
        twitter_username: "",
        linkedin_url: "",
        start_date: "",
      });
      router.refresh();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full px-10">
        {/*        <div>
          <pre>
            <code>{JSON.stringify(form.watch(), null, 2)}</code>
            <code>{JSON.stringify(form.formState.errors, null, 2)}</code>
          </pre>
        </div> */}
        <div className=" w-[800px] text-sm">
          <div className="pb-5 space-y-2">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="Johny"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="Walker"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="johny@domain.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="+11 123 456 789"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            <FormField
              control={form.control}
              name="lead_source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Source Channel</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} placeholder="Website / LinkedIn / Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} placeholder="https://company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="twitter_username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter username</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} placeholder="@username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="linkedin_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn URL</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} placeholder="https://linkedin.com/in/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="whatsapp_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp Phone Number</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} placeholder="+11 123 456 789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="follow_up_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow-up count</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} placeholder="0" type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="next_action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next action</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} placeholder="Call on Friday" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assigned_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact owner</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user to assign the account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="overflow-y-auto h-56">
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Stage</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || "OUTREACH_SENT"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select lead status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="OUTREACH_SENT">Outreach Sent</SelectItem>
                      <SelectItem value="FOLLOW_UP_ONE">FOLLOW-UP-ONE</SelectItem>
                      <SelectItem value="FOLLOW_UP_TWO">FOLLOW-UP-TWO</SelectItem>
                      <SelectItem value="RESPONDED">RESPONDED</SelectItem>
                      <SelectItem value="HANDED_TO_AE">HANDED TO AE</SelectItem>
                      <SelectItem value="IN_DEMO_PROCESS">IN-DEMO PROCESS</SelectItem>
                      <SelectItem value="QUALIFIED">QUALIFIED</SelectItem>
                      <SelectItem value="FAIL_CLOSED">FAIL-CLOSED</SelectItem>
                      <SelectItem value="SUCCESS_CLOSED">SUCCESS-CLOSED</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start date</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className="grid gap-2 py-5">
          <Button disabled={isLoading} type="submit">
            {isLoading ? (
              <span className="flex items-center animate-pulse">
                Saving data ...
              </span>
            ) : (
              "Create lead"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
