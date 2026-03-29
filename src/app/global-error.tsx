"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: "1.5rem",
            padding: "1rem",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              background: "#fef2f2",
              borderRadius: "50%",
              padding: "1rem",
            }}
          >
            <AlertTriangle style={{ width: 32, height: 32, color: "#dc2626" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
              Something went wrong
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginTop: "0.5rem",
              }}
            >
              A critical error occurred. Please try again.
            </p>
          </div>
          <button
            onClick={reset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              border: "1px solid #d1d5db",
              borderRadius: "0.375rem",
              background: "white",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            <RefreshCw style={{ width: 16, height: 16 }} />
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
