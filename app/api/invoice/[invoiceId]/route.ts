import { authOptions } from "@/lib/auth";
import { getBlockBlobClient } from "@/lib/azure-blob";
import { prismadb } from "@/lib/prisma";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

//Get single invoice data
export async function GET(request: Request, props: { params: Promise<{ invoiceId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ status: 401, body: { error: "Unauthorized" } });
  }

  const { invoiceId } = params;

  if (!invoiceId) {
    return NextResponse.json({
      status: 400,
      body: { error: "Bad Request - invoice id is mandatory" },
    });
  }

  const invoice = await prismadb.invoices.findFirst({
    where: {
      id: invoiceId,
    },
  });

  if (!invoice) {
    return NextResponse.json({
      status: 404,
      body: { error: "Invoice not found" },
    });
  }

  return NextResponse.json({ invoice }, { status: 200 });
}

//Delete single invoice by invoiceId
export async function DELETE(request: Request, props: { params: Promise<{ invoiceId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ status: 401, body: { error: "Unauthorized" } });
  }

  const { invoiceId } = params;

  if (!invoiceId) {
    return NextResponse.json({
      status: 400,
      body: { error: "Bad Request - invoice id is mandatory" },
    });
  }

  const invoiceData = await prismadb.invoices.findFirst({
    where: {
      id: invoiceId,
    },
  });

  if (!invoiceData) {
    return NextResponse.json({
      status: 404,
      body: { error: "Invoice not found" },
    });
  }

  try {
    //Delete files from Azure Blob Storage

    //Delete invoice file from Azure Blob
    if (invoiceData?.invoice_file_url) {
      const blob = getBlockBlobClient(
        `invoices/${invoiceData?.invoice_file_url?.split("/").slice(-1)[0]}`
      );
      await blob.deleteIfExists();
      console.log("Success - invoice deleted from Azure Blob container");
    }

    //Delete rossum annotation files from Azure - JSON
    if (invoiceData?.rossum_annotation_json_url) {
      const blob = getBlockBlobClient(
        `rossum/${
          invoiceData?.rossum_annotation_json_url?.split("/").slice(-1)[0]
        }`
      );
      await blob.deleteIfExists();
      console.log("Success - rossum annotation json deleted from Azure Blob");
    }

    //Delete rossum annotation files from Azure - XML
    if (invoiceData?.rossum_annotation_xml_url) {
      const blob = getBlockBlobClient(
        `rossum/${
          invoiceData?.rossum_annotation_xml_url?.split("/").slice(-1)[0]
        }`
      );
      await blob.deleteIfExists();
      console.log("Success - rossum annotation xml deleted from Azure Blob");
    }

    //Delete money xml document file from Azure Blob
    if (invoiceData?.money_s3_url) {
      const blob = getBlockBlobClient(
        `xml/${invoiceData?.money_s3_url?.split("/").slice(-1)[0]}`
      );
      await blob.deleteIfExists();
      console.log("Success - money xml deleted from Azure Blob");
    }

    //Delete invoice from database
    const invoice = await prismadb.invoices.delete({
      where: {
        id: invoiceId,
      },
    });
    console.log("Invoice deleted from database");
    return NextResponse.json({ invoice }, { status: 200 });
  } catch (err) {
    console.log("Error", err);
    return NextResponse.json({
      status: 500,
      body: { error: "Something went wrong while delete invoice" },
    });
  }
}
