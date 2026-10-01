import { describe, expect, it } from "vitest";
import {
  getAvailableAppointmentTimes,
  getInitialAppointmentDate,
} from "@/lib/scheduling";

describe("getInitialAppointmentDate", () => {
  it("starts tomorrow when no business-hour slots remain today", () => {
    const date = getInitialAppointmentDate(new Date(2026, 9, 1, 16));

    expect(date).toEqual(new Date(2026, 9, 2, 16));
  });
});

describe("getAvailableAppointmentTimes", () => {
  it("excludes times already booked on the selected date", () => {
    const times = getAvailableAppointmentTimes(
      "2026-10-02",
      [
        { date: "2026-10-02", time: "09:00:00" },
        { date: "2026-10-03", time: "10:00:00" },
      ],
      new Date(2026, 9, 1, 12),
    );

    expect(times).toEqual([
      "08:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
    ]);
  });

  it("hides past times when booking for today", () => {
    const times = getAvailableAppointmentTimes(
      "2026-10-01",
      [],
      new Date(2026, 9, 1, 10, 30),
    );

    expect(times).toEqual(["11:00", "12:00", "13:00", "14:00", "15:00", "16:00"]);
  });
});