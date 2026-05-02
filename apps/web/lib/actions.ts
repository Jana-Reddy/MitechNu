"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { appendAiMessage, authenticateUser, createCourse, createLesson, createLessonAsset, createModule, createNote, createOrder, createUser, deleteCourse, deleteLesson, deleteModule, deleteNote, getAiTutorUsage, getCourseBySlug, getLessonContext, getLearnerLessonView, listOrdersForUser, moveLesson, moveModule, reviewPayment, setCourseStatus, submitPaymentProof, updateCourse, updateLesson, updateModule, updateNote, upsertPaymentSettings, upsertProgress, listAllLearners } from "@academy/db";
import { answerLessonQuestion } from "@academy/ai";
import { clearSession, createSession, getCurrentUser } from "./auth";
import { cleanOptionalText, cleanText, isValidCourseId, isValidEmail, isValidGoogleDriveUrl, isValidSlug, isValidUpiId, normalizeEmail, normalizeSlug, parseNonNegativeNumber, parsePositiveNumber, sanitizeHtml } from "./validation";
import { revalidatePath } from "next/cache";
import { checkRateLimit } from "./rate-limit";
import { logError, logInfo, logWarn } from "./error-logger";
import { onCoursePublished } from "./automation";

export async function loginAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!isValidEmail(email) || password.length < 6) {
    redirect("/login?error=invalid");
  }

  // Rate limiting: 5 login attempts per minute per email
  const rateLimitResult = checkRateLimit(`login:${email}`, 5, 60000);
  if (!rateLimitResult.success) {
    logWarn("Rate limit exceeded for login", { email });
    redirect("/login?error=rate-limited");
  }

  const user = await authenticateUser(email, password);
  if (!user) {
    logWarn("Failed login attempt", { email });
    redirect("/login?error=invalid");
  }
  await createSession(user.id);
  redirect(user.role === "admin" ? "/admin" : "/dashboard");
}

export async function signupAction(formData: FormData) {
  const name = cleanText(formData.get("name"));
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!name || name.length > 80 || !isValidEmail(email) || password.length < 6) {
    redirect("/signup?error=invalid");
  }

  // Rate limiting: 3 signup attempts per minute per email
  const rateLimitResult = checkRateLimit(`signup:${email}`, 3, 60000);
  if (!rateLimitResult.success) {
    redirect("/signup?error=rate-limited");
  }

  let user;
  try {
    user = await createUser({ name, email, password, role: "learner" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("already exists")) {
      redirect("/signup?error=exists");
    }
    redirect("/signup?error=failed");
  }
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
  const courseSlug = normalizeSlug(String(formData.get("courseSlug") ?? ""));
  const couponCode = cleanOptionalText(formData.get("couponCode"))?.toUpperCase();
  if (!isValidSlug(courseSlug)) {
    redirect("/courses?error=invalid-course");
  }

  let order;
  try {
    order = await createOrder({ userId: user.id, courseSlug, couponCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("active order")) {
      redirect(`/courses/${courseSlug}?error=existing-order`);
    }
    if (message.includes("already enrolled")) {
      redirect(`/courses/${courseSlug}?error=already-enrolled`);
    }
    redirect(`/courses/${courseSlug}?error=order-failed`);
  }
  redirect(`/checkout/${courseSlug}?orderId=${order.id}`);
}

export async function submitPaymentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const orderId = String(formData.get("orderId") ?? "");
  const courseSlug = normalizeSlug(String(formData.get("courseSlug") ?? ""));
  const reference = cleanText(formData.get("reference"));
  const notes = cleanOptionalText(formData.get("notes"));
  const screenshotFile = formData.get("screenshotFile");

  if (!orderId || !isValidSlug(courseSlug) || reference.length < 4 || reference.length > 120 || (notes && notes.length > 1000)) {
    redirect(`/checkout/${courseSlug}?error=invalid-payment`);
  }

  let screenshotUrl: string | undefined;
  if (screenshotFile instanceof File && screenshotFile.size > 0) {
    if (screenshotFile.size > 1024 * 1024) {
      redirect(`/checkout/${courseSlug}?error=invalid-payment`);
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(screenshotFile.type)) {
      redirect(`/checkout/${courseSlug}?error=invalid-payment`);
    }
    const buffer = Buffer.from(await screenshotFile.arrayBuffer());
    screenshotUrl = `data:${screenshotFile.type};base64,${buffer.toString("base64")}`;
  }

  const orders = await listOrdersForUser(user.id);
  if (!orders.some((order: any) => order.id === orderId)) {
    redirect(`/checkout/${courseSlug}?error=invalid-order`);
  }

  await submitPaymentProof({ orderId, reference, notes, screenshotUrl });
  redirect(`/checkout/${courseSlug}?submitted=1`);
}

export async function updatePaymentSettingsAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  const upiId = cleanOptionalText(formData.get("upiId"));
  const payeeName = cleanOptionalText(formData.get("payeeName"));
  const qrCodeUrlInput = cleanOptionalText(formData.get("qrCodeUrl"));
  const note = cleanOptionalText(formData.get("note"));

  // Validate UPI only when provided
  if (upiId && !isValidUpiId(upiId)) {
    redirect("/admin?error=invalid-payment-settings");
  }
  if (payeeName && payeeName.length > 100) {
    redirect("/admin?error=invalid-payment-settings");
  }

  try {
    await upsertPaymentSettings({
      upiId: upiId ?? "",
      payeeName: payeeName ?? "",
      qrCodeUrl: qrCodeUrlInput ?? "",
      note: note ?? ""
    });
  } catch (error) {
    console.error("Error in upsertPaymentSettings:", error);
    redirect("/admin?error=payment-settings");
  }

  redirect("/admin?paymentSettingsUpdated=1");
}

export async function approvePaymentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }
  const orderId = String(formData.get("orderId") ?? "");
  const decision = String(formData.get("decision") ?? "") as "approved" | "rejected";
  if (!orderId || (decision !== "approved" && decision !== "rejected")) {
    redirect("/admin?error=invalid-review");
  }
  try {
    await reviewPayment({ orderId, reviewerUserId: user.id, decision });
    logInfo("Payment reviewed", { orderId, decision, reviewerUserId: user.id }, user.id);
  } catch (error) {
    logError(error, { action: "approvePayment", orderId, decision }, user.id);
    redirect("/admin?error=review-failed");
  }
  redirect("/admin?reviewed=1");
}

export async function updateProgressAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const courseId = cleanText(formData.get("courseId"));
  const lessonId = cleanText(formData.get("lessonId"));
  const watchPositionSeconds = parseNonNegativeNumber(formData.get("watchPositionSeconds"));
  const completed = formData.get("completed") === "true";
  const returnTo = String(formData.get("returnTo") ?? "/dashboard");
  if (!courseId || !isValidCourseId(courseId) || !lessonId || !isValidCourseId(lessonId) || watchPositionSeconds === null || !returnTo.startsWith("/")) {
    redirect("/dashboard?error=invalid-progress");
  }
  await upsertProgress({
    userId: user.id,
    courseId,
    lessonId,
    completed,
    watchPositionSeconds
  });
  redirect(returnTo);
}

export async function saveNoteAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const lessonId = cleanText(formData.get("lessonId"));
  const content = cleanText(formData.get("content"));
  const returnTo = String(formData.get("returnTo") ?? "/dashboard");
  if (!lessonId || content.length < 2 || content.length > 2000 || !returnTo.startsWith("/")) {
    redirect("/dashboard?error=invalid-note");
  }
  await createNote({
    userId: user.id,
    lessonId,
    content
  });
  redirect(returnTo);
}

export async function updateNoteAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const noteId = cleanText(formData.get("noteId"));
  const content = cleanText(formData.get("content"));
  const returnTo = String(formData.get("returnTo") ?? "/dashboard");
  if (!noteId || content.length < 2 || content.length > 2000 || !returnTo.startsWith("/")) {
    redirect("/dashboard?error=invalid-note");
  }

  await updateNote({
    userId: user.id,
    noteId,
    content
  });
  redirect(returnTo);
}

export async function deleteNoteAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const noteId = cleanText(formData.get("noteId"));
  const returnTo = String(formData.get("returnTo") ?? "/dashboard");
  if (!noteId || !returnTo.startsWith("/")) {
    redirect("/dashboard?error=invalid-note");
  }

  await deleteNote({
    userId: user.id,
    noteId
  });
  redirect(returnTo);
}

export async function createCourseAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }
  const title = cleanText(formData.get("title"));
  const slug = normalizeSlug(String(formData.get("slug") ?? ""));
  const excerpt = cleanText(formData.get("excerpt"));
  const description = cleanText(formData.get("description"));
  const priceInr = parsePositiveNumber(formData.get("priceInr"));
  const categoryId = cleanText(formData.get("categoryId"));
  const level = cleanOptionalText(formData.get("level"));
  const durationHours = parseNonNegativeNumber(formData.get("durationHours"));
  const tagsRaw = cleanOptionalText(formData.get("tags"));
  const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(t => t.length > 0) : undefined;
  const pdfLink = cleanOptionalText(formData.get("pdfLink"));

  if (!title || title.length > 120 || !slug || !isValidSlug(slug) || !excerpt || excerpt.length > 280 || !description || description.length > 4000 || !categoryId || priceInr === null) {
    redirect("/admin?error=invalid-course");
  }

  if (!isValidGoogleDriveUrl(pdfLink ?? "")) {
    redirect("/admin?error=invalid-pdf-link");
  }

  try {
    await createCourse({
      title,
      slug,
      excerpt,
      description,
      priceInr,
      categoryId,
      level,
      durationHours: durationHours ?? undefined,
      tags,
      pdfLink
    });
  } catch (error) {
    logError(error, { action: "createCourse", title, slug }, user.id);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("slug")) {
      redirect("/admin?error=duplicate-slug");
    }
    redirect("/admin?error=course-create");
  }

  redirect("/admin?courseCreated=1");
}

export async function updateCourseAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  const courseId = cleanText(formData.get("courseId"));
  const title = cleanText(formData.get("title"));
  const slug = normalizeSlug(String(formData.get("slug") ?? ""));
  const excerpt = cleanText(formData.get("excerpt"));
  const description = cleanText(formData.get("description"));
  const priceInr = parsePositiveNumber(formData.get("priceInr"));
  const categoryId = cleanText(formData.get("categoryId"));
  const level = cleanOptionalText(formData.get("level"));
  const durationHours = parseNonNegativeNumber(formData.get("durationHours"));
  const tagsRaw = cleanOptionalText(formData.get("tags"));
  const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(t => t.length > 0) : undefined;
  const coverImage = cleanOptionalText(formData.get("coverImage"));
  const pdfLink = cleanOptionalText(formData.get("pdfLink"));

  if (!courseId || !title || title.length > 120 || !slug || !isValidSlug(slug) || !excerpt || excerpt.length > 280 || !description || description.length > 4000 || !categoryId || priceInr === null) {
    redirect("/admin?error=invalid-course-edit");
  }

  if (!isValidGoogleDriveUrl(pdfLink ?? "")) {
    redirect("/admin?error=invalid-pdf-link");
  }

  try {
    await updateCourse({
      courseId,
      title,
      slug,
      excerpt,
      description,
      priceInr,
      categoryId,
      level,
      durationHours: durationHours ?? undefined,
      tags,
      coverImage,
      pdfLink
    });
  } catch (error) {
    logError(error, { action: "updateCourse", courseId, title, slug }, user.id);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("slug")) {
      redirect("/admin?error=duplicate-slug");
    }
    redirect("/admin?error=course-update");
  }

  redirect("/admin?courseUpdated=1");
}

export async function setCourseStatusAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  const courseId = cleanText(formData.get("courseId"));
  const status = cleanText(formData.get("status"));
  if (!courseId || (status !== "draft" && status !== "published")) {
    redirect("/admin?error=invalid-course-status");
  }

  let publishedCourse: Awaited<ReturnType<typeof setCourseStatus>> | undefined;
  try {
    publishedCourse = await setCourseStatus({ courseId, status });
  } catch {
    redirect("/admin?error=course-status");
  }

  // Fire automation when course is published (non-blocking)
  if (status === "published" && publishedCourse) {
    try {
      const learners = await listAllLearners();
      const learnerEmails = learners.map((l: any) => l.email).filter(Boolean) as string[];
      onCoursePublished({
        courseId: publishedCourse.id,
        courseTitle: publishedCourse.title,
        courseSlug: publishedCourse.slug,
        courseExcerpt: publishedCourse.excerpt,
        priceInr: publishedCourse.priceInr,
        level: publishedCourse.level,
        durationHours: publishedCourse.durationHours,
        publishedByEmail: user!.email,
        learnerEmails,
      }).catch((err) => logError(err, { action: "onCoursePublished", courseId }));
    } catch (err) {
      logError(err, { action: "onCoursePublished.setup", courseId });
    }
  }

  redirect(`/admin?courseStatus=${status}`);
}

export async function deleteCourseAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  const courseId = cleanText(formData.get("courseId"));
  if (!courseId) {
    redirect("/admin?error=invalid-course-delete");
  }

  try {
    await deleteCourse({ courseId, userId: user.id });
  } catch (error) {
    logError(error, { action: "deleteCourse", courseId }, user.id);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("enrollments")) {
      redirect("/admin?error=course-has-enrollments");
    }
    if (message.includes("not found")) {
      redirect("/admin?error=course-not-found");
    }
    redirect("/admin?error=course-delete");
  }

  redirect("/admin?courseDeleted=1");
}

export async function createModuleAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  const courseId = cleanText(formData.get("courseId"));
  const title = cleanText(formData.get("title"));
  const description = cleanText(formData.get("description"));
  if (!courseId || !title || title.length > 120 || !description || description.length > 600) {
    redirect("/admin?error=invalid-module");
  }

  try {
    await createModule({ courseId, title, description });
  } catch {
    redirect("/admin?error=module-create");
  }

  redirect("/admin?moduleCreated=1");
}

export async function createLessonAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  const moduleId = cleanText(formData.get("moduleId"));
  const slug = normalizeSlug(String(formData.get("slug") ?? ""));
  const title = cleanText(formData.get("title"));
  const type = cleanText(formData.get("type")) as "video" | "article" | "quiz" | "resource";
  const durationMinutes = parsePositiveNumber(formData.get("durationMinutes"));
  const body = cleanText(formData.get("body"));
  const isPreview = formData.get("isPreview") === "true";
  const videoKey = cleanOptionalText(formData.get("videoKey"));
  if (!moduleId || !slug || !isValidSlug(slug) || !title || title.length > 120 || !["video", "article", "quiz", "resource"].includes(type) || durationMinutes === null || !body || body.length > 6000) {
    redirect("/admin?error=invalid-lesson");
  }

  try {
    await createLesson({
      moduleId,
      slug,
      title,
      type,
      durationMinutes,
      isPreview,
      body,
      videoKey
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("slug")) {
      redirect("/admin?error=duplicate-lesson-slug");
    }
    redirect("/admin?error=lesson-create");
  }

  redirect("/admin?lessonCreated=1");
}

export async function updateModuleAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  const moduleId = cleanText(formData.get("moduleId"));
  const title = cleanText(formData.get("title"));
  const description = cleanText(formData.get("description"));
  if (!moduleId || !title || title.length > 120 || !description || description.length > 600) {
    redirect("/admin?error=invalid-module-edit");
  }

  try {
    await updateModule({ moduleId, title, description });
  } catch {
    redirect("/admin?error=module-update");
  }

  redirect("/admin?moduleUpdated=1");
}

export async function updateLessonAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  const lessonId = cleanText(formData.get("lessonId"));
  const slug = normalizeSlug(String(formData.get("slug") ?? ""));
  const title = cleanText(formData.get("title"));
  const type = cleanText(formData.get("type")) as "video" | "article" | "quiz" | "resource";
  const durationMinutes = parsePositiveNumber(formData.get("durationMinutes"));
  const body = cleanText(formData.get("body"));
  const isPreview = formData.get("isPreview") === "true";
  const videoKey = cleanOptionalText(formData.get("videoKey"));
  if (!lessonId || !slug || !isValidSlug(slug) || !title || title.length > 120 || !["video", "article", "quiz", "resource"].includes(type) || durationMinutes === null || !body || body.length > 6000) {
    redirect("/admin?error=invalid-lesson-edit");
  }

  try {
    await updateLesson({
      lessonId,
      slug,
      title,
      type,
      durationMinutes,
      isPreview,
      body,
      videoKey
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("slug")) {
      redirect("/admin?error=duplicate-lesson-slug");
    }
    redirect("/admin?error=lesson-update");
  }

  redirect("/admin?lessonUpdated=1");
}

export async function moveModuleAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  const moduleId = cleanText(formData.get("moduleId"));
  const direction = cleanText(formData.get("direction"));
  if (!moduleId || (direction !== "up" && direction !== "down")) {
    redirect("/admin?error=invalid-module-order");
  }

  try {
    await moveModule({ moduleId, direction });
  } catch {
    redirect("/admin?error=module-order");
  }

  redirect("/admin?moduleReordered=1");
}

export async function moveLessonAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  const lessonId = cleanText(formData.get("lessonId"));
  const direction = cleanText(formData.get("direction"));
  if (!lessonId || (direction !== "up" && direction !== "down")) {
    redirect("/admin?error=invalid-lesson-order");
  }

  try {
    await moveLesson({ lessonId, direction });
  } catch {
    redirect("/admin?error=lesson-order");
  }

  redirect("/admin?lessonReordered=1");
}

export async function createLessonAssetAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  const lessonId = cleanText(formData.get("lessonId"));
  const label = cleanText(formData.get("label"));
  const kind = cleanText(formData.get("kind")) as "attachment" | "slide" | "project";
  const fileKey = cleanText(formData.get("fileKey"));
  if (!lessonId || !label || label.length > 120 || !["attachment", "slide", "project"].includes(kind) || !fileKey || fileKey.length > 400) {
    redirect("/admin?error=invalid-asset");
  }

  try {
    await createLessonAsset({ lessonId, label, kind, fileKey });
  } catch {
    redirect("/admin?error=asset-create");
  }

  redirect("/admin?assetCreated=1");
}

export async function deleteLessonAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  const lessonId = cleanText(formData.get("lessonId"));
  if (!lessonId) {
    redirect("/admin?error=invalid-lesson-delete");
  }

  try {
    await deleteLesson({ lessonId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("learner activity")) {
      redirect("/admin?error=lesson-has-activity");
    }
    redirect("/admin?error=lesson-delete");
  }

  redirect("/admin?lessonDeleted=1");
}

export async function deleteModuleAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  const moduleId = cleanText(formData.get("moduleId"));
  if (!moduleId) {
    redirect("/admin?error=invalid-module-delete");
  }

  try {
    await deleteModule({ moduleId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Delete the lessons")) {
      redirect("/admin?error=module-has-lessons");
    }
    redirect("/admin?error=module-delete");
  }

  redirect("/admin?moduleDeleted=1");
}

export async function askTutorAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const courseSlug = normalizeSlug(String(formData.get("courseSlug") ?? ""));
  const lessonSlug = normalizeSlug(String(formData.get("lessonSlug") ?? ""));
  const question = cleanText(formData.get("question"));
  if (!isValidSlug(courseSlug) || !isValidSlug(lessonSlug) || question.length < 4 || question.length > 1000) {
    redirect(`/learn/${courseSlug}/${lessonSlug}?ai=invalid`);
  }

  const recentUsage = await getAiTutorUsage(user.id, 60);
  if (recentUsage >= 8) {
    redirect(`/learn/${courseSlug}/${lessonSlug}?ai=rate-limited`);
  }

  const lessonView = await getLearnerLessonView(user.id, courseSlug, lessonSlug);
  if (!lessonView || lessonView.blocked) {
    redirect(`/learn/${courseSlug}/${lessonSlug}?ai=blocked`);
  }

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
