"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";

export function DownloadButton({
  blobId,
  filename = "video.mp4",
  label = "Download",
  disabled,
}: {
  blobId: string;
  filename?: string;
  label?: string;
  disabled?: boolean;
}) {
  const [isLoading, setIsLoading] = React.useState(false);

  const getUrl = api.video.getDownloadUrl.useQuery(
    { blobUrl: blobId, filename },
    { enabled: false },
  );

  async function onClick() {
    if (!blobId) return;
    setIsLoading(true);
    try {
      const result = await getUrl.refetch();
      const url = result.data?.url;
      if (!url) throw new Error("No download URL returned");

      const a = document.createElement("a");
      a.href = url;
      a.download = filename; // may be ignored cross-origin
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button onClick={onClick} disabled={disabled ?? isLoading ?? !blobId}>
      {isLoading ? "Preparing..." : label}
    </Button>
  );
}
