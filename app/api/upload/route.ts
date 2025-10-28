import { NextRequest, NextResponse } from "next/server";
import { getBlockBlobClient } from "@/lib/azure-blob";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import axios from "axios";
import { getRossumToken } from "@/lib/get-rossum-token";
import { getDocumentIntelligenceClient, extractInvoiceFields } from "@/lib/azure-document-intelligence";

const FormData = require("form-data");

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json("Unauthorized", { status: 401 });
  }

  const data = await request.formData();
  const file: File | null = data.get("file") as unknown as File;

  if (!file) {
    console.log("Error - no file found");
    return NextResponse.json({ success: false });
  }
  console.log("FIle from UPLOAD API:", file);
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  console.log("Buffer:", buffer);

  // Rossum integration (optional). If not configured, skip gracefully
  let rossumDocument: any | null = null;
  let rossumAnnotationId: string | null = null;
  try {
    const rossumURL = process.env.ROSSUM_API_URL;
    const queueId = process.env.ROSSUM_QUEUE_ID;
    if (!rossumURL || !queueId) {
      throw new Error("Rossum not configured");
    }

    const queueUploadUrl = `${rossumURL}/uploads?queue=${queueId}`;
    const token = await getRossumToken();

    const form = new FormData();
    form.append("content", buffer, file.name);

    console.log("FORM DATA:", form);

    const uploadInvoiceToRossum = await axios.post(queueUploadUrl, form, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Response", uploadInvoiceToRossum.data);

    const rossumTask = await axios.get(uploadInvoiceToRossum.data.url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Rossum task: ", rossumTask.data);

    const rossumUploadData = await axios.get(rossumTask.data.content.upload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Rossum upload data: ", rossumUploadData.data);

    const rd = await axios.get(rossumUploadData.data.documents[0], {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (rd.status !== 200) {
      throw new Error("Could not get Rossum document");
    }
    rossumDocument = rd;
    rossumAnnotationId = rossumDocument.data.annotations[0]?.split("/").pop() ?? null;
    console.log("Rossum document: ", rossumDocument.data);
  } catch (e) {
    console.log("Rossum integration skipped:", (e as Error).message);
  }

  const invoiceFileName = "invoices/" + new Date().getTime() + "-" + file.name;
  console.log("Invoice File Name:", invoiceFileName);

  console.log("Uploading to Azure Blob Storage...", invoiceFileName);
  try {
    const blob = getBlockBlobClient(invoiceFileName);
    await blob.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: file.type,
        blobContentDisposition: "inline",
      },
    });
  } catch (err) {
    console.log("Error - uploading to Azure Blob Storage", err);
  }

  console.log("Creating Item in DB...");
  try {
    // Azure blob URL for the invoice
    const url = `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${process.env.AZURE_BLOB_CONTAINER}/${invoiceFileName}`;
    console.log("URL in Azure Blob:", url);

    if (rossumAnnotationId) {
      console.log("Annotation ID:", rossumAnnotationId);
    }
    //Save the data to the database

    // Try Azure Document Intelligence (optional)
    let parsed: any = null;
    try {
      const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
      const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
      if (endpoint && key) {
        const client = getDocumentIntelligenceClient();
        // Send the file bytes directly so we don't require a public URL/SAS
        const poller = await client.beginAnalyzeDocument(
          "prebuilt-invoice",
          buffer
        );
        const result = await poller.pollUntilDone();
        parsed = extractInvoiceFields(result);
        console.log("ADI parsed fields:", parsed);
      }
    } catch (e) {
      console.log("Azure Document Intelligence skipped:", (e as Error).message);
    }

    await prismadb.invoices.create({
      data: {
        last_updated_by: session.user.id,
        date_due: parsed?.dueDate ?? new Date(),
        description: "Incoming invoice",
        document_type: "invoice",
        invoice_type: "Taxable document",
        status: "new",
        favorite: false,
        assigned_user_id: session.user.id,
        invoice_file_url: url,
        invoice_file_mimeType: file.type,
        // UI shows Number from variable_symbol; store both for compatibility
        variable_symbol: parsed?.invoiceNumber ?? undefined,
        invoice_number: parsed?.invoiceNumber ?? undefined,
        invoice_amount:
          parsed?.invoiceTotal != null
            ? String(parsed?.invoiceTotal)
            : undefined,
        invoice_currency: parsed?.currency ?? undefined,
        partner: parsed?.vendorName ?? undefined,
        order_number: parsed?.purchaseOrder ?? undefined,
        date_of_case: parsed?.invoiceDate ?? undefined,
        rossum_status: rossumDocument ? "importing" : "skipped",
        rossum_document_url: rossumDocument ? rossumDocument.data.annotations[0] : null,
        rossum_document_id: rossumDocument ? rossumDocument.data.id.toString() : null,
        rossum_annotation_url: rossumDocument ? rossumDocument.data.annotations[0] : null,
        rossum_annotation_id: rossumAnnotationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("Error - storing data to DB", error);
    return NextResponse.json({ success: false });
  }
}
