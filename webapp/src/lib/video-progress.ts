export type VideoProcessingStatus = "queued" | "processing" | "done" | "failed";

export type VideoTaskCounts = {
  diarizationCompletedTasks: number | null;
  diarizationTotalTasks: number | null;
  translationCompletedTasks: number | null;
  translationTotalTasks: number | null;
  ttsCompletedTasks: number | null;
  ttsTotalTasks: number | null;
  reconstructionCompletedTasks: number | null;
  reconstructionTotalTasks: number | null;
};

type StageConfig = {
  key: "diarization" | "translation" | "tts" | "reconstruction";
  label: string;
  completedKey: keyof VideoTaskCounts;
  totalKey: keyof VideoTaskCounts;
};

export type StageProgress = {
  key: StageConfig["key"];
  label: string;
  completed: number;
  total: number;
  percent: number;
  isComplete: boolean;
};

export type DerivedVideoProgress = {
  stages: StageProgress[];
  totalCompleted: number;
  totalTasks: number;
  overallPercent: number;
  currentStageLabel: string | null;
  summaryLabel: string;
}; 

export const deriveVideoStatus = (
  video: VideoTaskCounts & {
    status?: VideoProcessingStatus;
    completedBlob?: string | null;
  },
): VideoProcessingStatus => {
  if (video.status === "failed") {
    return "failed";
  }

  if (video.status === "done") {
    return "done";
  }

  const totalCompleted =
    toSafeNonNegative(video.diarizationCompletedTasks) +
    toSafeNonNegative(video.translationCompletedTasks) +
    toSafeNonNegative(video.ttsCompletedTasks) +
    toSafeNonNegative(video.reconstructionCompletedTasks);

  const totalTasks =
    toSafeNonNegative(video.diarizationTotalTasks) +
    toSafeNonNegative(video.translationTotalTasks) +
    toSafeNonNegative(video.ttsTotalTasks) +
    toSafeNonNegative(video.reconstructionTotalTasks);

  if (video.completedBlob && totalTasks <= totalCompleted) {
    return "done";
  }

  if (totalTasks > 0) {
    return "processing";
  }

  return "queued";
};

const STAGE_CONFIG: StageConfig[] = [
  {
    key: "diarization",
    label: "Diarisation",
    completedKey: "diarizationCompletedTasks",
    totalKey: "diarizationTotalTasks",
  },
  {
    key: "translation",
    label: "Translation",
    completedKey: "translationCompletedTasks",
    totalKey: "translationTotalTasks",
  },
  {
    key: "tts",
    label: "Text-To-Speech",
    completedKey: "ttsCompletedTasks",
    totalKey: "ttsTotalTasks",
  },
  {
    key: "reconstruction",
    label: "Reconstruction",
    completedKey: "reconstructionCompletedTasks",
    totalKey: "reconstructionTotalTasks",
  },
];

const toSafeNonNegative = (value: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.floor(value));
};

export const deriveVideoProgress = (
  status: VideoProcessingStatus,
  counts: VideoTaskCounts,
): DerivedVideoProgress => {
  const stages = STAGE_CONFIG.map((stage): StageProgress => {
    const rawCompleted = toSafeNonNegative(counts[stage.completedKey]);
    const rawTotal = toSafeNonNegative(counts[stage.totalKey]);

    if (status === "done") {
      const resolvedTotal = Math.max(rawTotal, rawCompleted, 1);
      return {
        key: stage.key,
        label: stage.label,
        completed: resolvedTotal,
        total: resolvedTotal,
        percent: 100,
        isComplete: true,
      };
    }

    const completed = Math.min(rawCompleted, rawTotal);
    const total = rawTotal;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      key: stage.key,
      label: stage.label,
      completed,
      total,
      percent,
      isComplete: total > 0 && completed >= total,
    };
  });

  const totalCompleted = stages.reduce((sum, stage) => sum + stage.completed, 0);
  const totalTasks = stages.reduce((sum, stage) => sum + stage.total, 0);

  const overallPercent =
    status === "done"
      ? 100
      : Math.round(
          stages.reduce((sum, stage) => sum + stage.percent, 0) /
            STAGE_CONFIG.length,
        );

  const currentStageLabel =
    status === "processing"
      ? stages.find((stage) => stage.total > 0 && !stage.isComplete)?.label ?? null
      : null;

  const summaryLabel =
    status === "done"
      ? "All steps completed"
      : status === "failed"
        ? "Processing failed"
        : currentStageLabel
          ? `Current step: ${currentStageLabel}`
          : "Waiting for progress updates";

  return {
    stages,
    totalCompleted,
    totalTasks,
    overallPercent,
    currentStageLabel,
    summaryLabel,
  };
};