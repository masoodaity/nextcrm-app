import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    const result = await prismadb.crm_Leads.deleteMany({});
    return NextResponse.json({ success: true, deleted: result.count });
  } catch (error) {
    console.error("[LEADS_DELETE_ALL]", error);
    return NextResponse.json({ error: "Failed to delete leads" }, { status: 500 });
  }
}


