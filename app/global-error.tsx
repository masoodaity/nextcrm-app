"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optional: report to your monitoring service
    // eslint-disable-next-line no-console
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: 24,
          fontFamily: "sans-serif",
        }}>
          <div style={{ maxWidth: 640 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
              Something went wrong
            </h1>
            <p style={{ color: "#666", marginBottom: 16 }}>
              A client error occurred while rendering this page.
            </p>
            <pre style={{
              whiteSpace: "pre-wrap",
              background: "#f5f5f5",
              padding: 12,
              borderRadius: 8,
              overflow: "auto",
              marginBottom: 16,
              fontSize: 12,
            }}>
              {error?.message}
            </pre>
            <button
              onClick={() => reset()}
              style={{
                background: "#111827",
                color: "white",
                padding: "8px 12px",
                borderRadius: 6,
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}


