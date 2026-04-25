import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { answerLessonQuestion } from "@academy/ai";
import { appendAiMessage, getAiTutorUsage, getCourseBySlug, getLessonContext } from "@academy/db";
import { getCurrentUser } from "../../../../lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { courseSlug?: string; lessonSlug?: string; question?: string };
  if (!body.courseSlug || !body.lessonSlug || !body.question) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const recentUsage = await getAiTutorUsage(user.id, 60);
  if (recentUsage >= 8) {
    return NextResponse.json({ error: "AI tutor rate limit reached. Try again in about an hour." }, { status: 429 });
  }

  const [context, course] = await Promise.all([
    getLessonContext(body.courseSlug, body.lessonSlug),
    getCourseBySlug(body.courseSlug)
  ]);

  if (!context || !course) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  await appendAiMessage({
    id: randomUUID(),
    userId: user.id,
    courseId: context.course.id,
    lessonId: context.lesson.id,
    role: "user",
    content: body.question,
    createdAt: new Date().toISOString()
  });

  const answer = await answerLessonQuestion({
    courseTitle: context.course.title,
    lessonTitle: context.lesson.title,
    lessonBody: context.lesson.body,
    outcomes: course.outcomes,
    question: body.question
  });

  await appendAiMessage({
    id: randomUUID(),
    userId: user.id,
    courseId: context.course.id,
    lessonId: context.lesson.id,
    role: "assistant",
    content: answer,
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({ answer });
}
