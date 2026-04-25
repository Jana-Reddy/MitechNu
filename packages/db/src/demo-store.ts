import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { calculateCourseProgress, calculateDiscountedPrice, getFeaturedCourses } from "./domain";
import { hashPassword, verifyPassword } from "./auth-utils";
import { seedData } from "./seed";
import type { AiChatMessage, Certificate, Course, DemoStore, NoteRecord, Order, PaymentSettings, PaymentStatus, User, UserRole } from "./types";

const storePath = join(process.cwd(), "runtime", "demo-store.json");

async function ensureStoreFile() {
  await mkdir(dirname(storePath), { recursive: true });
  try {
    await readFile(storePath, "utf8");
  } catch {
    await writeFile(storePath, JSON.stringify(seedData, null, 2), "utf8");
  }
}

async function readStore(): Promise<DemoStore> {
  await ensureStoreFile();
  const store = JSON.parse(await readFile(storePath, "utf8")) as DemoStore;
  return {
    ...store,
    paymentSettings: store.paymentSettings ?? []
  };
}

async function writeStore(store: DemoStore) {
  await ensureStoreFile();
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

function summarizeCourse(course: Course, store: DemoStore) {
  const category = store.categories.find((item) => item.id === course.categoryId);
  const moduleIds = store.modules.filter((module) => module.courseId === course.id).map((module) => module.id);
  const lessonCount = store.lessons.filter((lesson) => moduleIds.includes(lesson.moduleId)).length;
  return { ...course, category, lessonCount };
}

export async function getCatalog() {
  const store = await readStore();
  return store.courses.filter((course) => course.status === "published").map((course) => summarizeCourse(course, store));
}

export async function getFeaturedCatalog() {
  const store = await readStore();
  return getFeaturedCourses(store.courses).map((course) => summarizeCourse(course, store));
}

export async function getCourseBySlug(slug: string) {
  const store = await readStore();
  const course = store.courses.find((item) => item.slug === slug);
  if (!course) {
    return null;
  }

  const modules = store.modules
    .filter((module) => module.courseId === course.id)
    .sort((a, b) => a.order - b.order)
    .map((module) => ({
      ...module,
      lessons: store.lessons.filter((lesson) => lesson.moduleId === module.id).sort((a, b) => a.order - b.order)
    }));

  return { ...summarizeCourse(course, store), modules };
}

export async function authenticateUser(email: string, password: string) {
  const store = await readStore();
  const user = store.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return null;
  }
  return verifyPassword(password, user.passwordHash) ? user : null;
}

export async function getUserByEmail(email: string) {
  const store = await readStore();
  return store.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function getUserById(userId: string) {
  const store = await readStore();
  return store.users.find((user) => user.id === userId) ?? null;
}

export async function createUser(input: { name: string; email: string; password: string; role?: UserRole }) {
  const store = await readStore();
  const exists = store.users.find((user) => user.email.toLowerCase() === input.email.toLowerCase());
  if (exists) {
    throw new Error("An account with this email already exists.");
  }

  const user: User = {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    passwordHash: hashPassword(input.password),
    role: input.role ?? "learner",
    createdAt: new Date().toISOString()
  };

  store.users.push(user);
  await writeStore(store);
  return user;
}

export async function upsertOAuthUser(input: {
  email: string;
  name: string;
  avatarUrl?: string;
  role?: UserRole;
}) {
  const store = await readStore();
  const existing = store.users.find((user) => user.email.toLowerCase() === input.email.toLowerCase());
  if (existing) {
    existing.name = input.name || existing.name;
    existing.avatarUrl = input.avatarUrl ?? existing.avatarUrl;
    await writeStore(store);
    return existing;
  }

  const user: User = {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    passwordHash: hashPassword(randomUUID()),
    role: input.role ?? "learner",
    avatarUrl: input.avatarUrl,
    createdAt: new Date().toISOString()
  };

  store.users.push(user);
  await writeStore(store);
  return user;
}

export async function hasEnrollment(userId: string, courseId: string) {
  const store = await readStore();
  return store.enrollments.some((item) => item.userId === userId && item.courseId === courseId);
}

export async function getDashboardData(userId: string) {
  const store = await readStore();
  const userProgress = store.progress.filter((item) => item.userId === userId);
  const activeCourses = store.enrollments
    .filter((enrollment) => enrollment.userId === userId)
    .map((enrollment) => store.courses.find((course) => course.id === enrollment.courseId))
    .filter(Boolean)
    .map((course) => {
      const lessonsForCourse = store.lessons.filter((lesson) =>
        store.modules.some((module) => module.courseId === course!.id && module.id === lesson.moduleId)
      );
      const progressForCourse = userProgress.filter((item) => item.courseId === course!.id);
      const firstIncomplete = lessonsForCourse.find((lesson) => !progressForCourse.find((item) => item.lessonId === lesson.id && item.completed));
      const mostRecent = [...progressForCourse].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
      const resumeLesson = firstIncomplete ?? lessonsForCourse.find((lesson) => lesson.id === mostRecent?.lessonId) ?? lessonsForCourse[0];
      const certificate = store.certificates.find((item) => item.userId === userId && item.courseId === course!.id);

      return {
        ...summarizeCourse(course!, store),
        progress: calculateCourseProgress(store.modules, store.lessons, userProgress, course!.id),
        completedLessons: progressForCourse.filter((item) => item.completed).length,
        resumeLessonSlug: resumeLesson?.slug,
        resumeLessonTitle: resumeLesson?.title,
        certificateNumber: certificate?.certificateNumber
      };
    });

  return {
    activeCourses,
    pendingOrders: store.orders.filter((order) => order.userId === userId && order.status === "pending").length,
    notes: store.notes.filter((note) => note.userId === userId).slice(-5)
  };
}

export async function getLearnerLessonView(userId: string, courseSlug: string, lessonSlug: string) {
  const store = await readStore();
  const course = store.courses.find((item) => item.slug === courseSlug);
  if (!course) {
    return null;
  }

  const moduleIds = store.modules.filter((module) => module.courseId === course.id).map((module) => module.id);
  const lesson = store.lessons.find((item) => item.slug === lessonSlug && moduleIds.includes(item.moduleId));
  if (!lesson) {
    return null;
  }

  const enrolled = await hasEnrollment(userId, course.id);
  if (!enrolled && !lesson.isPreview) {
    return { course, lesson, blocked: true as const };
  }

  const orderedLessons = store.lessons.filter((item) => moduleIds.includes(item.moduleId)).sort((a, b) => a.order - b.order);

  return {
    course,
    lesson,
    lessons: orderedLessons,
    progress: store.progress.find((item) => item.userId === userId && item.lessonId === lesson.id),
    notes: store.notes.filter((item) => item.userId === userId && item.lessonId === lesson.id),
    assets: store.assets.filter((item) => item.lessonId === lesson.id),
    aiMessages: store.aiMessages
      .filter((item) => item.userId === userId && item.lessonId === lesson.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    progressPercent: calculateCourseProgress(store.modules, store.lessons, store.progress.filter((item) => item.userId === userId), course.id),
    completedLessons: store.progress.filter((item) => item.userId === userId && item.courseId === course.id && item.completed).length,
    totalLessons: orderedLessons.length,
    previousLessonSlug: [...orderedLessons].reverse().find((item) => item.order < lesson.order)?.slug,
    nextLessonSlug: orderedLessons.find((item) => item.order > lesson.order)?.slug,
    certificate: store.certificates.find((item) => item.userId === userId && item.courseId === course.id),
    blocked: false as const
  };
}

export async function getLessonContext(courseSlug: string, lessonSlug: string) {
  const store = await readStore();
  const course = store.courses.find((item) => item.slug === courseSlug);
  if (!course) {
    return null;
  }
  const moduleIds = store.modules.filter((module) => module.courseId === course.id).map((module) => module.id);
  const lesson = store.lessons.find((item) => item.slug === lessonSlug && moduleIds.includes(item.moduleId));
  if (!lesson) {
    return null;
  }
  return { course, lesson };
}

export async function createOrder(input: { userId: string; courseSlug: string; couponCode?: string }) {
  const store = await readStore();
  const course = store.courses.find((item) => item.slug === input.courseSlug);
  if (!course) {
    throw new Error("Course not found.");
  }
  const coupon = input.couponCode
    ? store.coupons.find((item) => item.active && item.code.toLowerCase() === input.couponCode?.toLowerCase())
    : undefined;

  const order: Order = {
    id: randomUUID(),
    userId: input.userId,
    courseId: course.id,
    amountInr: calculateDiscountedPrice(course.priceInr, coupon?.percentageOff ?? 0),
    couponCode: coupon?.code,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  store.orders.push(order);
  await writeStore(store);
  return order;
}

export async function submitPaymentProof(input: { orderId: string; reference: string; notes?: string; screenshotUrl?: string }) {
  const store = await readStore();
  const existing = store.payments.find((item) => item.orderId === input.orderId);
  if (existing) {
    existing.reference = input.reference;
    existing.notes = input.notes;
    existing.screenshotUrl = input.screenshotUrl;
    existing.status = "proof_submitted";
  } else {
    store.payments.push({
      id: randomUUID(),
      orderId: input.orderId,
      reference: input.reference,
      notes: input.notes,
      screenshotUrl: input.screenshotUrl,
      status: "proof_submitted"
    });
  }
  await writeStore(store);
}

export async function reviewPayment(input: { orderId: string; reviewerUserId: string; decision: Extract<PaymentStatus, "approved" | "rejected"> }) {
  const store = await readStore();
  const payment = store.payments.find((item) => item.orderId === input.orderId);
  const order = store.orders.find((item) => item.id === input.orderId);
  if (!payment || !order) {
    throw new Error("Order or payment not found.");
  }

  payment.status = input.decision;
  payment.reviewedBy = input.reviewerUserId;
  payment.reviewedAt = new Date().toISOString();
  order.status = input.decision === "approved" ? "approved" : "rejected";

  if (input.decision === "approved" && !store.enrollments.some((item) => item.userId === order.userId && item.courseId === order.courseId)) {
    store.enrollments.push({
      id: randomUUID(),
      userId: order.userId,
      courseId: order.courseId,
      createdAt: new Date().toISOString()
    });
  }

  await writeStore(store);
}

export async function upsertProgress(input: { userId: string; courseId: string; lessonId: string; completed: boolean; watchPositionSeconds: number }) {
  const store = await readStore();
  const existing = store.progress.find((item) => item.userId === input.userId && item.lessonId === input.lessonId);
  if (existing) {
    existing.completed = input.completed;
    existing.watchPositionSeconds = input.watchPositionSeconds;
    existing.updatedAt = new Date().toISOString();
  } else {
    store.progress.push({
      id: randomUUID(),
      userId: input.userId,
      courseId: input.courseId,
      lessonId: input.lessonId,
      completed: input.completed,
      watchPositionSeconds: input.watchPositionSeconds,
      updatedAt: new Date().toISOString()
    });
  }

  const progress = calculateCourseProgress(store.modules, store.lessons, store.progress.filter((item) => item.userId === input.userId), input.courseId);
  if (progress === 100 && !store.certificates.some((item) => item.userId === input.userId && item.courseId === input.courseId)) {
    const certificate: Certificate = {
      id: randomUUID(),
      userId: input.userId,
      courseId: input.courseId,
      issuedAt: new Date().toISOString(),
      certificateNumber: `CERT-${Date.now()}`
    };
    store.certificates.push(certificate);
  }
  await writeStore(store);
}

export async function createNote(input: { userId: string; lessonId: string; content: string }) {
  const store = await readStore();
  const note: NoteRecord = {
    id: randomUUID(),
    userId: input.userId,
    lessonId: input.lessonId,
    content: input.content,
    createdAt: new Date().toISOString()
  };
  store.notes.push(note);
  await writeStore(store);
  return note;
}

export async function updateNote(input: { userId: string; noteId: string; content: string }) {
  const store = await readStore();
  const note = store.notes.find((item) => item.id === input.noteId && item.userId === input.userId);
  if (!note) {
    throw new Error("Note not found.");
  }

  note.content = input.content;
  await writeStore(store);
  return note;
}

export async function deleteNote(input: { userId: string; noteId: string }) {
  const store = await readStore();
  const index = store.notes.findIndex((item) => item.id === input.noteId && item.userId === input.userId);
  if (index === -1) {
    throw new Error("Note not found.");
  }

  store.notes.splice(index, 1);
  await writeStore(store);
}

export async function appendAiMessage(message: AiChatMessage) {
  const store = await readStore();
  store.aiMessages.push(message);
  await writeStore(store);
}

export async function getAiTutorUsage(userId: string, windowMinutes = 60) {
  const store = await readStore();
  const cutoff = Date.now() - windowMinutes * 60 * 1000;
  return store.aiMessages.filter((message) => message.userId === userId && message.role === "user" && new Date(message.createdAt).getTime() >= cutoff).length;
}

export async function getAdminOverview() {
  const store = await readStore();
  const activeCourses = store.courses.filter((course) => !course.deletedAt);
  return {
    stats: {
      learners: store.users.filter((user) => user.role === "learner").length,
      courses: activeCourses.length,
      pendingPayments: store.payments.filter((payment) => payment.status === "proof_submitted").length,
      revenueInr: store.orders.filter((order) => order.status === "approved").reduce((sum, order) => sum + order.amountInr, 0)
    },
    courses: activeCourses,
    orders: store.orders.map((order) => ({
      ...order,
      user: store.users.find((user) => user.id === order.userId),
      course: store.courses.find((course) => course.id === order.courseId),
      payment: store.payments.find((payment) => payment.orderId === order.id)
    })),
    coupons: store.coupons
  };
}

export async function getPaymentSettings() {
  const store = await readStore();
  return store.paymentSettings[0] ?? null;
}

export async function upsertPaymentSettings(input: {
  upiId?: string;
  payeeName?: string;
  qrCodeUrl?: string;
  note?: string;
}) {
  const store = await readStore();
  const settings: PaymentSettings = {
    id: store.paymentSettings[0]?.id ?? "default",
    upiId: input.upiId,
    payeeName: input.payeeName,
    qrCodeUrl: input.qrCodeUrl,
    note: input.note,
    updatedAt: new Date().toISOString()
  };

  store.paymentSettings = [settings];
  await writeStore(store);
  return settings;
}

export async function createCourse(input: { title: string; slug: string; excerpt: string; description: string; priceInr: number; categoryId: string; level?: string; durationHours?: number; tags?: string[]; pdfLink?: string }) {
  const store = await readStore();
  const course: Course = {
    id: randomUUID(),
    categoryId: input.categoryId,
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    description: input.description,
    coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    level: (input.level || "beginner") as "beginner" | "intermediate" | "advanced",
    priceInr: input.priceInr,
    durationHours: input.durationHours || 12,
    status: "draft",
    outcomes: ["Course outcomes to be refined"],
    prerequisites: ["No prerequisites yet"],
    tags: input.tags || ["new"],
    featured: false,
    pdfLink: input.pdfLink,
    createdAt: new Date().toISOString()
  };
  store.courses.push(course);
  await writeStore(store);
  return course;
}

export async function updateCourse(input: {
  courseId: string;
  title: string;
  slug: string;
  excerpt: string;
  description: string;
  priceInr: number;
  categoryId: string;
  level?: string;
  durationHours?: number;
  tags?: string[];
  pdfLink?: string;
}) {
  const store = await readStore();
  const courseIndex = store.courses.findIndex((c) => c.id === input.courseId);
  if (courseIndex === -1) {
    throw new Error("Course not found.");
  }

  const course = store.courses[courseIndex];
  const updated: Course = {
    ...course,
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    description: input.description,
    priceInr: input.priceInr,
    categoryId: input.categoryId,
    level: (input.level ?? course.level) as "beginner" | "intermediate" | "advanced",
    durationHours: input.durationHours ?? course.durationHours,
    tags: input.tags ?? course.tags,
    pdfLink: input.pdfLink
  };

  store.courses[courseIndex] = updated;
  await writeStore(store);
  return updated;
}

export async function deleteCourse(input: { courseId: string; userId?: string }) {
  const store = await readStore();
  const courseIndex = store.courses.findIndex((c) => c.id === input.courseId);
  if (courseIndex === -1) {
    throw new Error("Course not found.");
  }

  const course = store.courses[courseIndex];

  // Allow deleting unpublished courses even with enrollments
  // Only block deletion if course is published and has enrollments
  if (course.status === "published") {
    const hasEnrollments = store.enrollments.some((e) => e.courseId === input.courseId);
    if (hasEnrollments) {
      throw new Error("Cannot delete published course with active enrollments.");
    }
  }

  // Soft delete: set deletedAt timestamp instead of removing
  store.courses[courseIndex].deletedAt = new Date().toISOString();

  // Log audit entry
  if (input.userId) {
    store.auditLogs.push({
      id: randomUUID(),
      userId: input.userId,
      action: "course_deleted",
      entityType: "course",
      entityId: input.courseId,
      details: `Deleted course: ${course.title}`,
      createdAt: new Date().toISOString()
    });
  }

  await writeStore(store);
}

export async function listCategories() {
  const store = await readStore();
  return store.categories;
}

export async function listUserCertificates(userId: string) {
  const store = await readStore();
  return store.certificates
    .filter((item) => item.userId === userId)
    .map((certificate) => ({ ...certificate, course: store.courses.find((course) => course.id === certificate.courseId) }));
}

export async function listOrdersForUser(userId: string) {
  const store = await readStore();
  return store.orders
    .filter((order) => order.userId === userId)
    .map((order) => ({
      ...order,
      course: store.courses.find((course) => course.id === order.courseId),
      payment: store.payments.find((payment) => payment.orderId === order.id)
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
