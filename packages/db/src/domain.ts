import type { Course, Lesson, Module, ProgressRecord } from "./types";

export function calculateDiscountedPrice(priceInr: number, percentageOff = 0) {
  return Math.max(0, Math.round(priceInr * (1 - percentageOff / 100)));
}

export function calculateCourseProgress(
  modules: Module[],
  lessons: Lesson[],
  progress: ProgressRecord[],
  courseId: string
) {
  const courseModuleIds = new Set(modules.filter((module) => module.courseId === courseId).map((module) => module.id));
  const courseLessons = lessons.filter((lesson) => courseModuleIds.has(lesson.moduleId));
  if (!courseLessons.length) {
    return 0;
  }

  const completedCount = courseLessons.filter((lesson) =>
    progress.some((entry) => entry.lessonId === lesson.id && entry.completed)
  ).length;

  return Math.round((completedCount / courseLessons.length) * 100);
}

export function getFeaturedCourses(courses: Course[]) {
  return courses.filter((course) => course.status === "published" && course.featured);
}

