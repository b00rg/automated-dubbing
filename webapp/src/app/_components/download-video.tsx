"use client";

import { DownloadButton } from "./download-button";
import { Button } from "@/components/ui/button";

export function DownloadVideo({
  completedBlobId,
  originalBlobId,
}: {
  completedBlobId: string | null;
  originalBlobId: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {completedBlobId ? (
        <DownloadButton
          blobId={completedBlobId}
          filename="autodub-completed.mp4"
          label="Download Translated Video"
        />
      ) : (
        <Button disabled className="">
          Download Translated Video
        </Button>
      )}
      {originalBlobId ? (
        <DownloadButton
          blobId={originalBlobId}
          filename="autodub-original.mp4"
          label="Download original"
        />
      ) : null}
    </div>
  );
}
