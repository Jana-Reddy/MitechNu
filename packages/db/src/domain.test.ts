import { describe, expect, it } from "vitest";
import { calculateCourseProgress, calculateDiscountedPrice } from "./domain";

describe("domain helpers", () => {
  it("calculates discounted prices", () => {
    expect(calculateDiscountedPrice(5000, 20)).toBe(4000);
  });

  it("calculates course progress", () => {
    expect(
      calculateCourseProgress(
        [{ id: "m1", courseId: "c1", title: "", description: "", order: 1 }],
        [
          { id: "l1", moduleId: "m1", slug: "", title: "", type: "article", order: 1, durationMinutes: 10, isPreview: false, body: "" },
          { id: "l2", moduleId: "m1", slug: "", title: "", type: "article", order: 2, durationMinutes: 10, isPreview: false, body: "" }
        ],
        [{ id: "p1", userId: "u1", courseId: "c1", lessonId: "l1", completed: true, watchPositionSeconds: 42, updatedAt: "" }],
        "c1"
      )
    ).toBe(50);
  });
});
