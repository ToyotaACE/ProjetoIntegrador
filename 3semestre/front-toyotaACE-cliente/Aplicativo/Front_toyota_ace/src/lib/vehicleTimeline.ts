export type TimelineStageStatus = "completed" | "in-progress" | "pending";

export function getTimelineStageStatuses(
  completedStages: readonly boolean[],
): TimelineStageStatus[] {
  const activeStageIndex = completedStages.indexOf(false);

  return completedStages.map((completed, index) => {
    if (completed) return "completed";
    return index === activeStageIndex ? "in-progress" : "pending";
  });
}
