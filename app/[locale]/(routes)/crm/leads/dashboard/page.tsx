import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Container from "../../../components/ui/Container";
import { OwnerLeadsDialog } from "./OwnerLeadsDialog";
import { RangeFilter } from "./RangeFilter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function countBy<T extends string | null | undefined>(items: T[]) {
  const map = new Map<string, number>();
  for (const it of items) {
    const key = it ? String(it) : "NULL";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export default async function LeadsDashboardPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }

  const leads = await prismadb.crm_Leads.findMany({
    select: {
      id: true,
      status: true,
      createdAt: true,
      firstName: true,
      lastName: true,
      email: true,
      company: true,
      assigned_to_user: { select: { id: true, name: true } },
    },
  });
  
  const range = (Array.isArray(searchParams?.range) ? searchParams?.range[0] : searchParams?.range) as ("all"|"week"|"today"|undefined) || "all";

  function inRange(d: Date | null | undefined) {
    if (!d) return false;
    const date = new Date(d);
    const now = new Date();
    if (range === "today") {
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
      );
    }
    if (range === "week") {
      const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }
    return true; // all
  }

  const filteredLeads = leads.filter((l) => inRange(l.createdAt as any));

  const totalLeads = filteredLeads.length;
  const leadsToday = filteredLeads.filter((l) => {
    const d = l.createdAt ? new Date(l.createdAt) : null;
    if (!d) return false;
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }).length;
  const leadsThisWeek = filteredLeads.filter((l) => {
    const d = l.createdAt ? new Date(l.createdAt) : null;
    if (!d) return false;
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;

  const successClosed = filteredLeads.filter((l) => l.status === "SUCCESS_CLOSED").length;

  const byStage = countBy(
    filteredLeads
      .map((l) => l.status as string | undefined)
      .filter((s) => s)
  ).filter(stage => stage.name !== "NULL");

  // KPI cards should show ALL stages (including closed) and 0s when missing
  const allPipelineStages = [
    "NEW_LEAD",
    "OUTREACH_SENT",
    "FOLLOW_UP_ONE",
    "FOLLOW_UP_TWO",
    "RESPONDED",
    "HANDED_TO_AE",
    "IN_DEMO_PROCESS",
    "QUALIFIED",
    "FAIL_CLOSED",
    "SUCCESS_CLOSED",
  ];
  const statusCounts = countBy(filteredLeads.map((l) => l.status as string | undefined));
  const kpiStageMap = new Map(
    statusCounts.map((s) => [s.name, s.value] as const)
  );
  const allStageCards = allPipelineStages.map((name) => ({
    name,
    value: kpiStageMap.get(name) || 0,
  })).filter(stage => stage.name !== "NULL");

  // neutral styling only
  const byOwner = countBy(
    filteredLeads.map((l) => l.assigned_to_user?.name as string | undefined)
  );

  const ownerToLeads = new Map<string, typeof leads>();
  for (const l of filteredLeads) {
    const key = l.assigned_to_user?.name || "NULL";
    if (!ownerToLeads.has(key)) ownerToLeads.set(key, [] as any);
    (ownerToLeads.get(key) as any).push(l);
  }

  // Build pivot: owner x stage => count
  const owners = Array.from(new Set(filteredLeads.map((l) => l.assigned_to_user?.name || "NULL")));
  const pivot = new Map<string, Map<string, number>>();
  for (const owner of owners) {
    pivot.set(owner, new Map<string, number>());
    for (const st of allPipelineStages) {
      pivot.get(owner)!.set(st, 0);
    }
  }
  for (const l of filteredLeads) {
    const owner = l.assigned_to_user?.name || "NULL";
    const st = (l.status as string | undefined) || undefined;
    if (st && pivot.get(owner)?.has(st)) {
      const current = pivot.get(owner)!.get(st) || 0;
      pivot.get(owner)!.set(st, current + 1);
    }
  }

  return (
    <Container title="Leads dashboard" description="Track your outreach performance">
      <div className="flex items-center justify-end mb-4">
        <RangeFilter value={range} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-md p-4">
          <div className="text-sm text-muted-foreground">Total leads</div>
          <div className="text-3xl font-semibold">{totalLeads}</div>
        </div>
        <div className="border rounded-md p-4">
          <div className="text-sm text-muted-foreground">New this week</div>
          <div className="text-3xl font-semibold">{leadsThisWeek}</div>
        </div>
        <div className="border rounded-md p-4">
          <div className="text-sm text-muted-foreground">Created today</div>
          <div className="text-3xl font-semibold">{leadsToday}</div>
        </div>
        <div className="border rounded-md p-4">
          <div className="text-sm text-muted-foreground">Active stages</div>
          <div className="text-3xl font-semibold">{byStage.length}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-md p-4">
            <div className="text-sm text-muted-foreground">Success closed</div>
            <div className="text-3xl font-semibold">{successClosed}</div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {allStageCards.map((s) => {
            const stageLabels: { [key: string]: string } = {
              "NEW_LEAD": "New Lead",
              "OUTREACH_SENT": "Outreach Sent",
              "FOLLOW_UP_ONE": "Follow Up -1",
              "FOLLOW_UP_TWO": "Follow Up -2",
              "RESPONDED": "Responded",
              "HANDED_TO_AE": "Handed to AE",
              "IN_DEMO_PROCESS": "In Demo Process",
              "QUALIFIED": "Qualified",
              "FAIL_CLOSED": "Fail -Closed",
              "SUCCESS_CLOSED": "Success -Closed",
            };
            return (
              <div key={s.name} className="border rounded-md p-4">
                <div className="text-xs text-muted-foreground mb-1">{stageLabels[s.name] || s.name}</div>
                <div className="text-2xl font-semibold">{s.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="border rounded-md p-4">
          <div className="text-lg font-medium mb-2">Leads by stage</div>
          <div className="space-y-2">
            {byStage
              .sort((a, b) => b.value - a.value)
              .map((s) => {
                const stageLabels: { [key: string]: string } = {
                  "NEW_LEAD": "New Lead",
                  "OUTREACH_SENT": "Outreach Sent",
                  "FOLLOW_UP_ONE": "Follow Up -1",
                  "FOLLOW_UP_TWO": "Follow Up -2",
                  "RESPONDED": "Responded",
                  "HANDED_TO_AE": "Handed to AE",
                  "IN_DEMO_PROCESS": "In Demo Process",
                  "QUALIFIED": "Qualified",
                  "FAIL_CLOSED": "Fail -Closed",
                  "SUCCESS_CLOSED": "Success -Closed",
                };
                return (
                  <div key={s.name} className="flex items-center justify-between">
                    <span className="text-sm">{stageLabels[s.name] || s.name}</span>
                    <span className="text-sm font-semibold">{s.value}</span>
                  </div>
                );
              })}
            {byStage.length === 0 && (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </div>
        </div>

        <div className="border rounded-md p-4">
          <div className="text-lg font-medium mb-2">Leads by owner</div>
          <div className="space-y-2">
            {byOwner
              .sort((a, b) => b.value - a.value)
              .map((o) => {
                const stageLabels: { [key: string]: string } = {
                  "NEW_LEAD": "New Lead",
                  "OUTREACH_SENT": "Outreach Sent",
                  "FOLLOW_UP_ONE": "Follow Up -1",
                  "FOLLOW_UP_TWO": "Follow Up -2",
                  "RESPONDED": "Responded",
                  "HANDED_TO_AE": "Handed to AE",
                  "IN_DEMO_PROCESS": "In Demo Process",
                  "QUALIFIED": "Qualified",
                  "FAIL_CLOSED": "Fail -Closed",
                  "SUCCESS_CLOSED": "Success -Closed",
                };
                const list = ownerToLeads.get(o.name) || [];
                return (
                  <OwnerLeadsDialog
                    key={o.name}
                    ownerName={o.name}
                    leads={list as any}
                    stageLabels={stageLabels}
                  >
                    <button className="w-full text-left flex items-center justify-between hover:bg-accent/40 rounded px-2 py-1">
                      <span className="text-sm">{o.name}</span>
                      <span className="text-sm font-semibold">{o.value}</span>
                    </button>
                  </OwnerLeadsDialog>
                );
              })}
            {byOwner.length === 0 && (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </div>
        </div>
      </div>

      <div className="border rounded-md p-4 mt-6">
        <div className="text-lg font-medium mb-3">Stages by owner</div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Owner</TableHead>
                {allPipelineStages.map((st) => {
                  const stageLabels: { [key: string]: string } = {
                    "NEW_LEAD": "New Lead",
                    "OUTREACH_SENT": "Outreach Sent",
                    "FOLLOW_UP_ONE": "Follow Up -1",
                    "FOLLOW_UP_TWO": "Follow Up -2",
                    "RESPONDED": "Responded",
                    "HANDED_TO_AE": "Handed to AE",
                    "IN_DEMO_PROCESS": "In Demo Process",
                    "QUALIFIED": "Qualified",
                    "FAIL_CLOSED": "Fail -Closed",
                    "SUCCESS_CLOSED": "Success -Closed",
                  };
                  return (
                    <TableHead key={st} className="whitespace-nowrap">{stageLabels[st] || st}</TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {owners
                .sort((a, b) => {
                  const asum = Array.from(pivot.get(a)?.values() || []).reduce((x, y) => x + y, 0);
                  const bsum = Array.from(pivot.get(b)?.values() || []).reduce((x, y) => x + y, 0);
                  return bsum - asum;
                })
                .map((owner) => (
                  <TableRow key={owner}>
                    <TableCell className="whitespace-nowrap">{owner}</TableCell>
                    {allPipelineStages.map((st) => (
                      <TableCell key={st} className="text-right tabular-nums">
                        {pivot.get(owner)?.get(st) || 0}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              {owners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={1 + allPipelineStages.length} className="text-sm text-muted-foreground">
                    No data
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Container>
  );
}


