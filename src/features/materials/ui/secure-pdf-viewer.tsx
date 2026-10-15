"use client";

import { useEffect, useState } from "react";

export function SecurePdfViewer({ src, title }: { src: string; title: string }) {
  const [objectUrl, setObjectUrl] = useState<string>();
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let url: string | undefined;

    async function load() {
      try {
        const response = await fetch(src, { credentials: "same-origin", signal: controller.signal });
        if (!response.ok) throw new Error("The protected document could not be loaded.");
        const blob = await response.blob();
        if (!blob.type.toLowerCase().startsWith("application/pdf")) throw new Error("This resource is not a valid PDF document.");
        url = URL.createObjectURL(blob);
        setObjectUrl(url);
      } catch (value) {
        if (!controller.signal.aborted) setError(value instanceof Error ? value.message : "The protected document could not be loaded.");
      }
    }

    void load();
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [src]);

  if (error) return <div className="pdf-reader-state" role="alert"><strong>Document unavailable</strong><p>{error}</p><button type="button" onClick={() => window.location.reload()}>Try again</button></div>;
  if (!objectUrl) return <div className="pdf-reader-state" role="status"><span className="pdf-loader"/><strong>Loading secure document…</strong></div>;
  return <iframe title={title} src={`${objectUrl}#toolbar=1&navpanes=0&view=FitH`} className="pdf-reader"/>;
}
