import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Container from "../../../components/ui/Container";

function countBy<T extends string | null | undefined>(items: T[]) {
  const map = new Map<string, number>();
  for (const it of items) {
    const key = it ? String(it) : "NULL";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export default async function LeadsDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }

  const leads = await prismadb.crm_Leads.findMany({
    select: {
      id: true,
      status: true,
      createdAt: true,
      assigned_to_user: { select: { id: true, name: true } },
    },
  });
  

  const totalLeads = leads.length;
  const leadsThisWeek = leads.filter((l) => {
    const d = l.createdAt ? new Date(l.createdAt) : null;
    if (!d) return false;
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;

  const successClosedAll = leads.filter((l) => l.status === "SUCCESS_CLOSED").length;
  const successClosedThisWeek = leads.filter((l) => {
    if (l.status !== "SUCCESS_CLOSED") return false;
    const d = l.createdAt ? new Date(l.createdAt) : null;
    if (!d) return false;
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;
  const successClosedToday = leads.filter((l) => {
    if (l.status !== "SUCCESS_CLOSED") return false;
    const d = l.createdAt ? new Date(l.createdAt) : null;
    if (!d) return false;
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }).length;

  const byStage = countBy(
    leads
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
  const statusCounts = countBy(leads.map((l) => l.status as string | undefined));
  const kpiStageMap = new Map(
    statusCounts.map((s) => [s.name, s.value] as const)
  );
  const allStageCards = allPipelineStages.map((name) => ({
    name,
    value: kpiStageMap.get(name) || 0,
  })).filter(stage => stage.name !== "NULL");

  // neutral styling only
  const byOwner = countBy(
    leads.map((l) => l.assigned_to_user?.name as string | undefined)
  );

  return (
    <Container title="Leads dashboard" description="Track your outreach performance">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-md p-4">
          <div className="text-sm text-muted-foreground">Total leads</div>
          <div className="text-3xl font-semibold">{totalLeads}</div>
        </div>
        <div className="border rounded-md p-4">
          <div className="text-sm text-muted-foreground">New this week</div>
          <div className="text-3xl font-semibold">{leadsThisWeek}</div>
        </div>
        <div className="border rounded-md p-4">
          <div className="text-sm text-muted-foreground">Active stages</div>
          <div className="text-3xl font-semibold">{byStage.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="border rounded-md p-4">
          <div className="text-sm text-muted-foreground">Success closed (all time)</div>
          <div className="text-3xl font-semibold">{successClosedAll}</div>
        </div>
        <div className="border rounded-md p-4">
          <div className="text-sm text-muted-foreground">Success closed (this week)</div>
          <div className="text-3xl font-semibold">{successClosedThisWeek}</div>
        </div>
        <div className="border rounded-md p-4">
          <div className="text-sm text-muted-foreground">Success closed (today)</div>
          <div className="text-3xl font-semibold">{successClosedToday}</div>
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
              .map((o) => (
                <div key={o.name} className="flex items-center justify-between">
                  <span className="text-sm">{o.name}</span>
                  <span className="text-sm font-semibold">{o.value}</span>
                </div>
              ))}
            {byOwner.length === 0 && (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}


