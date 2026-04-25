import type { DemoStore } from "./types";
import { hashPassword } from "./auth-utils";

const now = "2026-04-06T09:00:00.000Z";

export const seedData: DemoStore = {
  users: [
    {
      id: "user_admin",
      name: "Academy Admin",
      email: "admin@academy.dev",
      passwordHash: hashPassword("admin123", "admin-seed-salt"),
      role: "admin",
      bio: "Operates the academy catalog and learner success workflows.",
      createdAt: now
    },
    {
      id: "user_learner",
      name: "Aarav Sharma",
      email: "learner@academy.dev",
      passwordHash: hashPassword("learner123", "learner-seed-salt"),
      role: "learner",
      bio: "Aspiring full-stack developer.",
      createdAt: now
    }
  ],
  categories: [
    {
      id: "cat_programming",
      name: "Programming",
      slug: "programming",
      description: "Learn programming fundamentals and languages."
    },
    {
      id: "cat_tools",
      name: "Tools",
      slug: "tools",
      description: "Development tools, frameworks, and utilities."
    },
    {
      id: "cat_sql",
      name: "SQL",
      slug: "sql",
      description: "Database management and SQL queries."
    },
    {
      id: "cat_frontend",
      name: "Frontend",
      slug: "frontend",
      description: "User interface development and frontend technologies."
    },
    {
      id: "cat_backend",
      name: "Backend",
      slug: "backend",
      description: "Server-side development and APIs."
    }
  ],
  courses: [],
  modules: [],
  lessons: [],
  assets: [],
  enrollments: [],
  progress: [],
  notes: [],
  coupons: [
    {
      id: "coupon_launch",
      code: "LAUNCH20",
      percentageOff: 20,
      active: true
    }
  ],
  orders: [],
  payments: [],
  paymentSettings: [
    {
      id: "default",
      upiId: "academy@upi",
      payeeName: "Mi.Tech.Nu Courses",
      qrCodeUrl: "https://example.com/upi-qr.png",
      note: "Share your UTR after payment so access can be approved quickly.",
      updatedAt: now
    }
  ],
  certificates: [],
  aiMessages: [],
  auditLogs: []
};
