import { describe, expect, it } from "vitest";
import { deriveVideoStatus } from "@/lib/video-progress";

describe("deriveVideoStatus", () => {
  it("returns queued when total tasks is 0", () => {
    expect(
      deriveVideoStatus({
        status: "queued",
        completedBlob: null,
        diarizationCompletedTasks: 0,
        diarizationTotalTasks: 0,
        translationCompletedTasks: 0,
        translationTotalTasks: 0,
        ttsCompletedTasks: 0,
        ttsTotalTasks: 0,
        reconstructionCompletedTasks: 0,
        reconstructionTotalTasks: 0,
      }),
    ).toBe("queued");
  });

  it("returns processing when total tasks is > 0", () => {
    expect(
      deriveVideoStatus({
        status: "queued",
        completedBlob: null,
        diarizationCompletedTasks: 1,
        diarizationTotalTasks: 4,
        translationCompletedTasks: 0,
        translationTotalTasks: 0,
        ttsCompletedTasks: 0,
        ttsTotalTasks: 0,
        reconstructionCompletedTasks: 0,
        reconstructionTotalTasks: 0,
      }),
    ).toBe("processing");
  });

  it("returns done when completedBlob is set and total completed >= total tasks", () => {
    expect(
      deriveVideoStatus({
        status: "processing",
        completedBlob: "https://example.com/blob.mp4",
        diarizationCompletedTasks: 1,
        diarizationTotalTasks: 1,
        translationCompletedTasks: 1,
        translationTotalTasks: 1,
        ttsCompletedTasks: 0,
        ttsTotalTasks: 0,
        reconstructionCompletedTasks: 0,
        reconstructionTotalTasks: 0,
      }),
    ).toBe("done");
  });

  it("returns failed when status is failed", () => {
    expect(
      deriveVideoStatus({
        status: "failed",
        completedBlob: null,
        diarizationCompletedTasks: 1,
        diarizationTotalTasks: 1,
        translationCompletedTasks: 1,
        translationTotalTasks: 1,
        ttsCompletedTasks: 1,
        ttsTotalTasks: 1,
        reconstructionCompletedTasks: 1,
        reconstructionTotalTasks: 1,
      }),
    ).toBe("failed");
  });
});