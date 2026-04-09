import { describe, expect, it } from "vitest";

import { languageValues } from "@/lib/languages";
import { sampleVideos } from "@/lib/video-type";

describe("sampleVideos", () => {
  it("contains 15 videos with sequential ids", () => {
    expect(sampleVideos).toHaveLength(15);
    expect(sampleVideos.map((video) => video.id)).toEqual(
      Array.from({ length: 15 }, (_, index) => `video-${index + 1}`),
    );
  });

  it("uses only supported language values", () => {
    for (const video of sampleVideos) {
      expect(languageValues).toContain(video.sourceLanguage);
      expect(languageValues).toContain(video.destLanguage);
    }
  });

  it("contains expected status distribution", () => {
    const countByStatus = sampleVideos.reduce<Record<string, number>>(
      (acc, video) => {
        acc[video.status] = (acc[video.status] ?? 0) + 1;
        return acc;
      },
      {},
    );

    expect(countByStatus).toEqual({
      done: 6,
      failed: 2,
      processing: 4,
      queued: 3,
    });
  });

  it("keeps videos ordered from newest to oldest", () => {
    for (let index = 1; index < sampleVideos.length; index++) {
      const previous = sampleVideos[index - 1]!;
      const current = sampleVideos[index]!;
      expect(previous.createdAt.getTime()).toBeGreaterThanOrEqual(
        current.createdAt.getTime(),
      );
    }
  });

  it("uses the expected source blob placeholder", () => {
    expect(
      sampleVideos.every((video) => video.sourceBlob === "placeholder-blob"),
    ).toBe(true);
  });
});
