import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";
import { randomUUID } from "crypto";
import path from "path";
import { languageCodes } from "@/lib/languages";
import { deriveVideoStatus } from "@/lib/video-progress";
import { videos } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { sendIngestMessage } from "@/server/kafka/producer";

const storageCredential = new StorageSharedKeyCredential(
  env.AZURE_STORAGE_ACCOUNT,
  env.AZURE_STORAGE_KEY,
);
const blobServiceClient = new BlobServiceClient(
  `https://${env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`,
  storageCredential,
);
const containerClient = blobServiceClient.getContainerClient(
  env.AZURE_STORAGE_CONTAINER,
);

const storageHost = `${env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`;
const storageContainerPrefix = `/${env.AZURE_STORAGE_CONTAINER}/`;
const storageAccountUrl = `https://${storageHost}${storageContainerPrefix}`;

const normalizeBlobName = (blobLocation: string) => {
  if (blobLocation.startsWith(storageAccountUrl)) {
    return blobLocation.replace(storageAccountUrl, "");
  }

  try {
    const parsed = new URL(blobLocation);
    if (
      parsed.hostname === storageHost &&
      parsed.pathname.startsWith(storageContainerPrefix)
    ) {
      return parsed.pathname.replace(storageContainerPrefix, "");
    }
  } catch {
    // Not a URL, treat as relative path
  }

  return blobLocation.startsWith("/") ? blobLocation.slice(1) : blobLocation;
};

const normalizeBlobNameOrThrow = (blobLocation: string) => {
  if (blobLocation.startsWith(storageAccountUrl)) {
    return blobLocation.replace(storageAccountUrl, "");
  }

  try {
    const parsed = new URL(blobLocation);
    if (
      parsed.hostname === storageHost &&
      parsed.pathname.startsWith(storageContainerPrefix)
    ) {
      return parsed.pathname.replace(storageContainerPrefix, "");
    }

    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid blob location",
    });
  } catch (error) {
    if (error instanceof TRPCError) throw error;
  }

  return blobLocation.startsWith("/") ? blobLocation.slice(1) : blobLocation;
};

export const videoRouter = createTRPCRouter({
  getMyVideos: protectedProcedure.query(async ({ ctx }) => {
    const videosData = await ctx.db
      .select()
      .from(videos)
      .where(eq(videos.createdById, ctx.session.user.id))
      .orderBy(desc(videos.createdAt));

    return videosData.map((video) => {
      const normalized = {
        ...video,
        sourceBlob: normalizeBlobName(video.sourceBlob),
        completedBlob: video.completedBlob
          ? normalizeBlobName(video.completedBlob)
          : null,
      };

      return {
        ...normalized,
        status: deriveVideoStatus(normalized),
      };
    });
  }),
  createUpload: protectedProcedure
    .input(
      z.object({
        fileName: z.string().min(1),
        contentType: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await containerClient.createIfNotExists();

      const extension = path.extname(input.fileName);
      const blobName = `${ctx.session.user.id}/${randomUUID()}${extension}`;
      const blobClient = containerClient.getBlobClient(blobName);

      const startsOn = new Date(Date.now() - 5 * 60 * 1000);
      const expiresOn = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const sasToken = generateBlobSASQueryParameters(
        {
          containerName: env.AZURE_STORAGE_CONTAINER,
          blobName,
          permissions: BlobSASPermissions.parse("cw"),
          startsOn,
          expiresOn,
        },
        storageCredential,
      ).toString();

      return {
        uploadUrl: `${blobClient.url}?${sasToken}`,
        blobName,
        blobUrl: blobClient.url,
        expiresAt: expiresOn.toISOString(),
      };
    }),

  finalizeUpload: protectedProcedure
    .input(
      z.object({
        blobName: z.string().min(1),
        title: z.string().min(1),
        sourceLanguage: z.enum(languageCodes),
        destLanguage: z.enum(languageCodes),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.sourceLanguage === input.destLanguage) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Source and destination languages must be different.",
        });
      }

      const blobClient = containerClient.getBlobClient(input.blobName);

      try {
        const properties = await blobClient.getProperties();
        if (!properties.contentLength || properties.contentLength <= 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Uploaded blob is empty.",
          });
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Upload not found. Please retry your upload.",
        });
      }

      const [video] = await ctx.db
        .insert(videos)
        .values({
          id: randomUUID(),
          title: input.title.trim(),
          createdById: ctx.session.user.id,
          sourceBlob: input.blobName,
          status: "queued",
          sourceLanguage: input.sourceLanguage,
          destLanguage: input.destLanguage,
        })
        .returning();

      if (!video) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create video record",
        });
      }

      try {
        await sendIngestMessage({
          src_blob: normalizeBlobName(blobClient.url),
          src_lang: video.sourceLanguage ?? null,
          dest_lang: video.destLanguage,
        });
      } catch (error) {
        console.error("Failed to send ingest message:", error);
      }

      return {
        ...video,
        sourceBlob: normalizeBlobName(video.sourceBlob),
      };
    }),

  resendIngest: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const video = await ctx.db.query.videos.findFirst({
        where: (videos, { eq, and }) =>
          and(
            eq(videos.id, input.id),
            eq(videos.createdById, ctx.session.user.id),
          ),
      });

      if (!video) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video not found",
        });
      }

      try {
        const blobName = normalizeBlobName(video.sourceBlob);
        await sendIngestMessage({
          src_blob: blobName,
          src_lang: video.sourceLanguage ?? null,
          dest_lang: video.destLanguage,
        });

        return { sent: true };
      } catch (error) {
        console.error("Failed to resend ingest message:", error);
        return { sent: false };
      }
    }),

  deleteVideo: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const video = await ctx.db.query.videos.findFirst({
        where: (videos, { eq, and }) =>
          and(
            eq(videos.id, input.id),
            eq(videos.createdById, ctx.session.user.id),
          ),
      });

      if (!video) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video not found",
        });
      }

      const deleteBlobIfExists = async (blobUrl: string) => {
        const blobName = normalizeBlobName(blobUrl);
        const blobClient = containerClient.getBlobClient(blobName);
        try {
          await blobClient.deleteIfExists();
        } catch (error) {
          console.error(`Error deleting blob ${blobName}:`, error);
        }
      };

      await deleteBlobIfExists(video.sourceBlob);

      if (video.completedBlob) {
        await deleteBlobIfExists(video.completedBlob);
      }

      await ctx.db.delete(videos).where(eq(videos.id, input.id));

      return { success: true };
    }),

  getPlaybackUrl: protectedProcedure
    .input(
      z.object({
        blobUrl: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      const blobName = normalizeBlobNameOrThrow(input.blobUrl);

      const blobClient = containerClient.getBlobClient(blobName);

      const startsOn = new Date(Date.now() - 5 * 60 * 1000);
      const expiresOn = new Date(Date.now() + 60 * 60 * 1000);

      const sasToken = generateBlobSASQueryParameters(
        {
          containerName: env.AZURE_STORAGE_CONTAINER,
          blobName,
          permissions: BlobSASPermissions.parse("r"),
          startsOn,
          expiresOn,
          // important difference from getDownloadUrl:
          // don't force "attachment" download
          contentDisposition: "inline",
        },
        storageCredential,
      ).toString();

      return {
        url: `${blobClient.url}?${sasToken}`,
      };
    }),

  getDownloadUrl: protectedProcedure
    .input(
      z.object({
        blobUrl: z.string().min(1),
        filename: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const blobName = normalizeBlobNameOrThrow(input.blobUrl);
      const blobClient = containerClient.getBlobClient(blobName);

      const startsOn = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const expiresOn = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      const sasToken = generateBlobSASQueryParameters(
        {
          containerName: env.AZURE_STORAGE_CONTAINER,
          blobName,
          permissions: BlobSASPermissions.parse("r"), // Read only
          startsOn,
          expiresOn,
          contentDisposition: input.filename
            ? `attachment; filename="${input.filename}"`
            : undefined,
        },
        storageCredential,
      ).toString();

      return {
        url: `${blobClient.url}?${sasToken}`,
      };
    }),

  getVideoProgress: protectedProcedure
    .input(
      z.object({
        videoId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const video = await ctx.db.query.videos.findFirst({
        //find first row in the videos table that matches videoID
        where: (videos, { eq }) => eq(videos.id, input.videoId),
        columns: {
          //returns the following columns from the videos table
          id: true,
          status: true,
          completedBlob: true,
          diarizationCompletedTasks: true,
          diarizationTotalTasks: true,
          translationCompletedTasks: true,
          translationTotalTasks: true,
          ttsCompletedTasks: true,
          ttsTotalTasks: true,
          reconstructionCompletedTasks: true,
          reconstructionTotalTasks: true,
        },
      });

      if (!video) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Video not found",
        });
      }

      return {
        ...video,
        status: deriveVideoStatus(video),
      };
    }),
});
