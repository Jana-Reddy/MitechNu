import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "./client";
import {
  aiMessages,
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
  payments,
  progressRecords,
  users
} from "./schema";
import type {
  AiChatMessage,
  Category,
  Certificate,
  Course,
  Lesson,
  LessonAsset,
  Module,
  NoteRecord,
  Payment,
  PaymentStatus,
  ProgressRecord,
  User,
  UserRole
} from "./types";
import { calculateCourseProgress, calculateDiscountedPrice, getFeaturedCourses } from "./domain";
import { hashPassword, verifyPassword } from "./auth-utils";
import * as demoStore from "./demo-store";

type CourseSummary = Course & { category?: Category; lessonCount: number };
type CourseWithModules = CourseSummary & { modules: Array<Module & { lessons: Lesson[] }> };

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
    if (!allowDemoFallback) {
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

  return moduleRows.map((module) => ({
    ...mapModule(module),
    lessons: lessonRows.filter((lesson) => lesson.moduleId === module.id).map(mapLesson)
  }));
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
  }, () => demoStore.getCourseBySlug(slug));
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
    const [enrollmentRows, progressRows, noteRows, orderRows, courseRows, moduleRows, lessonRows] = await Promise.all([
      db.select().from(enrollments).where(eq(enrollments.userId, userId)),
      db.select().from(progressRecords).where(eq(progressRecords.userId, userId)),
      db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.createdAt)),
      db.select().from(orders).where(and(eq(orders.userId, userId), eq(orders.status, "pending"))),
      db.select().from(courses),
      db.select().from(modules),
      db.select().from(lessons)
    ]);

    const activeCourseIds = enrollmentRows.map((enrollment) => enrollment.courseId);
    const activeCourses = courseRows
      .filter((course) => activeCourseIds.includes(course.id))
      .map((course) => ({
        ...mapCourse(course),
        lessonCount: lessonRows.filter((lesson) => moduleRows.some((module) => module.courseId === course.id && module.id === lesson.moduleId)).length,
        progress: calculateCourseProgress(moduleRows.map(mapModule), lessonRows.map(mapLesson), progressRows.map(mapProgress), course.id)
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

    const [allLessons, progressRow, noteRows, assetRows] = await Promise.all([
      moduleIds.length
        ? db.select().from(lessons).where(inArray(lessons.moduleId, moduleIds)).orderBy(asc(lessons.order))
        : Promise.resolve([]),
      db.query.progressRecords.findFirst({
        where: and(eq(progressRecords.userId, userId), eq(progressRecords.lessonId, lessonRow.id))
      }),
      db.select().from(notes).where(and(eq(notes.userId, userId), eq(notes.lessonId, lessonRow.id))).orderBy(desc(notes.createdAt)),
      db.select().from(lessonAssets).where(eq(lessonAssets.lessonId, lessonRow.id))
    ]);

    return {
      course: mapCourse(course),
      lesson: mapLesson(lessonRow),
      lessons: allLessons.map(mapLesson),
      progress: progressRow ? mapProgress(progressRow) : undefined,
      notes: noteRows.map(mapNote),
      assets: assetRows.map(mapAsset),
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

export async function submitPaymentProof(input: { orderId: string; reference: string; notes?: string }) {
  return withFallback(async () => {
    const existing = await db.query.payments.findFirst({
      where: eq(payments.orderId, input.orderId)
    });

    if (existing) {
      await db
        .update(payments)
        .set({
          reference: input.reference,
          notes: input.notes,
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

    if (!payment || !order) {
      throw new Error("Order or payment not found.");
    }

    await db
      .update(payments)
      .set({
        status: input.decision,
        reviewedBy: input.reviewerUserId,
        reviewedAt: new Date()
      })
      .where(eq(payments.id, payment.id));

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

export async function appendAiMessage(message: AiChatMessage) {
  return withFallback(async () => {
    await db.insert(aiMessages).values({
      ...message,
      createdAt: new Date(message.createdAt)
    });
  }, () => demoStore.appendAiMessage(message));
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
    const mappedCourses = courseRows.map(mapCourse);

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

export async function createCourse(input: { title: string; slug: string; excerpt: string; description: string; priceInr: number; categoryId: string }) {
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
      level: "beginner",
      priceInr: input.priceInr,
      durationHours: 12,
      status: "draft",
      outcomes: ["Course outcomes to be refined"],
      prerequisites: ["No prerequisites yet"],
      tags: ["new"],
      featured: false,
      createdAt: new Date()
    };

    await db.insert(courses).values(course);
    return mapCourse(course as typeof courses.$inferSelect);
  }, () => demoStore.createCourse(input));
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
