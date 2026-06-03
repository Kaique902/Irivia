"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

class SentryExampleFrontendError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleFrontendError";
  }
}

export default function Page() {
  const [hasSentError, setHasSentError] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-xl font-mono">sentry-example-page</h1>
      <p className="text-zinc-400 max-w-md text-center">
        Click the button below to test Sentry error monitoring.
      </p>
      <button
        type="button"
        onClick={async () => {
          await Sentry.startSpan(
            { name: "Example Frontend/Backend Span", op: "test" },
            async () => {
              const res = await fetch("/api/sentry-example-api");
              if (!res.ok) {
                setHasSentError(true);
              }
            },
          );
          throw new SentryExampleFrontendError(
            "This error is raised on the frontend of the example page.",
          );
        }}
        className="px-4 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold transition-all"
      >
        <span>Throw Sample Error</span>
      </button>

      {hasSentError ? (
        <p className="text-green-400">Error sent to Sentry.</p>
      ) : (
        <div className="h-10" />
      )}
    </div>
  );
}
