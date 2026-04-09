"use client";

import { useEffect, useMemo, useState } from "react";
import { type Video } from "@/lib/video-type";
import type { Session } from "@/server/better-auth/client";
import { api } from "@/trpc/react";

import { AppSidebar } from "./app-sidebar";
import VideoViewer from "./video-viewer";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import VideoUpload from "./video-upload";

export default function ProtectedPageClient({ session }: { session: Session }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [pendingVideoId, setPendingVideoId] = useState<string | null>(null);
  const {
    data: myVideos,
    refetch: refetchMyVideos,
    isLoading: isVideosLoading,
  } = api.video.getMyVideos.useQuery();
  const deleteVideo = api.video.deleteVideo.useMutation();

  useEffect(() => {
    if (!myVideos) return;

    setVideos(myVideos);

    const pendingExists = pendingVideoId
      ? myVideos.some((video) => video.id === pendingVideoId)
      : false;

    if (pendingExists) {
      setPendingVideoId(null);
    }
  }, [myVideos, pendingVideoId]);

  const activeVideo = useMemo(
    () => videos.find((video) => video.id === activeVideoId) ?? null,
    [videos, activeVideoId],
  );

  const handleUploadComplete = async (createdVideo: Video) => {
    setPendingVideoId(createdVideo.id);
    setActiveVideoId(createdVideo.id);
    setVideos((prev) => {
      if (prev.some((video) => video.id === createdVideo.id)) return prev;
      return [createdVideo, ...prev];
    });
    await refetchMyVideos();
  };

  const handleSelectVideo = (id: string | null) => {
    setPendingVideoId(null);
    setActiveVideoId(id);
  };

  const handleDeleteVideo = async (videoId: string) => {
    await deleteVideo.mutateAsync({ id: videoId });
    setPendingVideoId((prev) => (prev === videoId ? null : prev));
    setVideos((prev) => {
      const nextVideos = prev.filter((video) => video.id !== videoId);
      setActiveVideoId((activeId) => {
        if (activeId !== videoId) return activeId;
        return nextVideos[0]?.id ?? null;
      });
      return nextVideos;
    });
    await refetchMyVideos();
  };

  return (
    <SidebarProvider>
      <AppSidebar
        videos={videos}
        activeVideo={activeVideo}
        onSelectVideo={handleSelectVideo}
        session={session}
        isLoading={isVideosLoading}
      />
      <SidebarInset>
        {activeVideo && (
          <VideoViewer
            video={activeVideo}
            onDeleteVideo={handleDeleteVideo}
            isDeleting={deleteVideo.isPending}
          />
        )}
        {!activeVideo && (
          <VideoUpload onUploadComplete={handleUploadComplete} />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
