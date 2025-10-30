"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export default function DeleteAllLeadsButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const onDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete ALL leads? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/crm/leads/delete-all", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Delete failed");
      toast({ title: "Deleted", description: `Removed ${json.deleted} leads` });
      router.refresh();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message || "Failed to delete" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="destructive" onClick={onDeleteAll} disabled={loading} className="gap-2">
      <Trash2 className="h-4 w-4" />
      {loading ? "Deleting..." : "Delete all leads"}
    </Button>
  );
}


