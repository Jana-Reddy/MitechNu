import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "./client";
import {
  aiMessages,
  auditLogs,
  categories,
  certificates,
  coupons,
  courses,
  enrollments,
  lessonAssets,
  lessons,
  modules,
  notes,
  orders,
  paymentSettings,
  payments,
  progressRecords,
  users
} from "./schema";
import type {
  AiChatMessage,
  AuditAction,
  AuditLog,
  Category,
  Certificate,
  Course,
  Lesson,
  LessonAsset,
  Module,
  NoteRecord,
  Payment,
  PaymentSettings,
  PaymentStatus,
  ProgressRecord,
  User,
  UserRole
} from "./types";
import { calculateCourseProgress, calculateDiscountedPrice, getFeaturedCourses } from "./domain";
import { hashPassword, verifyPassword } from "./auth-utils";
import * as demoStore from "./demo-store";

type CourseSummary = Course & { category?: Category; lessonCount: number };
type CourseLessonWithAssets = Lesson & { assets: LessonAsset[] };
type CourseWithModules = CourseSummary & { modules: Array<Module & { lessons: CourseLessonWithAssets[] }> };

function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return undefined;
  }
  return value instanceof Date ? value.toISOString() : value;
}

function mapUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    bio: row.bio ?? undefined,
    avatarUrl: row.avatarUrl ?? undefined,
    createdAt: toIsoString(row.createdAt) ?? new Date(0).toISOString()
  };
}

function mapCourse(row: typeof courses.$inferSelect): Course {
  return {
    ...row,
    level: row.level as Course["level"],
    pdfLink: row.pdfLink ?? undefined,
    deletedAt: row.deletedAt ? toIsoString(row.deletedAt) : undefined,
    createdAt: toIsoString(row.createdAt) ?? new Date(0).toISOString()
  };
}

function mapModule(row: typeof modules.$inferSelect): Module {
  return row;
}

function mapLesson(row: typeof lessons.$inferSelect): Lesson {
  return {
    ...row,
    videoKey: row.videoKey ?? undefined
  };
}

function mapAsset(row: typeof lessonAssets.$inferSelect): LessonAsset {
  return row;
}

function mapProgress(row: typeof progressRecords.$inferSelect): ProgressRecord {
  return {
    ...row,
    updatedAt: toIsoString(row.updatedAt) ?? new Date(0).toISOString()
  };
}

function mapNote(row: typeof notes.$inferSelect): NoteRecord {
  return {
    ...row,
    createdAt: toIsoString(row.createdAt) ?? new Date(0).toISOString()
  };
}

function mapCertificate(row: typeof certificates.$inferSelect): Certificate {
  return {
    ...row,
    issuedAt: toIsoString(row.issuedAt) ?? new Date(0).toISOString()
  };
}

function mapPayment(row: typeof payments.$inferSelect): Payment {
  return {
    id: row.id,
    orderId: row.orderId,
    reference: row.reference,
    screenshotUrl: row.screenshotUrl ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status,
    reviewedBy: row.reviewedBy ?? undefined,
    reviewedAt: toIsoString(row.reviewedAt) ?? undefined
  };
}

function mapPaymentSettings(row: typeof paymentSettings.$inferSelect): PaymentSettings {
  return {
    id: row.id,
    upiId: row.upiId ?? undefined,
    payeeName: row.payeeName ?? undefined,
    qrCodeUrl: row.qrCodeUrl ?? undefined,
    note: row.note ?? undefined,
    updatedAt: toIsoString(row.updatedAt) ?? new Date(0).toISOString()
  };
}

function mapOrderRow(row: typeof orders.$inferSelect) {
  return {
    ...row,
    couponCode: row.couponCode ?? undefined,
    createdAt: toIsoString(row.createdAt) ?? new Date(0).toISOString()
  };
}

async function withFallback<T>(operation: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const allowDemoFallback = process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1";
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const looksLikeConnectionFailure =
      message.includes("connect") ||
      message.includes("connection") ||
      message.includes("websocket") ||
      message.includes("fetch failed") ||
      message.includes("econnrefused") ||
      message.includes("enotfound") ||
      message.includes("timeout") ||
      message.includes("network") ||
      message.includes("server has closed the connection");

    if (!allowDemoFallback || !looksLikeConnectionFailure) {
      throw error;
    }
    return fallback();
  }
}

async function listPublishedCourses() {
  const rows = await db.select().from(courses).where(eq(courses.status, "published"));
  return rows.map(mapCourse);
}

async function buildCourseSummaries(inputCourses: Course[]): Promise<CourseSummary[]> {
  if (!inputCourses.length) {
    return [];
  }

  const categoryIds = [...new Set(inputCourses.map((course) => course.categoryId))];
  const courseIds = inputCourses.map((course) => course.id);
  const moduleRows = await db.select().from(modules).where(inArray(modules.courseId, courseIds));
  const moduleIds = moduleRows.map((module) => module.id);
  const lessonRows = moduleIds.length
    ? await db.select().from(lessons).where(inArray(lessons.moduleId, moduleIds))
    : [];
  const categoryRows = categoryIds.length
    ? await db.select().from(categories).where(inArray(categories.id, categoryIds))
    : [];

  const categoryMap = new Map(categoryRows.map((category) => [category.id, category]));
  const lessonCountByCourseId = new Map<string, number>();

  for (const module of moduleRows) {
    const count = lessonRows.filter((lesson) => lesson.moduleId === module.id).length;
    lessonCountByCourseId.set(module.courseId, (lessonCountByCourseId.get(module.courseId) ?? 0) + count);
  }

  return inputCourses.map((course) => ({
    ...course,
    category: categoryMap.get(course.categoryId),
    lessonCount: lessonCountByCourseId.get(course.id) ?? 0
  }));
}

async function getCourseStructure(courseId: string) {
  const moduleRows = await db.select().from(modules).where(eq(modules.courseId, courseId)).orderBy(asc(modules.order));
  const moduleIds = moduleRows.map((module) => module.id);
  const lessonRows = moduleIds.length
    ? await db.select().from(lessons).where(inArray(lessons.moduleId, moduleIds)).orderBy(asc(lessons.order))
    : [];
  const lessonIds = lessonRows.map((lesson) => lesson.id);
  const assetRows = lessonIds.length
    ? await db.select().from(lessonAssets).where(inArray(lessonAssets.lessonId, lessonIds))
    : [];

  return moduleRows.map((module) => ({
    ...mapModule(module),
    lessons: lessonRows
      .filter((lesson) => lesson.moduleId === module.id)
      .map((lesson) => ({
        ...mapLesson(lesson),
        assets: assetRows.filter((asset) => asset.lessonId === lesson.id).map(mapAsset)
      }))
  }));
}

async function getLessonWithCourse(lessonId: string) {
  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId)
  });
  if (!lesson) {
    return null;
  }

  const module = await db.query.modules.findFirst({
    where: eq(modules.id, lesson.moduleId)
  });
  if (!module) {
    return null;
  }

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, module.courseId)
  });
  if (!course) {
    return null;
  }

  return { lesson, module, course };
}

function getResumeLesson(lessonsForCourse: Lesson[], progressForCourse: ProgressRecord[]) {
  const progressByLessonId = new Map(progressForCourse.map((record) => [record.lessonId, record]));
  const firstIncomplete = lessonsForCourse.find((lesson) => !progressByLessonId.get(lesson.id)?.completed);
  const mostRecent = [...progressForCourse].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  return firstIncomplete ?? lessonsForCourse.find((lesson) => lesson.id === mostRecent?.lessonId) ?? lessonsForCourse[0];
}

export async function getCatalog() {
  return withFallback(async () => {
    const publishedCourses = await listPublishedCourses();
    return buildCourseSummaries(publishedCourses);
  }, demoStore.getCatalog);
}

export async function getFeaturedCatalog() {
  return withFallback(async () => {
    const featured = getFeaturedCourses(await listPublishedCourses());
    return buildCourseSummaries(featured);
  }, demoStore.getFeaturedCatalog);
}

export async function getCourseBySlug(slug: string): Promise<CourseWithModules | null> {
  return withFallback(async () => {
    const courseRow = await db.query.courses.findFirst({
      where: eq(courses.slug, slug)
    });

    if (!courseRow) {
      return null;
    }

    const [categoryRow, modulesWithLessons] = await Promise.all([
      db.query.categories.findFirst({ where: eq(categories.id, courseRow.categoryId) }),
      getCourseStructure(courseRow.id)
    ]);

    return {
      ...mapCourse(courseRow),
      category: categoryRow ?? undefined,
      lessonCount: modulesWithLessons.reduce((sum, module) => sum + module.lessons.length, 0),
      modules: modulesWithLessons
    };
  }, async () => {
    const course = await demoStore.getCourseBySlug(slug);
    if (!course) {
      return null;
    }

    return {
      ...course,
      modules: course.modules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) => ({
          ...lesson,
          assets: []
        }))
      }))
    };
  });
}

export async function authenticateUser(email: string, password: string) {
  return withFallback(async () => {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase())
    });

    if (!user) {
      return null;
    }

    return verifyPassword(password, user.passwordHash) ? mapUser(user) : null;
  }, () => demoStore.authenticateUser(email, password));
}

export async function getUserByEmail(email: string) {
  return withFallback(async () => {
    const loweredEmail = email.toLowerCase();
    const user = await db.query.users.findFirst({
      where: eq(users.email, loweredEmail)
    });
    return user ? mapUser(user) : null;
  }, () => demoStore.getUserByEmail(email));
}

export async function getUserById(userId: string) {
  return withFallback(async () => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    return user ? mapUser(user) : null;
  }, () => demoStore.getUserById(userId));
}

export async function listAllLearners() {
  return withFallback(async () => {
    const rows = await db.select().from(users).where(eq(users.role, "learner"));
    return rows.map((u) => ({ id: u.id, email: u.email, name: u.name }));
  }, () => demoStore.listAllLearners());
}

export async function createUser(input: { name: string; email: string; password: string; role?: UserRole }) {
  return withFallback(async () => {
    const email = input.email.toLowerCase();
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    const user: typeof users.$inferInsert = {
      id: randomUUID(),
      name: input.name,
      email,
      passwordHash: hashPassword(input.password),
      role: input.role ?? "learner",
      createdAt: new Date()
    };

    await db.insert(users).values(user);
    return mapUser(user as typeof users.$inferSelect);
  }, () => demoStore.createUser(input));
}

export async function upsertOAuthUser(input: {
  email: string;
  name: string;
  avatarUrl?: string;
  role?: UserRole;
}) {
  return withFallback(async () => {
    const email = input.email.toLowerCase();
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (existing) {
      await db
        .update(users)
        .set({
          name: input.name || existing.name,
          avatarUrl: input.avatarUrl ?? existing.avatarUrl
        })
        .where(eq(users.id, existing.id));

      return {
        ...mapUser(existing),
        name: input.name || existing.name,
        avatarUrl: input.avatarUrl ?? existing.avatarUrl
      };
    }

    const user: typeof users.$inferInsert = {
      id: randomUUID(),
      name: input.name,
      email,
      passwordHash: hashPassword(randomUUID()),
      role: input.role ?? "learner",
      avatarUrl: input.avatarUrl,
      createdAt: new Date()
    };

    await db.insert(users).values(user);
    return mapUser(user as typeof users.$inferSelect);
  }, () => demoStore.upsertOAuthUser(input));
}

export async function hasEnrollment(userId: string, courseId: string) {
  return withFallback(async () => {
    const enrollment = await db.query.enrollments.findFirst({
      where: and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))
    });
    return Boolean(enrollment);
  }, () => demoStore.hasEnrollment(userId, courseId));
}

export async function getDashboardData(userId: string) {
  return withFallback(async () => {
    const [enrollmentRows, progressRows, noteRows, orderRows, courseRows, moduleRows, lessonRows, certificateRows] = await Promise.all([
      db.select().from(enrollments).where(eq(enrollments.userId, userId)),
      db.select().from(progressRecords).where(eq(progressRecords.userId, userId)),
      db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.createdAt)),
      db.select().from(orders).where(and(eq(orders.userId, userId), eq(orders.status, "pending"))),
      db.select().from(courses),
      db.select().from(modules),
      db.select().from(lessons),
      db.select().from(certificates).where(eq(certificates.userId, userId))
    ]);

    const activeCourseIds = enrollmentRows.map((enrollment) => enrollment.courseId);
    const activeCourses = courseRows
      .filter((course) => activeCourseIds.includes(course.id))
      .map((course) => ({
        ...mapCourse(course),
        ...(() => {
          const lessonsForCourse = lessonRows
            .filter((lesson) => moduleRows.some((module) => module.courseId === course.id && module.id === lesson.moduleId))
            .map(mapLesson);
          const progressForCourse = progressRows
            .filter((record) => record.courseId === course.id)
            .map(mapProgress);
          const progress = calculateCourseProgress(moduleRows.map(mapModule), lessonRows.map(mapLesson), progressRows.map(mapProgress), course.id);
          const completedLessons = progressForCourse.filter((record) => record.completed).length;
          const resumeLesson = lessonsForCourse.length ? getResumeLesson(lessonsForCourse, progressForCourse) : undefined;
          const certificate = certificateRows.find((item) => item.courseId === course.id);

          return {
            lessonCount: lessonsForCourse.length,
            completedLessons,
            progress,
            resumeLessonSlug: resumeLesson?.slug,
            resumeLessonTitle: resumeLesson?.title,
            certificateNumber: certificate?.certificateNumber
          };
        })()
      }));

    return {
      activeCourses,
      pendingOrders: orderRows.length,
      notes: noteRows.slice(0, 5).map(mapNote)
    };
  }, () => demoStore.getDashboardData(userId));
}

export async function getLearnerLessonView(userId: string, courseSlug: string, lessonSlug: string) {
  return withFallback(async () => {
    const course = await db.query.courses.findFirst({
      where: eq(courses.slug, courseSlug)
    });

    if (!course) {
      return null;
    }

    const moduleRows = await db.select().from(modules).where(eq(modules.courseId, course.id));
    const moduleIds = moduleRows.map((module) => module.id);
    const lessonRow = moduleIds.length
      ? await db.query.lessons.findFirst({
          where: and(eq(lessons.slug, lessonSlug), inArray(lessons.moduleId, moduleIds))
        })
      : null;

    if (!lessonRow) {
      return null;
    }

    const enrolled = await hasEnrollment(userId, course.id);
    if (!enrolled && !lessonRow.isPreview) {
      return {
        course: mapCourse(course),
        lesson: mapLesson(lessonRow),
        blocked: true as const
      };
    }

    const [allLessons, progressRow, noteRows, assetRows, allProgressRows, certificateRow, aiRows] = await Promise.all([
      moduleIds.length
        ? db.select().from(lessons).where(inArray(lessons.moduleId, moduleIds)).orderBy(asc(lessons.order))
        : Promise.resolve([]),
      db.query.progressRecords.findFirst({
        where: and(eq(progressRecords.userId, userId), eq(progressRecords.lessonId, lessonRow.id))
      }),
      db.select().from(notes).where(and(eq(notes.userId, userId), eq(notes.lessonId, lessonRow.id))).orderBy(desc(notes.createdAt)),
      db.select().from(lessonAssets).where(eq(lessonAssets.lessonId, lessonRow.id)),
      db.select().from(progressRecords).where(and(eq(progressRecords.userId, userId), eq(progressRecords.courseId, course.id))),
      db.query.certificates.findFirst({
        where: and(eq(certificates.userId, userId), eq(certificates.courseId, course.id))
      }),
      db
        .select()
        .from(aiMessages)
        .where(and(eq(aiMessages.userId, userId), eq(aiMessages.lessonId, lessonRow.id)))
        .orderBy(asc(aiMessages.createdAt))
    ]);

    const mappedLessons = allLessons.map(mapLesson);
    const mappedProgressRows = allProgressRows.map(mapProgress);
    const currentLessonIndex = mappedLessons.findIndex((lesson) => lesson.id === lessonRow.id);
    const completedLessons = mappedProgressRows.filter((record) => record.completed).length;
    const courseProgress = calculateCourseProgress(moduleRows.map(mapModule), mappedLessons, mappedProgressRows, course.id);

    return {
      course: mapCourse(course),
      lesson: mapLesson(lessonRow),
      lessons: mappedLessons,
      progress: progressRow ? mapProgress(progressRow) : undefined,
      notes: noteRows.map(mapNote),
      assets: assetRows.map(mapAsset),
      aiMessages: aiRows.map((row) => ({
        ...row,
        createdAt: toIsoString(row.createdAt) ?? new Date(0).toISOString()
      })),
      progressPercent: courseProgress,
      completedLessons,
      totalLessons: mappedLessons.length,
      previousLessonSlug: currentLessonIndex > 0 ? mappedLessons[currentLessonIndex - 1]?.slug : undefined,
      nextLessonSlug: currentLessonIndex >= 0 ? mappedLessons[currentLessonIndex + 1]?.slug : undefined,
      certificate: certificateRow ? mapCertificate(certificateRow) : undefined,
      blocked: false as const
    };
  }, () => demoStore.getLearnerLessonView(userId, courseSlug, lessonSlug));
}

export async function getLessonContext(courseSlug: string, lessonSlug: string) {
  return withFallback(async () => {
    const course = await db.query.courses.findFirst({
      where: eq(courses.slug, courseSlug)
    });

    if (!course) {
      return null;
    }

    const moduleRows = await db.select().from(modules).where(eq(modules.courseId, course.id));
    const moduleIds = moduleRows.map((module) => module.id);
    if (!moduleIds.length) {
      return null;
    }

    const lesson = await db.query.lessons.findFirst({
      where: and(eq(lessons.slug, lessonSlug), inArray(lessons.moduleId, moduleIds))
    });

    if (!lesson) {
      return null;
    }

    return { course: mapCourse(course), lesson: mapLesson(lesson) };
  }, () => demoStore.getLessonContext(courseSlug, lessonSlug));
}

export async function createOrder(input: { userId: string; courseSlug: string; couponCode?: string }) {
  return withFallback(async () => {
    const course = await db.query.courses.findFirst({
      where: eq(courses.slug, input.courseSlug)
    });

    if (!course) {
      throw new Error("Course not found.");
    }
    if (course.status !== "published") {
      throw new Error("Only published courses can be ordered.");
    }

    const existingEnrollment = await db.query.enrollments.findFirst({
      where: and(eq(enrollments.userId, input.userId), eq(enrollments.courseId, course.id))
    });
    if (existingEnrollment) {
      throw new Error("You are already enrolled in this course.");
    }

    const existingOrder = await db.query.orders.findFirst({
      where: and(
        eq(orders.userId, input.userId),
        eq(orders.courseId, course.id),
        inArray(orders.status, ["pending", "approved"])
      )
    });
    if (existingOrder) {
      throw new Error("An active order already exists for this course.");
    }

    const coupon = input.couponCode
      ? await db.query.coupons.findFirst({
          where: and(eq(coupons.active, true), eq(coupons.code, input.couponCode.toUpperCase()))
        })
      : undefined;

    const order: typeof orders.$inferInsert = {
      id: randomUUID(),
      userId: input.userId,
      courseId: course.id,
      amountInr: calculateDiscountedPrice(course.priceInr, coupon?.percentageOff ?? 0),
      couponCode: coupon?.code,
      status: "pending",
      createdAt: new Date()
    };

    await db.insert(orders).values(order);
    return {
      ...order,
      createdAt: toIsoString(order.createdAt) ?? new Date(0).toISOString()
    };
  }, () => demoStore.createOrder(input));
}

export async function submitPaymentProof(input: { orderId: string; reference: string; notes?: string; screenshotUrl?: string }) {
  return withFallback(async () => {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, input.orderId)
    });
    if (!order) {
      throw new Error("Order not found.");
    }

    const existing = await db.query.payments.findFirst({
      where: eq(payments.orderId, input.orderId)
    });

    if (existing) {
      await db
        .update(payments)
        .set({
          reference: input.reference,
          notes: input.notes,
          screenshotUrl: input.screenshotUrl,
          status: "proof_submitted"
        })
        .where(eq(payments.id, existing.id));
      return;
    }

    await db.insert(payments).values({
      id: randomUUID(),
      orderId: input.orderId,
      reference: input.reference,
      notes: input.notes,
      screenshotUrl: input.screenshotUrl,
      status: "proof_submitted"
    });
  }, () => demoStore.submitPaymentProof(input));
}

export async function reviewPayment(input: { orderId: string; reviewerUserId: string; decision: Extract<PaymentStatus, "approved" | "rejected"> }) {
  return withFallback(async () => {
    const [payment, order] = await Promise.all([
      db.query.payments.findFirst({ where: eq(payments.orderId, input.orderId) }),
      db.query.orders.findFirst({ where: eq(orders.id, input.orderId) })
    ]);

    if (!order) {
      throw new Error("Order not found.");
    }

    if (!payment && input.decision === "approved") {
      throw new Error("Cannot approve: no payment proof submitted yet.");
    }

    if (payment) {
      await db
        .update(payments)
        .set({
          status: input.decision,
          reviewedBy: input.reviewerUserId,
          reviewedAt: new Date()
        })
        .where(eq(payments.id, payment.id));
    }

    await db
      .update(orders)
      .set({
        status: input.decision === "approved" ? "approved" : "rejected"
      })
      .where(eq(orders.id, order.id));

    if (input.decision === "approved") {
      const existingEnrollment = await db.query.enrollments.findFirst({
        where: and(eq(enrollments.userId, order.userId), eq(enrollments.courseId, order.courseId))
      });

      if (!existingEnrollment) {
        await db.insert(enrollments).values({
          id: randomUUID(),
          userId: order.userId,
          courseId: order.courseId,
          createdAt: new Date()
        });
      }
    }
  }, () => demoStore.reviewPayment(input));
}

export async function upsertProgress(input: { userId: string; courseId: string; lessonId: string; completed: boolean; watchPositionSeconds: number }) {
  return withFallback(async () => {
    const lessonContext = await getLessonWithCourse(input.lessonId);
    if (!lessonContext || lessonContext.course.id !== input.courseId) {
      throw new Error("Lesson not found for this course.");
    }

    const enrolled = await hasEnrollment(input.userId, input.courseId);
    if (!enrolled && !lessonContext.lesson.isPreview) {
      throw new Error("Enrollment is required to track progress for this lesson.");
    }

    const existing = await db.query.progressRecords.findFirst({
      where: and(eq(progressRecords.userId, input.userId), eq(progressRecords.lessonId, input.lessonId))
    });

    if (existing) {
      await db
        .update(progressRecords)
        .set({
          completed: input.completed,
          watchPositionSeconds: input.watchPositionSeconds,
          updatedAt: new Date()
        })
        .where(eq(progressRecords.id, existing.id));
    } else {
      await db.insert(progressRecords).values({
        id: randomUUID(),
        userId: input.userId,
        courseId: input.courseId,
        lessonId: input.lessonId,
        completed: input.completed,
        watchPositionSeconds: input.watchPositionSeconds,
        updatedAt: new Date()
      });
    }

    const [moduleRows, lessonRows, progressRows] = await Promise.all([
      db.select().from(modules).where(eq(modules.courseId, input.courseId)),
      db.select().from(lessons),
      db.select().from(progressRecords).where(eq(progressRecords.userId, input.userId))
    ]);

    const progress = calculateCourseProgress(moduleRows.map(mapModule), lessonRows.map(mapLesson), progressRows.map(mapProgress), input.courseId);

    if (progress === 100) {
      const existingCertificate = await db.query.certificates.findFirst({
        where: and(eq(certificates.userId, input.userId), eq(certificates.courseId, input.courseId))
      });

      if (!existingCertificate) {
        await db.insert(certificates).values({
          id: randomUUID(),
          userId: input.userId,
          courseId: input.courseId,
          issuedAt: new Date(),
          certificateNumber: `CERT-${Date.now()}`
        });
      }
    }
  }, () => demoStore.upsertProgress(input));
}

export async function createNote(input: { userId: string; lessonId: string; content: string }) {
  return withFallback(async () => {
    const lessonContext = await getLessonWithCourse(input.lessonId);
    if (!lessonContext) {
      throw new Error("Lesson not found.");
    }

    const enrolled = await hasEnrollment(input.userId, lessonContext.course.id);
    if (!enrolled && !lessonContext.lesson.isPreview) {
      throw new Error("Enrollment is required to save notes for this lesson.");
    }

    const note: typeof notes.$inferInsert = {
      id: randomUUID(),
      userId: input.userId,
      lessonId: input.lessonId,
      content: input.content,
      createdAt: new Date()
    };

    await db.insert(notes).values(note);
    return {
      ...note,
      createdAt: toIsoString(note.createdAt) ?? new Date(0).toISOString()
    };
  }, () => demoStore.createNote(input));
}

export async function updateNote(input: { userId: string; noteId: string; content: string }) {
  return withFallback(async () => {
    const existing = await db.query.notes.findFirst({
      where: and(eq(notes.id, input.noteId), eq(notes.userId, input.userId))
    });
    if (!existing) {
      throw new Error("Note not found.");
    }

    await db
      .update(notes)
      .set({
        content: input.content
      })
      .where(eq(notes.id, input.noteId));

    const updated = await db.query.notes.findFirst({
      where: eq(notes.id, input.noteId)
    });
    if (!updated) {
      throw new Error("Note update failed.");
    }

    return mapNote(updated);
  }, () => demoStore.updateNote(input));
}

export async function deleteNote(input: { userId: string; noteId: string }) {
  return withFallback(async () => {
    const existing = await db.query.notes.findFirst({
      where: and(eq(notes.id, input.noteId), eq(notes.userId, input.userId))
    });
    if (!existing) {
      throw new Error("Note not found.");
    }

    await db.delete(notes).where(eq(notes.id, input.noteId));
  }, () => demoStore.deleteNote(input));
}

export async function appendAiMessage(message: AiChatMessage) {
  return withFallback(async () => {
    const lessonContext = await getLessonWithCourse(message.lessonId);
    if (!lessonContext || lessonContext.course.id !== message.courseId) {
      throw new Error("Invalid lesson context.");
    }

    await db.insert(aiMessages).values({
      ...message,
      createdAt: new Date(message.createdAt)
    });
  }, () => demoStore.appendAiMessage(message));
}

export async function getAiTutorUsage(userId: string, windowMinutes = 60) {
  return withFallback(async () => {
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);
    const recentMessages = await db
      .select()
      .from(aiMessages)
      .where(and(eq(aiMessages.userId, userId), eq(aiMessages.role, "user")));

    return recentMessages.filter((message) => new Date(toIsoString(message.createdAt) ?? 0).getTime() >= cutoff.getTime()).length;
  }, () => demoStore.getAiTutorUsage(userId, windowMinutes));
}

export async function getAdminOverview() {
  return withFallback<Awaited<ReturnType<typeof demoStore.getAdminOverview>>>(async () => {
    const [userRows, courseRows, orderRows, paymentRows, couponRows] = await Promise.all([
      db.select().from(users),
      db.select().from(courses),
      db.select().from(orders).orderBy(desc(orders.createdAt)),
      db.select().from(payments),
      db.select().from(coupons)
    ]);

    const mappedUsers = userRows.map(mapUser);
    const mappedCourses = courseRows.map(mapCourse).filter((course) => !course.deletedAt);

    return {
      stats: {
        learners: mappedUsers.filter((user) => user.role === "learner").length,
        courses: mappedCourses.length,
        pendingPayments: paymentRows.filter((payment) => payment.status === "proof_submitted").length,
        revenueInr: orderRows.filter((order) => order.status === "approved").reduce((sum, order) => sum + order.amountInr, 0)
      },
      courses: mappedCourses,
      orders: orderRows.map((order) => ({
        ...mapOrderRow(order),
        user: mappedUsers.find((user) => user.id === order.userId),
        course: mappedCourses.find((course) => course.id === order.courseId),
        payment: paymentRows.find((payment) => payment.orderId === order.id)
          ? mapPayment(paymentRows.find((payment) => payment.orderId === order.id)!)
          : undefined
      })),
      coupons: couponRows
    };
  }, demoStore.getAdminOverview);
}

export async function getPaymentSettings() {
  return withFallback(async () => {
    try {
      const settingsRow = await db.query.paymentSettings.findFirst();
      return settingsRow ? mapPaymentSettings(settingsRow) : null;
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      if (message.includes("payment_settings") && (message.includes("does not exist") || message.includes("relation"))) {
        return null;
      }
      throw error;
    }
  }, () => demoStore.getPaymentSettings());
}

export async function upsertPaymentSettings(input: {
  upiId?: string;
  payeeName?: string;
  qrCodeUrl?: string;
  note?: string;
}) {
  return withFallback(async () => {
    const existing = await db.query.paymentSettings.findFirst();
    const values = {
      upiId: input.upiId ?? null,
      payeeName: input.payeeName ?? null,
      qrCodeUrl: input.qrCodeUrl ?? null,
      note: input.note ?? null,
      updatedAt: new Date()
    };

    if (existing) {
      await db.update(paymentSettings).set(values).where(eq(paymentSettings.id, existing.id));
    } else {
      await db.insert(paymentSettings).values({
        id: "default",
        ...values
      });
    }

    const updated = await db.query.paymentSettings.findFirst({
      where: eq(paymentSettings.id, existing?.id ?? "default")
    });
    if (!updated) {
      throw new Error("Payment settings update failed.");
    }

    return mapPaymentSettings(updated);
  }, () => demoStore.upsertPaymentSettings(input));
}

export async function createCourse(input: { title: string; slug: string; excerpt: string; description: string; priceInr: number; categoryId: string; level?: string; durationHours?: number; tags?: string[]; pdfLink?: string }) {
  return withFallback(async () => {
    const existing = await db.query.courses.findFirst({
      where: eq(courses.slug, input.slug)
    });
    if (existing) {
      throw new Error("A course with this slug already exists.");
    }

    const category = await db.query.categories.findFirst({
      where: eq(categories.id, input.categoryId)
    });
    if (!category) {
      throw new Error("Category not found.");
    }

    const course: typeof courses.$inferInsert = {
      id: randomUUID(),
      categoryId: input.categoryId,
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      description: input.description,
      coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
      level: input.level || "beginner",
      priceInr: input.priceInr,
      durationHours: input.durationHours || 12,
      status: "draft",
      outcomes: ["Course outcomes to be refined"],
      prerequisites: ["No prerequisites yet"],
      tags: input.tags || ["new"],
      pdfLink: input.pdfLink,
      featured: false,
      createdAt: new Date()
    };

    await db.insert(courses).values(course);
    return mapCourse(course as typeof courses.$inferSelect);
  }, () => demoStore.createCourse(input));
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
  coverImage?: string;
  pdfLink?: string;
}) {
  return withFallback(async () => {
    const existingCourse = await db.query.courses.findFirst({
      where: eq(courses.id, input.courseId)
    });
    if (!existingCourse) {
      throw new Error("Course not found.");
    }

    const slugConflict = await db.query.courses.findFirst({
      where: eq(courses.slug, input.slug)
    });
    if (slugConflict && slugConflict.id !== input.courseId) {
      throw new Error("A course with this slug already exists.");
    }

    const category = await db.query.categories.findFirst({
      where: eq(categories.id, input.categoryId)
    });
    if (!category) {
      throw new Error("Category not found.");
    }

    await db
      .update(courses)
      .set({
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt,
        description: input.description,
        priceInr: input.priceInr,
        categoryId: input.categoryId,
        ...(input.level && { level: input.level }),
        ...(input.durationHours && { durationHours: input.durationHours }),
        ...(input.tags && { tags: input.tags }),
        ...(input.coverImage !== undefined && { coverImage: input.coverImage }),
        ...(input.pdfLink !== undefined && { pdfLink: input.pdfLink })
      })
      .where(eq(courses.id, input.courseId));

    const updatedCourse = await db.query.courses.findFirst({
      where: eq(courses.id, input.courseId)
    });
    if (!updatedCourse) {
      throw new Error("Course update failed.");
    }

    return mapCourse(updatedCourse);
  }, () => demoStore.updateCourse(input));
}

export async function setCourseStatus(input: { courseId: string; status: "draft" | "published" }) {
  return withFallback(async () => {
    const existingCourse = await db.query.courses.findFirst({
      where: eq(courses.id, input.courseId)
    });
    if (!existingCourse) {
      throw new Error("Course not found.");
    }

    await db
      .update(courses)
      .set({
        status: input.status
      })
      .where(eq(courses.id, input.courseId));

    const updatedCourse = await db.query.courses.findFirst({
      where: eq(courses.id, input.courseId)
    });
    if (!updatedCourse) {
      throw new Error("Course status update failed.");
    }

    return mapCourse(updatedCourse);
  }, () => demoStore.setCourseStatus(input));
}

export async function deleteCourse(input: { courseId: string; userId?: string }) {
  return withFallback(async () => {
    const existingCourse = await db.query.courses.findFirst({
      where: eq(courses.id, input.courseId)
    });
    if (!existingCourse) {
      throw new Error("Course not found.");
    }

    // Allow deleting unpublished courses even with enrollments
    // Only block deletion if course is published and has enrollments
    if (existingCourse.status === "published") {
      const courseEnrollments = await db.query.enrollments.findMany({
        where: eq(enrollments.courseId, input.courseId)
      });
      if (courseEnrollments.length > 0) {
        throw new Error("Cannot delete published course with active enrollments.");
      }
    }

    // Soft delete: set deletedAt timestamp instead of hard delete
    await db
      .update(courses)
      .set({ deletedAt: new Date() })
      .where(eq(courses.id, input.courseId));

    // Log audit entry
    if (input.userId) {
      await db.insert(auditLogs).values({
        id: randomUUID(),
        userId: input.userId,
        action: "course_deleted",
        entityType: "course",
        entityId: input.courseId,
        details: `Deleted course: ${existingCourse.title}`,
        createdAt: new Date()
      });
    }
  }, async () => demoStore.deleteCourse(input));
}

export async function createModule(input: { courseId: string; title: string; description: string }) {
  return withFallback(async () => {
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, input.courseId)
    });
    if (!course) {
      throw new Error("Course not found.");
    }

    const existingModules = await db.select().from(modules).where(eq(modules.courseId, input.courseId));
    const nextOrder = existingModules.reduce((max, module) => Math.max(max, module.order), 0) + 1;

    const moduleRecord: typeof modules.$inferInsert = {
      id: randomUUID(),
      courseId: input.courseId,
      title: input.title,
      description: input.description,
      order: nextOrder
    };

    await db.insert(modules).values(moduleRecord);
    return mapModule(moduleRecord as typeof modules.$inferSelect);
  }, async () => {
    throw new Error("Module creation requires the Postgres data layer.");
  });
}

export async function createLesson(input: {
  moduleId: string;
  slug: string;
  title: string;
  type: "video" | "article" | "quiz" | "resource";
  durationMinutes: number;
  isPreview: boolean;
  body: string;
  videoKey?: string;
}) {
  return withFallback(async () => {
    const module = await db.query.modules.findFirst({
      where: eq(modules.id, input.moduleId)
    });
    if (!module) {
      throw new Error("Module not found.");
    }

    const slugConflict = await db.query.lessons.findFirst({
      where: eq(lessons.slug, input.slug)
    });
    if (slugConflict) {
      throw new Error("A lesson with this slug already exists.");
    }

    const existingLessons = await db.select().from(lessons).where(eq(lessons.moduleId, input.moduleId));
    const nextOrder = existingLessons.reduce((max, lesson) => Math.max(max, lesson.order), 0) + 1;

    const lessonRecord: typeof lessons.$inferInsert = {
      id: randomUUID(),
      moduleId: input.moduleId,
      slug: input.slug,
      title: input.title,
      type: input.type,
      order: nextOrder,
      durationMinutes: input.durationMinutes,
      isPreview: input.isPreview,
      body: input.body,
      videoKey: input.videoKey
    };

    await db.insert(lessons).values(lessonRecord);
    return mapLesson(lessonRecord as typeof lessons.$inferSelect);
  }, async () => {
    throw new Error("Lesson creation requires the Postgres data layer.");
  });
}

export async function updateModule(input: { moduleId: string; title: string; description: string }) {
  return withFallback(async () => {
    const existingModule = await db.query.modules.findFirst({
      where: eq(modules.id, input.moduleId)
    });
    if (!existingModule) {
      throw new Error("Module not found.");
    }

    await db
      .update(modules)
      .set({
        title: input.title,
        description: input.description
      })
      .where(eq(modules.id, input.moduleId));

    const updated = await db.query.modules.findFirst({
      where: eq(modules.id, input.moduleId)
    });
    if (!updated) {
      throw new Error("Module update failed.");
    }

    return mapModule(updated);
  }, async () => {
    throw new Error("Module editing requires the Postgres data layer.");
  });
}

export async function updateLesson(input: {
  lessonId: string;
  slug: string;
  title: string;
  type: "video" | "article" | "quiz" | "resource";
  durationMinutes: number;
  isPreview: boolean;
  body: string;
  videoKey?: string;
}) {
  return withFallback(async () => {
    const existingLesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, input.lessonId)
    });
    if (!existingLesson) {
      throw new Error("Lesson not found.");
    }

    const slugConflict = await db.query.lessons.findFirst({
      where: eq(lessons.slug, input.slug)
    });
    if (slugConflict && slugConflict.id !== input.lessonId) {
      throw new Error("A lesson with this slug already exists.");
    }

    await db
      .update(lessons)
      .set({
        slug: input.slug,
        title: input.title,
        type: input.type,
        durationMinutes: input.durationMinutes,
        isPreview: input.isPreview,
        body: input.body,
        videoKey: input.videoKey
      })
      .where(eq(lessons.id, input.lessonId));

    const updated = await db.query.lessons.findFirst({
      where: eq(lessons.id, input.lessonId)
    });
    if (!updated) {
      throw new Error("Lesson update failed.");
    }

    return mapLesson(updated);
  }, async () => {
    throw new Error("Lesson editing requires the Postgres data layer.");
  });
}

export async function moveModule(input: { moduleId: string; direction: "up" | "down" }) {
  return withFallback(async () => {
    const module = await db.query.modules.findFirst({
      where: eq(modules.id, input.moduleId)
    });
    if (!module) {
      throw new Error("Module not found.");
    }

    const siblings = await db.select().from(modules).where(eq(modules.courseId, module.courseId)).orderBy(asc(modules.order));
    const currentIndex = siblings.findIndex((item) => item.id === input.moduleId);
    const swapIndex = input.direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex === -1 || swapIndex < 0 || swapIndex >= siblings.length) {
      return mapModule(module);
    }

    const swapTarget = siblings[swapIndex];
    await db.update(modules).set({ order: swapTarget.order }).where(eq(modules.id, module.id));
    await db.update(modules).set({ order: module.order }).where(eq(modules.id, swapTarget.id));

    const updated = await db.query.modules.findFirst({
      where: eq(modules.id, module.id)
    });
    return mapModule(updated ?? module);
  }, async () => {
    throw new Error("Module reordering requires the Postgres data layer.");
  });
}

export async function moveLesson(input: { lessonId: string; direction: "up" | "down" }) {
  return withFallback(async () => {
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, input.lessonId)
    });
    if (!lesson) {
      throw new Error("Lesson not found.");
    }

    const siblings = await db.select().from(lessons).where(eq(lessons.moduleId, lesson.moduleId)).orderBy(asc(lessons.order));
    const currentIndex = siblings.findIndex((item) => item.id === input.lessonId);
    const swapIndex = input.direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex === -1 || swapIndex < 0 || swapIndex >= siblings.length) {
      return mapLesson(lesson);
    }

    const swapTarget = siblings[swapIndex];
    await db.update(lessons).set({ order: swapTarget.order }).where(eq(lessons.id, lesson.id));
    await db.update(lessons).set({ order: lesson.order }).where(eq(lessons.id, swapTarget.id));

    const updated = await db.query.lessons.findFirst({
      where: eq(lessons.id, lesson.id)
    });
    return mapLesson(updated ?? lesson);
  }, async () => {
    throw new Error("Lesson reordering requires the Postgres data layer.");
  });
}

export async function createLessonAsset(input: {
  lessonId: string;
  label: string;
  kind: "attachment" | "slide" | "project";
  fileKey: string;
}) {
  return withFallback(async () => {
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, input.lessonId)
    });
    if (!lesson) {
      throw new Error("Lesson not found.");
    }

    const asset: typeof lessonAssets.$inferInsert = {
      id: randomUUID(),
      lessonId: input.lessonId,
      label: input.label,
      kind: input.kind,
      fileKey: input.fileKey
    };

    await db.insert(lessonAssets).values(asset);
    return mapAsset(asset as typeof lessonAssets.$inferSelect);
  }, async () => {
    throw new Error("Lesson assets require the Postgres data layer.");
  });
}

export async function deleteLesson(input: { lessonId: string }) {
  return withFallback(async () => {
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, input.lessonId)
    });
    if (!lesson) {
      throw new Error("Lesson not found.");
    }

    const [progressCount, noteCount, aiCount] = await Promise.all([
      db.select().from(progressRecords).where(eq(progressRecords.lessonId, input.lessonId)),
      db.select().from(notes).where(eq(notes.lessonId, input.lessonId)),
      db.select().from(aiMessages).where(eq(aiMessages.lessonId, input.lessonId))
    ]);

    if (progressCount.length || noteCount.length || aiCount.length) {
      throw new Error("This lesson already has learner activity and cannot be deleted.");
    }

    await db.delete(lessonAssets).where(eq(lessonAssets.lessonId, input.lessonId));
    await db.delete(lessons).where(eq(lessons.id, input.lessonId));

    const remainingLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.moduleId, lesson.moduleId))
      .orderBy(asc(lessons.order));

    for (let index = 0; index < remainingLessons.length; index += 1) {
      const expectedOrder = index + 1;
      if (remainingLessons[index]?.order !== expectedOrder) {
        await db.update(lessons).set({ order: expectedOrder }).where(eq(lessons.id, remainingLessons[index]!.id));
      }
    }
  }, async () => {
    throw new Error("Lesson deletion requires the Postgres data layer.");
  });
}

export async function deleteModule(input: { moduleId: string }) {
  return withFallback(async () => {
    const module = await db.query.modules.findFirst({
      where: eq(modules.id, input.moduleId)
    });
    if (!module) {
      throw new Error("Module not found.");
    }

    const childLessons = await db.select().from(lessons).where(eq(lessons.moduleId, input.moduleId));
    if (childLessons.length) {
      throw new Error("Delete the lessons in this module before deleting the module.");
    }

    await db.delete(modules).where(eq(modules.id, input.moduleId));

    const remainingModules = await db
      .select()
      .from(modules)
      .where(eq(modules.courseId, module.courseId))
      .orderBy(asc(modules.order));

    for (let index = 0; index < remainingModules.length; index += 1) {
      const expectedOrder = index + 1;
      if (remainingModules[index]?.order !== expectedOrder) {
        await db.update(modules).set({ order: expectedOrder }).where(eq(modules.id, remainingModules[index]!.id));
      }
    }
  }, async () => {
    throw new Error("Module deletion requires the Postgres data layer.");
  });
}

export async function listCategories() {
  return withFallback(async () => db.select().from(categories), demoStore.listCategories);
}

export async function listUserCertificates(userId: string) {
  return withFallback(async () => {
    const [certificateRows, courseRows] = await Promise.all([
      db.select().from(certificates).where(eq(certificates.userId, userId)),
      db.select().from(courses)
    ]);

    const mappedCourses = courseRows.map(mapCourse);
    return certificateRows.map((certificate) => ({
      ...mapCertificate(certificate),
      course: mappedCourses.find((course) => course.id === certificate.courseId)
    }));
  }, () => demoStore.listUserCertificates(userId));
}

export async function listOrdersForUser(userId: string) {
  return withFallback<Awaited<ReturnType<typeof demoStore.listOrdersForUser>>>(async () => {
    const [orderRows, courseRows, paymentRows] = await Promise.all([
      db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt)),
      db.select().from(courses),
      db.select().from(payments)
    ]);

    const mappedCourses = courseRows.map(mapCourse);
    return orderRows.map((order) => ({
      ...mapOrderRow(order),
      course: mappedCourses.find((course) => course.id === order.courseId),
      payment: paymentRows.find((payment) => payment.orderId === order.id)
        ? mapPayment(paymentRows.find((payment) => payment.orderId === order.id)!)
        : undefined
    }));
  }, () => demoStore.listOrdersForUser(userId));
}
