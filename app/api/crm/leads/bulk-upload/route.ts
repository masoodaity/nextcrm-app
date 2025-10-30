import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split("\n");
    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
    
    // Map HubSpot columns to our lead fields
    const fieldMapping: Record<string, string> = {
      "First Name": "firstName",
      "Last Name": "lastName", 
      "Email": "email",
      "Phone Number": "phone",
      "Lead Source Channel": "lead_source",
      // Support multiple possible headers for status/stage coming from HubSpot
      "Lead Stage": "status",
      "Lead Status": "status",
      "Website URL": "website_url",
      "Twitter Username": "twitter_username",
      "LinkedIn URL": "linkedin_url",
      "Create Date": "start_date",
      "WhatsApp Phone Number": "whatsapp_phone",
      "Contact owner": "assigned_to",
      "Contact Owner": "assigned_to",
    };

    // Build a lookup map of existing users by email and name for owner assignment
    const users = await prismadb.users.findMany({
      select: { id: true, email: true, name: true },
    });
    const emailToId = new Map<string, string>();
    const nameToId = new Map<string, string>();
    users.forEach((u: any) => {
      if (u?.email) emailToId.set(String(u.email).toLowerCase().trim(), u.id);
      if (u?.name) nameToId.set(String(u.name).toLowerCase().trim(), u.id);
    });
    
    console.log("Available users for mapping:", users.map(u => ({ id: u.id, name: u.name, email: u.email })));

    const leads: any[] = [];
    const errors: string[] = [];
    const newUsersCreated: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
      const leadData: any = {
        v: 1,
        createdBy: session.user?.id,
        updatedBy: session.user?.id,
        status: null,
        type: "DEMO",
        assigned_to: null,
        firstName: "",
        lastName: "",
        email: "",
      };

      // Map CSV columns to lead fields
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        const value = values[j];
        const mappedField = fieldMapping[header];
        
        if (mappedField && value) {
          if (mappedField === "start_date") {
            // Parse date
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              leadData[mappedField] = date;
            }
          } else if (mappedField === "status") {
            // Normalize and map incoming stage/status variants to our internal statuses
            const normalize = (s: string) =>
              s
                .trim()
                .toUpperCase()
                .replace(/[^A-Z0-9]+/g, "_")
                .replace(/__+/g, "_")
                .replace(/^_|_$/g, "");

            const v = normalize(value);
            const map: Record<string, string> = {
              // Outreach / new
              "OUTREACH_SENT": "OUTREACH_SENT",
              "NEW_LEAD": "NEW_LEAD",
              "NEW": "NEW_LEAD",
              // Responded - from your CSV
              "RESPONDED": "RESPONDED",
              "REPLIED": "RESPONDED",
              // Follow ups - from your list
              "FOLLOW_UP_1": "FOLLOW_UP_ONE",
              "FOLLOW_UP_ONE": "FOLLOW_UP_ONE",
              "FOLLOWUP_ONE": "FOLLOW_UP_ONE",
              "FOLLOW_UP_2": "FOLLOW_UP_TWO", 
              "FOLLOW_UP_TWO": "FOLLOW_UP_TWO",
              "FOLLOWUP_TWO": "FOLLOW_UP_TWO",
              // Handed to AE - from your list
              "HANDED_TO_AE": "HANDED_TO_AE",
              "HANDOFF_TO_AE": "HANDED_TO_AE",
              // In demo process - from your CSV
              "IN_DEMO_PROCESS": "IN_DEMO_PROCESS",
              "DEMO": "IN_DEMO_PROCESS",
              // Qualified - from your list
              "QUALIFIED": "QUALIFIED",
              // Closed - from your CSV and list
              "FAIL_CLOSED": "FAIL_CLOSED",
              "FAILED": "FAIL_CLOSED",
              "LOST": "FAIL_CLOSED",
              "SUCCESS_CLOSED": "SUCCESS_CLOSED",
              "WON": "SUCCESS_CLOSED",
              "CLOSED_WON": "SUCCESS_CLOSED",
            };
            // Only set status if there's a valid value, otherwise leave as null
            if (v && v.trim() && map[v.trim().toUpperCase()]) {
              leadData[mappedField] = map[v.trim().toUpperCase()];
            } else {
              leadData[mappedField] = null;
            }
          } else if (mappedField === "assigned_to") {
            // Resolve owner: ObjectId, email, or full name
            const raw = value.trim();
            if (!raw) {
              // keep as null when contact owner is empty
              leadData.assigned_to = null;
              continue;
            }
            console.log(`Trying to map owner: "${raw}"`);
            if (/^[a-f\d]{24}$/i.test(raw)) {
              leadData.assigned_to = raw;
              console.log(`Mapped by ObjectId: ${raw}`);
            } else if (raw.includes("@")) {
              const id = emailToId.get(raw.toLowerCase());
              if (id) {
                leadData.assigned_to = id;
                console.log(`Mapped by email: ${raw} -> ${id}`);
              } else {
                console.log(`No user found for email: ${raw}`);
              }
            } else {
              const id = nameToId.get(raw.toLowerCase());
              if (id) {
                leadData.assigned_to = id;
                console.log(`Mapped by name: ${raw} -> ${id}`);
              } else {
                console.log(`No user found for name: ${raw}`);
                // Try partial name matching
                const partialMatch = users.find((u: any) => 
                  u.name && u.name.toLowerCase().includes(raw.toLowerCase())
                );
                if (partialMatch) {
                  leadData.assigned_to = partialMatch.id;
                  console.log(`Mapped by partial name match: ${raw} -> ${partialMatch.id} (${partialMatch.name})`);
                } else {
                  // Create a new user for this contact owner
                  try {
                    const newUser = await prismadb.users.create({
                      data: {
                        name: raw,
                        email: `${raw.toLowerCase().replace(/\s+/g, '.')}@company.com`, // Generate email
                        userStatus: "ACTIVE",
                        is_admin: false,
                        is_account_admin: false,
                      }
                    });
                    leadData.assigned_to = newUser.id;
                    newUsersCreated.push(raw);
                    console.log(`Created new user: ${raw} -> ${newUser.id}`);
                    
                    // Update our lookup maps
                    nameToId.set(raw.toLowerCase(), newUser.id);
                    users.push({ id: newUser.id, name: newUser.name, email: newUser.email });
                  } catch (createError) {
                    console.error(`Failed to create user for ${raw}:`, createError);
                    errors.push(`Failed to create user for contact owner: ${raw}`);
                  }
                }
              }
            }
          } else {
            leadData[mappedField] = value;
          }
        }
      }

      // Do not force-assign owner; keep null if unresolved

      // No validation: allow rows even without names/emails

      leads.push(leadData);
    }

    // De-duplicate by email against existing DB to avoid duplicates (Mongo doesn't support skipDuplicates on createMany)
    const emails = Array.from(new Set(
      leads.map((l: any) => (l.email || "").toLowerCase()).filter(Boolean)
    ));
    let existingEmailsSet = new Set<string>();
    if (emails.length > 0) {
      const existing = await prismadb.crm_Leads.findMany({
        where: { email: { in: emails } },
        select: { email: true },
      });
      existingEmailsSet = new Set(
        existing.map((e: any) => (e.email || "").toLowerCase())
      );
    }

    const newLeads = leads.filter(
      (l: any) => !existingEmailsSet.has((l.email || "").toLowerCase())
    );

    const result = newLeads.length
      ? await prismadb.crm_Leads.createMany({ data: newLeads })
      : { count: 0 } as any;

    const skipped = leads.length - newLeads.length;

    // Count how many leads were assigned to different owners
    const ownerCounts = new Map<string, number>();
    newLeads.forEach((lead: any) => {
      const ownerId = lead.assigned_to;
      ownerCounts.set(ownerId, (ownerCounts.get(ownerId) || 0) + 1);
    });

    console.log("Owner assignment summary:", Array.from(ownerCounts.entries()).map(([id, count]) => {
      const user = users.find(u => u.id === id);
      return { owner: user?.name || user?.email || id, count };
    }));

    return NextResponse.json({
      success: true,
      message: `Inserted ${result.count} new leads. Skipped ${skipped} existing. Created ${newUsersCreated.length} new users.`,
      inserted: result.count,
      skipped,
      totalParsed: leads.length,
      errors,
      newUsersCreated,
      ownerAssignments: Array.from(ownerCounts.entries()).map(([id, count]) => {
        const user = users.find(u => u.id === id);
        return { owner: user?.name || user?.email || id, count };
      }),
    });

  } catch (error) {
    console.error("[BULK_UPLOAD_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to process CSV file" },
      { status: 500 }
    );
  }
}
