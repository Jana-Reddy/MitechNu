import { boolean, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "learner"]);
export const courseStatusEnum = pgEnum("course_status", ["draft", "published"]);
export const lessonTypeEnum = pgEnum("lesson_type", ["video", "article", "quiz", "resource"]);
export const paymentStatusEnum = pgEnum("payment_status", ["awaiting_payment", "proof_submitted", "approved", "rejected"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "approved", "rejected"]);

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
