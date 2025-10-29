import { DocumentAnalysisClient, AzureKeyCredential } from "@azure/ai-form-recognizer";

let cachedClient: DocumentAnalysisClient | null = null;

export function getDocumentIntelligenceClient(): DocumentAnalysisClient {
  if (cachedClient) return cachedClient;

  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

  if (!endpoint) {
    throw new Error("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT is not defined");
  }
  if (!key) {
    throw new Error("AZURE_DOCUMENT_INTELLIGENCE_KEY is not defined");
  }

  cachedClient = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
  return cachedClient;
}

export type ParsedInvoiceFields = {
  invoiceNumber?: string | null;
  invoiceDate?: Date | null;
  dueDate?: Date | null;
  invoiceTotal?: number | null;
  totalTax?: number | null;
  currency?: string | null;
  vendorName?: string | null;
  customerName?: string | null;
  purchaseOrder?: string | null;
};

export function extractInvoiceFields(result: any): ParsedInvoiceFields {
  try {
    const doc = result?.documents?.[0];
    const f = doc?.fields ?? {};
    const pickString = (k: string) => f[k]?.value ?? f[k]?.content ?? null;
    const pickNumber = (k: string) => (typeof f[k]?.value === "number" ? f[k]?.value : null);
    const pickMoneyAmount = (k: string) => {
      const v = f[k]?.value ?? f[k]?.content;
      if (!v) return null;
      if (typeof v === "number") return v;
      if (typeof v === "object" && v !== null) {
        // Money fields often look like { amount: number, currency: string }
        if (typeof (v as any).amount === "number") return (v as any).amount;
      }
      return null;
    };
    const pickMoneyCurrency = (k: string) => {
      const v = f[k]?.value ?? f[k]?.content;
      if (typeof v === "object" && v !== null) {
        // Check for currencyCode first, then currencySymbol, then currency
        if (typeof (v as any).currencyCode === "string") {
          return (v as any).currencyCode as string;
        }
        if (typeof (v as any).currencySymbol === "string") {
          return (v as any).currencySymbol as string;
        }
        if (typeof (v as any).currency === "string") {
          return (v as any).currency as string;
        }
      }
      return null;
    };
    const pickDate = (k: string) => (f[k]?.value ? new Date(f[k]?.value) : null);
    const n = (v: number | null | undefined) => (typeof v === "number" ? v : null);

    const subTotal = n(pickMoneyAmount("SubTotal") ?? pickNumber("SubTotal") ?? pickNumber("Subtotal"));
    const totalTax = n(pickMoneyAmount("TotalTax") ?? pickNumber("TotalTax"));
    const shipping = n(pickMoneyAmount("Shipping") ?? pickNumber("Shipping"));
    const discounts = n(pickMoneyAmount("Discount") ?? pickMoneyAmount("Discounts") ?? pickNumber("Discount") ?? pickNumber("Discounts"));

    const computedTotal =
      subTotal != null
        ? (subTotal || 0) + (totalTax || 0) + (shipping || 0) - (discounts || 0)
        : null;

    return {
      invoiceNumber: pickString("InvoiceId") ?? pickString("InvoiceNumber"),
      invoiceDate: pickDate("InvoiceDate"),
      dueDate: pickDate("DueDate"),
      invoiceTotal:
        pickMoneyAmount("InvoiceTotal") ?? pickNumber("InvoiceTotal") ?? pickMoneyAmount("AmountDue") ?? pickNumber("AmountDue") ?? computedTotal,
      totalTax: totalTax,
      currency:
        pickMoneyCurrency("InvoiceTotal") ||
        pickMoneyCurrency("AmountDue") ||
        pickString("Currency") ||
        pickString("InvoiceCurrency"),
      vendorName: pickString("VendorName"),
      customerName: pickString("CustomerName"),
      purchaseOrder: pickString("PurchaseOrder") ?? pickString("PurchaseOrderNumber"),
    };
  } catch {
    return {};
  }
}


