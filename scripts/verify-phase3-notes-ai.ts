import { randomUUID } from "node:crypto";
import {
  appendAiMessage,
  createCourse,
  createLesson,
  createModule,
  createNote,
  createOrder,
  createUser,
  deleteNote,
  getLearnerLessonView,
  listCategories,
  reviewPayment,
  setCourseStatus,
  submitPaymentProof,
  updateNote
} from "../packages/db/src/index.ts";

async function main() {
  const [category] = await listCategories();
  if (!category) {
    throw new Error("No category found.");
  }

  const suffix = `${Date.now()}-${randomUUID().slice(0, 6)}`;
  const learner = await createUser({
    name: `Phase3 Notes ${suffix}`,
    email: `phase3-notes-${suffix}@example.com`,
    password: "password123"
  });

  const admin = await createUser({
    name: `Phase3 Notes Admin ${suffix}`,
    email: `phase3-notes-admin-${suffix}@example.com`,
    password: "password123",
    role: "admin"
  });

  const course = await createCourse({
    title: `Phase3 Notes Course ${suffix}`,
    slug: `phase3-notes-course-${suffix}`,
    excerpt: "notes excerpt",
    description: "notes description",
    priceInr: 2499,
    categoryId: category.id
  });

  await setCourseStatus({ courseId: course.id, status: "published" });

  const moduleRecord = await createModule({
    courseId: course.id,
    title: "Notes Module",
    description: "Notes module"
  });

  const lesson = await createLesson({
    moduleId: moduleRecord.id,
    slug: `phase3-notes-lesson-${suffix}`,
    title: "Notes Lesson",
    type: "article",
    durationMinutes: 9,
    isPreview: false,
    body: "Lesson body"
  });

  const order = await createOrder({ userId: learner.id, courseSlug: course.slug });
  await submitPaymentProof({ orderId: order.id, reference: `REF-${suffix}` });
  await reviewPayment({ orderId: order.id, reviewerUserId: admin.id, decision: "approved" });

  const note = await createNote({
    userId: learner.id,
    lessonId: lesson.id,
    content: "First draft note"
  });

  await updateNote({
    userId: learner.id,
    noteId: note.id,
    content: "Updated note content"
  });

  await appendAiMessage({
    id: randomUUID(),
    userId: learner.id,
    courseId: course.id,
    lessonId: lesson.id,
    role: "user",
    content: "What should I remember from this lesson?",
    createdAt: new Date().toISOString()
  });

  await appendAiMessage({
    id: randomUUID(),
    userId: learner.id,
    courseId: course.id,
    lessonId: lesson.id,
    role: "assistant",
    content: "Remember the key concepts and apply them right away.",
    createdAt: new Date().toISOString()
  });

  const beforeDelete = await getLearnerLessonView(learner.id, course.slug, lesson.slug);
  await deleteNote({ userId: learner.id, noteId: note.id });
  const afterDelete = await getLearnerLessonView(learner.id, course.slug, lesson.slug);

  console.log(
    JSON.stringify(
      {
        updatedNoteContent: beforeDelete && !beforeDelete.blocked ? beforeDelete.notes[0]?.content : null,
        aiHistoryCount: beforeDelete && !beforeDelete.blocked ? beforeDelete.aiMessages?.length ?? 0 : null,
        aiAssistantReply: beforeDelete && !beforeDelete.blocked ? beforeDelete.aiMessages?.[1]?.content : null,
        notesAfterDelete: afterDelete && !afterDelete.blocked ? afterDelete.notes.length : null
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
