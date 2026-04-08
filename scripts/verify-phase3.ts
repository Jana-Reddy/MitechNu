import { randomUUID } from "node:crypto";
import {
  createCourse,
  createLesson,
  createModule,
  createUser,
  getDashboardData,
  getLearnerLessonView,
  listCategories,
  reviewPayment,
  createOrder,
  submitPaymentProof,
  upsertProgress
} from "../packages/db/src/index.ts";

async function main() {
  const [category] = await listCategories();
  if (!category) {
    throw new Error("No category found.");
  }

  const suffix = `${Date.now()}-${randomUUID().slice(0, 6)}`;
  const learner = await createUser({
    name: `Phase3 Learner ${suffix}`,
    email: `phase3-${suffix}@example.com`,
    password: "password123"
  });

  const admin = await createUser({
    name: `Phase3 Admin ${suffix}`,
    email: `phase3-admin-${suffix}@example.com`,
    password: "password123",
    role: "admin"
  });

  const course = await createCourse({
    title: `Phase3 Course ${suffix}`,
    slug: `phase3-course-${suffix}`,
    excerpt: "phase3 excerpt",
    description: "phase3 description",
    priceInr: 2999,
    categoryId: category.id
  });

  const { setCourseStatus } = await import("../packages/db/src/index.ts");
  await setCourseStatus({ courseId: course.id, status: "published" });

  const moduleRecord = await createModule({
    courseId: course.id,
    title: "Getting Started",
    description: "Kickoff"
  });

  const lessonOne = await createLesson({
    moduleId: moduleRecord.id,
    slug: `phase3-lesson-1-${suffix}`,
    title: "Lesson One",
    type: "article",
    durationMinutes: 10,
    isPreview: true,
    body: "Lesson one body"
  });

  const lessonTwo = await createLesson({
    moduleId: moduleRecord.id,
    slug: `phase3-lesson-2-${suffix}`,
    title: "Lesson Two",
    type: "resource",
    durationMinutes: 15,
    isPreview: false,
    body: "Lesson two body"
  });

  const order = await createOrder({ userId: learner.id, courseSlug: course.slug });
  await submitPaymentProof({ orderId: order.id, reference: `REF-${suffix}` });
  await reviewPayment({ orderId: order.id, reviewerUserId: admin.id, decision: "approved" });

  await upsertProgress({
    userId: learner.id,
    courseId: course.id,
    lessonId: lessonOne.id,
    completed: true,
    watchPositionSeconds: lessonOne.durationMinutes * 60
  });

  const dashboard = await getDashboardData(learner.id);
  const lessonView = await getLearnerLessonView(learner.id, course.slug, lessonOne.slug);

  console.log(
    JSON.stringify(
      {
        dashboardResumeSlug: dashboard.activeCourses[0]?.resumeLessonSlug,
        dashboardCompletedLessons: dashboard.activeCourses[0]?.completedLessons,
        dashboardProgress: dashboard.activeCourses[0]?.progress,
        lessonProgressPercent: lessonView && !lessonView.blocked ? lessonView.progressPercent : null,
        previousLessonSlug: lessonView && !lessonView.blocked ? lessonView.previousLessonSlug ?? null : null,
        nextLessonSlug: lessonView && !lessonView.blocked ? lessonView.nextLessonSlug ?? null : null,
        totalLessons: lessonView && !lessonView.blocked ? lessonView.totalLessons : null,
        certificateIssued: lessonView && !lessonView.blocked ? Boolean(lessonView.certificate) : null
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
