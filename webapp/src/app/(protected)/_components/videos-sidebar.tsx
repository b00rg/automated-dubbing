import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Video } from "@/lib/video-type";
import { Badge } from "@/components/ui/badge";
import { getLanguageNameForDisplay } from "@/lib/languages";
export default function VideosSidebar({
  videos,
  activeVideo,
  onSelectVideo,
  isLoading = false,
}: {
  videos: Video[];
  activeVideo: Video | null;
  onSelectVideo: (id: string | null) => void;
  isLoading?: boolean;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/*For the "Create New Video Button*/}
      <div className="px-2">
        <Button
          variant="default"
          className="w-full px-2"
          onClick={() => onSelectVideo(null)}
        >
          Translate New Video
        </Button>
        <Separator className="my-0" />
      </div>

      {/*Past Videos, the only scrollable area*/}
      <div className="flex-1 overflow-y-auto overscroll-contain py-2">
        <div className="flex w-full flex-col gap-2">
          {isLoading ? (
            <div className="mx-2 flex items-center justify-center rounded-md border border-dashed py-10">
              <div className="flex flex-col items-center gap-3">
                <div className="border-muted-foreground/30 border-t-primary h-6 w-6 animate-spin rounded-full border-2" />
                <p className="text-muted-foreground text-xs">Loading videos…</p>
              </div>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-muted-foreground mx-2 rounded-md border border-dashed px-3 py-6 text-center text-xs">
              No videos yet. Upload one to get started.
            </div>
          ) : (
            videos.map((video) => (
              <Card
                key={video.id}
                className={
                  video.id === activeVideo?.id
                    ? "bg-accent/40 ring-primary/30 mx-2 rounded-md ring-2"
                    : "mx-2 rounded-md"
                }
                onClick={() => onSelectVideo(video.id)}
                aria-current={video.id === activeVideo?.id ? "true" : undefined}
              >
                <CardContent>
                  <CardTitle className="text-md">{video.title}</CardTitle>
                  <CardDescription className="flex flex-row gap-2">
                    <div>{getLanguageNameForDisplay(video.sourceLanguage)}</div>
                    {"->"}
                    <div>{getLanguageNameForDisplay(video.destLanguage)}</div>
                  </CardDescription>
                  <CardDescription className="text-sm">
                    Uploaded: {new Date(video.createdAt).toLocaleDateString()}
                  </CardDescription>
                  <Badge className="mt-2">{video.status?.toUpperCase()}</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
