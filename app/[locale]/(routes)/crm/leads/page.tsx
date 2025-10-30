import { Suspense } from "react";

import SuspenseLoading from "@/components/loadings/suspense";

import Container from "../../components/ui/Container";
import LeadsView from "../components/LeadsView";
import BulkUploadButton from "./components/BulkUploadButton";
import DeleteAllLeadsButton from "./components/DeleteAllLeadsButton";

import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getLeads } from "@/actions/crm/get-leads";

const LeadsPage = async () => {
  const crmData = await getAllCrmData();
  const leads = await getLeads();

  console.log(leads[0], "leads");
  return (
    <Container
      title="Leads"
      description={"Everything you need to know about your leads"}
    >
      <div className="mb-4 flex items-center gap-2">
        <BulkUploadButton />
        <DeleteAllLeadsButton />
        <div className="ml-auto text-sm text-muted-foreground">Total leads: <span className="font-semibold text-foreground">{leads?.length ?? 0}</span></div>
      </div>
      <Suspense fallback={<SuspenseLoading />}>
        <LeadsView crmData={crmData} data={leads} />
      </Suspense>
    </Container>
  );
};

export default LeadsPage;
