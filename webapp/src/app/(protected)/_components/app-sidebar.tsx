"use client";

import * as React from "react";
import { Video as VideoIcon } from "lucide-react";

import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { Session } from "@/server/better-auth/client";
import type { Video } from "@/lib/video-type";
import VideosSidebar from "./videos-sidebar";

export function AppSidebar({
  videos,
  activeVideo,
  onSelectVideo,
  session,
  isLoading,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  videos: Video[];
  activeVideo: Video | null;
  onSelectVideo: (id: string | null) => void;
  session: Session;
  isLoading?: boolean;
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex flex-row gap-2 p-2">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <VideoIcon className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">AutoDub</span>
            <span className="truncate text-xs">Video translating service</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <VideosSidebar
          videos={videos}
          activeVideo={activeVideo}
          onSelectVideo={onSelectVideo}
          isLoading={isLoading}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={session.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
