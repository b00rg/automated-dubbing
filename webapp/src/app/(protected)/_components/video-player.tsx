"use client";

import * as React from "react";
import type { Video } from "@/lib/video-type";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";

export default function VideoPlayer({ video }: { video: Video }) {
  const completedBlobUrl = video.completedBlob;
  const originalBlobUrl = video.sourceBlob;

  const [selected, setSelected] = React.useState<"completed" | "original">(
    completedBlobUrl ? "completed" : "original",
  );
  const [src, setSrc] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [completedAvailable, setCompletedAvailable] =
    React.useState(!!completedBlobUrl);
  const [error, setError] = React.useState<string | null>(null);

  // NOTE: do not change blob values/shape — keep exactly as-is
  const completedQ = api.video.getPlaybackUrl.useQuery(
    { blobUrl: completedBlobUrl ?? "" },
    { enabled: false },
  );
  const originalQ = api.video.getPlaybackUrl.useQuery(
    { blobUrl: originalBlobUrl },
    { enabled: false },
  );

  // Wrap refetch calls in stable callbacks so useEffect deps don't include query objects
  const refetchCompleted = React.useCallback(async () => {
    return completedQ.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedBlobUrl]); // depends on the input changing, not the query object identity

  const refetchOriginal = React.useCallback(async () => {
    return originalQ.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalBlobUrl]);

  React.useEffect(() => {
    setSrc(null);
    setLoading(true);
    setSelected(completedBlobUrl ? "completed" : "original");
  }, [video.id, completedBlobUrl]);

  React.useEffect(() => {
    let cancelled = false;

    async function resolveUrl() {
      setLoading(true);
      setError(null);

      const order: Array<"completed" | "original"> =
        selected === "completed"
          ? ["completed", "original"]
          : ["original", "completed"];

      for (const kind of order) {
        try {
          if (kind === "completed") {
            if (!completedBlobUrl) {
              setCompletedAvailable(false);
              continue;
            }

            const res = await refetchCompleted();
            const url = res.data?.url;
            if (cancelled) return;

            if (url) {
              setCompletedAvailable(true);
              setSrc(url);
              setLoading(false);
              return;
            }

            setCompletedAvailable(false);
          } else {
            const res = await refetchOriginal();
            const url = res.data?.url;
            if (cancelled) return;

            if (url) {
              setSrc(url);
              setLoading(false);
              return;
            }
          }
        } catch {
          if (cancelled) return;
          if (kind === "completed") setCompletedAvailable(false);
        }
      }

      if (cancelled) return;
      setSrc(null);
      setLoading(false);
      setError("No playable video available.");
    }

    void resolveUrl();
    return () => {
      cancelled = true;
    };
  }, [
    selected,
    completedBlobUrl,
    originalBlobUrl,
    refetchCompleted,
    refetchOriginal,
  ]);

  return (
    <div>
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "56.25%",
          backgroundColor: "black",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        {src ? (
          <video
            key={src}
            controls
            preload="metadata"
            src={src}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              backgroundColor: "black",
            }}
            onError={() => {
              if (selected === "completed") setSelected("original");
              else setError("Video failed to load.");
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "18px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            {loading ? "Loading video…" : (error ?? "No video source.")}
          </div>
        )}
      </div>

      <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
        <Button
          type="button"
          variant={selected === "completed" ? "default" : "secondary"}
          onClick={() => setSelected("completed")}
          disabled={loading || !completedBlobUrl || !completedAvailable}
        >
          Translated
        </Button>
        <Button
          type="button"
          variant={selected === "original" ? "default" : "secondary"}
          onClick={() => setSelected("original")}
          disabled={loading}
        >
          Original
        </Button>
      </div>
    </div>
  );
}
