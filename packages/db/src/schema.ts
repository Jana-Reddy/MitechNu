import { boolean, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "learner"]);
export const courseStatusEnum = pgEnum("course_status", ["draft", "published"]);
export const lessonTypeEnum = pgEnum("lesson_type", ["video", "article", "quiz", "resource"]);
export const assetKindEnum = pgEnum("asset_kind", ["attachment", "slide", "project"]);
export const paymentStatusEnum = pgEnum("payment_status", ["awaiting_payment", "proof_submitted", "approved", "rejected"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "approved", "rejected"]);
export const aiMessageRoleEnum = pgEnum("ai_message_role", ["user", "assistant"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull()
});

export const courses = pgTable("courses", {
  id: text("id").primaryKey(),
  categoryId: text("category_id").notNull().references(() => categories.id),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  description: text("description").notNull(),
  coverImage: text("cover_image").notNull(),
  level: text("level").notNull(),
  priceInr: integer("price_inr").notNull(),
  durationHours: integer("duration_hours").notNull(),
  status: courseStatusEnum("status").notNull(),
  outcomes: text("outcomes").array().notNull(),
  prerequisites: text("prerequisites").array().notNull(),
  tags: text("tags").array().notNull(),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

export const modules = pgTable("modules", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => courses.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  order: integer("order").notNull()
});

export const lessons = pgTable("lessons", {
  id: text("id").primaryKey(),
  moduleId: text("module_id").notNull().references(() => modules.id),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  type: lessonTypeEnum("type").notNull(),
  order: integer("order").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  isPreview: boolean("is_preview").notNull().default(false),
  videoKey: text("video_key"),
  body: text("body").notNull()
});

export const lessonAssets = pgTable("lesson_assets", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").notNull().references(() => lessons.id),
  label: text("label").notNull(),
  kind: assetKindEnum("kind").notNull(),
  fileKey: text("file_key").notNull()
});

export const enrollments = pgTable("enrollments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  courseId: text("course_id").notNull().references(() => courses.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

export const progressRecords = pgTable("progress_records", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  courseId: text("course_id").notNull().references(() => courses.id),
  lessonId: text("lesson_id").notNull().references(() => lessons.id),
  completed: boolean("completed").notNull().default(false),
  watchPositionSeconds: integer("watch_position_seconds").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull()
});

export const notes = pgTable("notes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  lessonId: text("lesson_id").notNull().references(() => lessons.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

export const coupons = pgTable("coupons", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  percentageOff: integer("percentage_off").notNull(),
  active: boolean("active").notNull().default(true)
});

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  courseId: text("course_id").notNull().references(() => courses.id),
  amountInr: integer("amount_inr").notNull(),
  couponCode: text("coupon_code"),
  status: orderStatusEnum("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id),
  reference: text("reference").notNull(),
  screenshotUrl: text("screenshot_url"),
  notes: text("notes"),
  status: paymentStatusEnum("status").notNull(),
  reviewedBy: text("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true })
});

export const paymentSettings = pgTable("payment_settings", {
  id: text("id").primaryKey(),
  upiId: text("upi_id"),
  payeeName: text("payee_name"),
  qrCodeUrl: text("qr_code_url"),
  note: text("note"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull()
});

export const certificates = pgTable("certificates", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  courseId: text("course_id").notNull().references(() => courses.id),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
  certificateNumber: text("certificate_number").notNull().unique()
});

export const aiMessages = pgTable("ai_messages", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  courseId: text("course_id").notNull().references(() => courses.id),
  lessonId: text("lesson_id").notNull().references(() => lessons.id),
  role: aiMessageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  actorUserId: text("actor_user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull()
});
