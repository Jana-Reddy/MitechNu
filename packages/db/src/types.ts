export type UserRole = "admin" | "learner";
export type CourseStatus = "draft" | "published";
export type LessonType = "video" | "article" | "quiz" | "resource";
export type PaymentStatus = "awaiting_payment" | "proof_submitted" | "approved" | "rejected";
export type OrderStatus = "pending" | "approved" | "rejected";
export type AuditAction = "course_created" | "course_updated" | "course_deleted" | "course_published" | "course_unpublished" | "user_created" | "payment_approved" | "payment_rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Course {
  id: string;
  categoryId: string;
  title: string;
  slug: string;
  excerpt: string;
  description: string;
  coverImage: string;
  level: "beginner" | "intermediate" | "advanced";
  priceInr: number;
  durationHours: number;
  status: CourseStatus;
  outcomes: string[];
  prerequisites: string[];
  tags: string[];
  featured: boolean;
  pdfLink?: string;
  deletedAt?: string;
  createdAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  slug: string;
  title: string;
  type: LessonType;
  order: number;
  durationMinutes: number;
  isPreview: boolean;
  videoKey?: string;
  body: string;
}

export interface LessonAsset {
  id: string;
  lessonId: string;
  label: string;
  kind: "attachment" | "slide" | "project";
  fileKey: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  createdAt: string;
}

export interface ProgressRecord {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  completed: boolean;
  watchPositionSeconds: number;
  updatedAt: string;
}

export interface NoteRecord {
  id: string;
  userId: string;
  lessonId: string;
  content: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  percentageOff: number;
  active: boolean;
}

export interface Order {
  id: string;
  userId: string;
  courseId: string;
  amountInr: number;
  couponCode?: string;
  status: OrderStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  reference: string;
  screenshotUrl?: string;
  notes?: string;
  status: PaymentStatus;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface PaymentSettings {
  id: string;
  upiId?: string;
  payeeName?: string;
  qrCodeUrl?: string;
  note?: string;
  updatedAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  issuedAt: string;
  certificateNumber: string;
}

export interface AiChatMessage {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface Store {
  users: User[];
  categories: Category[];
  courses: Course[];
  modules: Module[];
  lessons: Lesson[];
  assets: LessonAsset[];
  enrollments: Enrollment[];
  progress: ProgressRecord[];
  notes: NoteRecord[];
  coupons: Coupon[];
  orders: Order[];
  payments: Payment[];
  paymentSettings: PaymentSettings[];
  certificates: Certificate[];
  aiMessages: AiChatMessage[];
  auditLogs: AuditLog[];
}
