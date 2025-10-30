"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type LeadLite = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  company?: string | null;
  status?: string | null;
};

export function OwnerLeadsDialog({
  ownerName,
  leads,
  stageLabels,
  children,
}: {
  ownerName: string;
  leads: LeadLite[];
  stageLabels: Record<string, string>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, LeadLite[]>();
    for (const lead of leads) {
      const key = lead.status ? String(lead.status) : "NULL";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(lead);
    }
    // sort sections by count desc; NULL last
    const entries = Array.from(map.entries());
    entries.sort((a, b) => {
      if (a[0] === "NULL" && b[0] !== "NULL") return 1;
      if (b[0] === "NULL" && a[0] !== "NULL") return -1;
      return b[1].length - a[1].length;
    });
    return entries;
  }, [leads]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Leads for {ownerName}</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground mb-2">Total: {leads.length}</div>
        <ScrollArea className="max-h-[70vh] pr-2">
          <div className="space-y-6">
            {grouped.map(([stage, list]) => (
              <div key={stage} className="border rounded-md">
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <div className="text-sm font-medium">{stage === "NULL" ? "No stage" : (stageLabels[stage] || stage)}</div>
                  <div className="text-sm text-muted-foreground">{list.length}</div>
                </div>
                <div className="divide-y">
                  {list.map((l) => {
                    const name = [l.firstName, l.lastName].filter(Boolean).join(" ") || "—";
                    return (
                      <div key={l.id} className="px-3 py-2 text-sm flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{name}</div>
                          <div className="text-xs text-muted-foreground truncate">{l.email || l.company || l.id}</div>
                        </div>
                        <div className="text-xs text-muted-foreground ml-4">{l.company || ""}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {grouped.length === 0 && (
              <div className="text-sm text-muted-foreground">No leads</div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}


