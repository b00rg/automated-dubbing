"use client";

import { useEffect, useRef } from "react";
import type { Video } from "@/lib/video-type";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import VideoPlayer from "./video-player";
import { DownloadVideo } from "@/app/_components/download-video";
import { api } from "@/trpc/react";
import { getLanguageNameForDisplay } from "@/lib/languages";
import { Progress } from "@/components/ui/progress";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  deriveVideoProgress,
  type VideoProcessingStatus,
} from "@/lib/video-progress";

/*

Main thing is that there is a prominent download button for the video, but you would probably expect to be able to see all of the info about it like when you uploaded it and maybe a player for the video
The source language and the destination language.
We should probably also have a button to delete the video if the user is done with it.

*/

export default function VideoViewer({
  video,
  onDeleteVideo,
  isDeleting = false,
}: {
  video: Video;
  onDeleteVideo: (videoId: string) => Promise<void>;
  isDeleting?: boolean;
}) {
  const resendIngest = api.video.resendIngest.useMutation();

  const utils = api.useUtils();
  const hasRequestedRefreshRef = useRef(false);

  const handleDeleteVideo = async () => {
    const confirmed = window.confirm("Delete this video?");
    if (!confirmed) return;
    await onDeleteVideo(video.id);
  };

  const { data: progress } = api.video.getVideoProgress.useQuery(
    { videoId: video.id },
    {
      refetchInterval: 2000,
    },
  );

  const liveVideo = progress ?? video;

  useEffect(() => {
    hasRequestedRefreshRef.current = false;
  }, [video.id]);

  useEffect(() => {
    if (progress?.status !== "done" || hasRequestedRefreshRef.current) return;

    hasRequestedRefreshRef.current = true;
    void utils.video.getMyVideos.invalidate();
  }, [progress?.status, utils.video.getMyVideos]);

  const derivedProgress = deriveVideoProgress(
    liveVideo.status as VideoProcessingStatus,
    liveVideo,
  );

  const handleResendIngest = async () => {
    const result = await resendIngest.mutateAsync({ id: video.id });
    if (!result.sent) {
      window.alert("Failed to resend ingest message. Check server logs.");
    }
  };
  return (
    <div style={{ padding: "40px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Gray Box Placeholder for Video */}
        <VideoPlayer video={video} />
        {/* Bottom section under the video*/}
        <div
          style={{
            paddingTop: "0px",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "24px",
          }}
        >
          {/* Left: title + other details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1
                style={{
                  fontSize: "45px",
                  fontWeight: "bold",
                  marginTop: "10px",
                }}
              >
                {video.title}
              </h1>

              {/* Small square action button to edit title and other actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex h-8 w-8 items-center justify-center p-0"
                    style={{ fontSize: "20px" }}
                  >
                    ☰
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Edit Video Title</DropdownMenuItem>
                  <DropdownMenuItem>
                    Change Destination Language
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isDeleting}
                    onClick={(event) => {
                      event.preventDefault();
                      void handleDeleteVideo();
                    }}
                  >
                    {isDeleting ? "Deleting..." : "Delete Video"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Video Details */}
            <div style={{ marginTop: "10px", fontSize: "14px", color: "#555" }}>
              <p>Uploaded: {new Date(video.createdAt).toLocaleDateString()}</p>
              <p>
                Source Language:{" "}
                {getLanguageNameForDisplay(video.sourceLanguage)}
              </p>
              <p>
                Destination Language:{" "}
                {getLanguageNameForDisplay(video.destLanguage)}
              </p>
            </div>
          </div>

          {/* Right: translation status + export (bottom-right under video) */}
          <div
            style={{
              width: "340px",
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              color: "#333",
              position: "relative",
              top: "-30px",
            }}
          >
            <h3
              style={{
                fontSize: "25px",
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
              Translation Status:
            </h3>

            <div className="flex flex-wrap justify-between">
              <Badge
                variant={liveVideo.status == "queued" ? "outline" : "ghost"}
              >
                Queued
              </Badge>

              <Badge
                variant={liveVideo.status == "processing" ? "outline" : "ghost"}
                className={
                  liveVideo.status === "processing"
                    ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                    : ""
                }
              >
                Processing
                {liveVideo.status === "processing" && (
                  <Spinner
                    className="ml-2 inline-block align-middle"
                    data-icon="inline-end"
                  />
                )}
              </Badge>

              <Badge
                variant={liveVideo.status == "done" ? "outline" : "ghost"}
                className={
                  liveVideo.status == "done"
                    ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                    : ""
                }
              >
                Ready
              </Badge>

              <Badge
                variant={liveVideo.status == "failed" ? "outline" : "ghost"}
                className={
                  liveVideo.status === "failed"
                    ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                    : ""
                }
              >
                Failed
              </Badge>
            </div>

            {/* Progress on translation for the user */}
            <div style={{ marginTop: "30px" }}>
              <Field className="w-full max-w-sm">
                <Progress value={derivedProgress.overallPercent} id="progress-total" />
                <FieldLabel htmlFor="progress-total">
                  <span>{derivedProgress.summaryLabel}</span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    {derivedProgress.totalCompleted}/{derivedProgress.totalTasks}
                  </span>
                  <span className="ml-auto">{derivedProgress.overallPercent}%</span>
                </FieldLabel>
              </Field>

              <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
                {derivedProgress.stages.map((stage) => (
                  <Field key={stage.key} className="w-full max-w-sm">
                    <FieldLabel htmlFor={`progress-stage-${stage.key}`}>
                      <span>{stage.label}</span>
                      <span className="text-muted-foreground ml-auto text-xs">
                        {stage.completed}/{stage.total}
                      </span>
                    </FieldLabel>
                    <Progress
                      value={stage.percent}
                      id={`progress-stage-${stage.key}`}
                    />
                  </Field>
                ))}
              </div>
            </div>

            <div
              style={{
                marginTop: "30px",
              }}
            >
              <DownloadVideo
                completedBlobId={video.completedBlob}
                originalBlobId={video.sourceBlob}
              />
            </div>

            <div style={{ marginTop: "16px" }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleResendIngest()}
                disabled={resendIngest.isPending}
              >
                {resendIngest.isPending ? "Resending..." : "Resend ingest"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
