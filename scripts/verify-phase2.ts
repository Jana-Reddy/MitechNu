import { randomUUID } from "node:crypto";
import {
  createCourse,
  createLesson,
  createLessonAsset,
  createModule,
  deleteLesson,
  deleteModule,
  getCourseBySlug,
  listCategories
} from "../packages/db/src/index.ts";

async function main() {
  const [category] = await listCategories();
  if (!category) {
    throw new Error("No category found.");
  }

  const suffix = `${Date.now()}-${randomUUID().slice(0, 6)}`;
  const course = await createCourse({
    title: `Phase2 Asset ${suffix}`,
    slug: `phase2-asset-${suffix}`,
    excerpt: "asset test",
    description: "asset test description",
    priceInr: 1999,
    categoryId: category.id
  });

  const moduleRecord = await createModule({
    courseId: course.id,
    title: "Assets Module",
    description: "Module for asset verification"
  });

  const lesson = await createLesson({
    moduleId: moduleRecord.id,
    slug: `asset-lesson-${suffix}`,
    title: "Asset Lesson",
    type: "resource",
    durationMinutes: 12,
    isPreview: true,
    body: "Lesson body"
  });

  const asset = await createLessonAsset({
    lessonId: lesson.id,
    label: "Workbook PDF",
    kind: "attachment",
    fileKey: `resources/${suffix}/workbook.pdf`
  });

  const courseWithAsset = await getCourseBySlug(course.slug);

  let moduleDeleteError = "";
  try {
    await deleteModule({ moduleId: moduleRecord.id });
  } catch (error) {
    moduleDeleteError = error instanceof Error ? error.message : String(error);
  }

  await deleteLesson({ lessonId: lesson.id });
  await deleteModule({ moduleId: moduleRecord.id });

  const finalCourse = await getCourseBySlug(course.slug);

  console.log(
    JSON.stringify(
      {
        assetId: asset.id,
        assetLabel: asset.label,
        assetKind: asset.kind,
        assetVisibleInQuery:
          courseWithAsset?.modules[0]?.lessons[0]?.assets?.[0]?.fileKey === asset.fileKey,
        moduleDeleteBlocked: moduleDeleteError.includes("Delete the lessons"),
        moduleCountAfterCleanup: finalCourse?.modules.length ?? null
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
