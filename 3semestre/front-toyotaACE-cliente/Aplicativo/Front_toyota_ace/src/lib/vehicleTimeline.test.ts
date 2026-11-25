import { describe, expect, it } from "vitest";
import { getTimelineStageStatuses } from "@/lib/vehicleTimeline";

describe("getTimelineStageStatuses", () => {
  it("marks completed, active, and upcoming stages separately", () => {
    expect(getTimelineStageStatuses([true, false, false])).toEqual([
      "completed",
      "in-progress",
      "pending",
    ]);
  });

  it("marks the first stage active when no stages are complete", () => {
    expect(getTimelineStageStatuses([false, false])).toEqual([
      "in-progress",
      "pending",
    ]);
  });

  it("marks every stage complete when progress is complete", () => {
    expect(getTimelineStageStatuses([true, true])).toEqual([
      "completed",
      "completed",
    ]);
  });
});
