"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { appendAiMessage, authenticateUser, createCourse, createNote, createOrder, createUser, getCourseBySlug, getLessonContext, reviewPayment, submitPaymentProof, upsertProgress } from "@academy/db";
import { answerLessonQuestion } from "@academy/ai";
import { clearSession, createSession, getCurrentUser } from "./auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const user = await authenticateUser(email, password);
  if (!user) {
    redirect("/login?error=invalid");
  }
  await createSession(user.id);
  redirect(user.role === "admin" ? "/admin" : "/dashboard");
}

export async function signupAction(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const user = await createUser({ name, email, password });
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function createOrderAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const courseSlug = String(formData.get("courseSlug") ?? "");
  const couponCode = String(formData.get("couponCode") ?? "");
  const order = await createOrder({ userId: user.id, courseSlug, couponCode: couponCode || undefined });
  redirect(`/checkout/${courseSlug}?orderId=${order.id}`);
}

export async function submitPaymentAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const courseSlug = String(formData.get("courseSlug") ?? "");
  const reference = String(formData.get("reference") ?? "");
  const notes = String(formData.get("notes") ?? "");
  await submitPaymentProof({ orderId, reference, notes });
  redirect(`/checkout/${courseSlug}?submitted=1`);
}

export async function approvePaymentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }
  const orderId = String(formData.get("orderId") ?? "");
  const decision = String(formData.get("decision") ?? "") as "approved" | "rejected";
  await reviewPayment({ orderId, reviewerUserId: user.id, decision });
  redirect("/admin?reviewed=1");
}

export async function updateProgressAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  await upsertProgress({
    userId: user.id,
    courseId: String(formData.get("courseId") ?? ""),
    lessonId: String(formData.get("lessonId") ?? ""),
    completed: formData.get("completed") === "true",
    watchPositionSeconds: Number(formData.get("watchPositionSeconds") ?? 0)
  });
  redirect(String(formData.get("returnTo") ?? "/dashboard"));
}

export async function saveNoteAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  await createNote({
    userId: user.id,
    lessonId: String(formData.get("lessonId") ?? ""),
    content: String(formData.get("content") ?? "")
  });
  redirect(String(formData.get("returnTo") ?? "/dashboard"));
}

export async function createCourseAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }
  await createCourse({
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    excerpt: String(formData.get("excerpt") ?? ""),
    description: String(formData.get("description") ?? ""),
    priceInr: Number(formData.get("priceInr") ?? 0),
    categoryId: String(formData.get("categoryId") ?? "")
  });
  redirect("/admin?courseCreated=1");
}

export async function askTutorAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const courseSlug = String(formData.get("courseSlug") ?? "");
  const lessonSlug = String(formData.get("lessonSlug") ?? "");
  const question = String(formData.get("question") ?? "");
  const context = await getLessonContext(courseSlug, lessonSlug);
  const course = await getCourseBySlug(courseSlug);
  if (!context || !course) {
    redirect(`/learn/${courseSlug}/${lessonSlug}?ai=missing`);
  }

  await appendAiMessage({
    id: randomUUID(),
    userId: user.id,
    courseId: context.course.id,
    lessonId: context.lesson.id,
    role: "user",
    content: question,
    createdAt: new Date().toISOString()
  });

  const answer = await answerLessonQuestion({
    courseTitle: context.course.title,
    lessonTitle: context.lesson.title,
    lessonBody: context.lesson.body,
    outcomes: course.outcomes,
    question
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

  redirect(`/learn/${courseSlug}/${lessonSlug}?ai=answered`);
}
