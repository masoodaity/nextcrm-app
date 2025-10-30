import { z } from "zod";

// Schema that matches the actual lead data structure from the database
export const leadSchema = z.object({
  id: z.string(),
  v: z.number().optional(),
  createdAt: z.date().optional().nullable(),
  updatedAt: z.date().optional().nullable(),
  createdBy: z.string().optional().nullable(),
  updatedBy: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp_phone: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  lead_source: z.string().optional().nullable(),
  website_url: z.string().optional().nullable(),
  twitter_username: z.string().optional().nullable(),
  linkedin_url: z.string().optional().nullable(),
  refered_by: z.string().optional().nullable(),
  campaign: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  follow_up_count: z.number().optional().nullable(),
  next_action: z.string().optional().nullable(),
  start_date: z.date().optional().nullable(),
  assigned_to: z.string().optional().nullable(),
  accountsIDs: z.string().optional().nullable(),
  documentsIDs: z.array(z.string()).optional(),
  assigned_to_user: z.object({
    name: z.string().optional().nullable(),
  }).optional().nullable(),
});

export type Lead = z.infer<typeof leadSchema>;
