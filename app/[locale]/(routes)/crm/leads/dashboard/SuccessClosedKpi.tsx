"use client";

import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SuccessClosedKpi({
  counts,
  defaultRange,
}: {
  counts: { all: number; week: number; today: number };
  defaultRange?: "all" | "week" | "today";
}) {
  const [range, setRange] = useState<"all" | "week" | "today">(defaultRange || "all");
  const value = useMemo(() => counts[range], [counts, range]);

  return (
    <div className="border rounded-md p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Success closed</div>
        <Select value={range} onValueChange={(v) => setRange(v as any)}>
          <SelectTrigger className="h-7 w-[120px] text-xs">
            <SelectValue placeholder="All time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="week">This week</SelectItem>
            <SelectItem value="today">Today</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
    </div>
  );
}


