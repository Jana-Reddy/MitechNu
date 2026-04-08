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
      id: "cat_web",
      name: "Web Development",
      slug: "web-development",
      description: "Frontend, backend, APIs, and deployment."
    },
    {
      id: "cat_data",
      name: "Data & AI",
      slug: "data-ai",
      description: "Machine learning, data engineering, and AI tooling."
    }
  ],
  courses: [
    {
      id: "course_nextjs",
      categoryId: "cat_web",
      title: "Job-Ready Full Stack with Next.js",
      slug: "job-ready-full-stack-nextjs",
      excerpt: "Build modern full-stack products with React, Next.js, APIs, auth, and deployment.",
      description: "A guided path from fundamentals to production-ready full-stack delivery with modules on product thinking, backend integration, testing, and deployment.",
      coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      level: "beginner",
      priceInr: 4999,
      durationHours: 28,
      status: "published",
      outcomes: [
        "Build production-grade Next.js applications",
        "Design APIs and data models with confidence",
        "Ship authentication, payments, and admin tooling"
      ],
      prerequisites: ["Comfort using a browser", "Basic HTML/CSS familiarity"],
      tags: ["nextjs", "react", "typescript", "postgres", "career"],
      featured: true,
      createdAt: now
    },
    {
      id: "course_python",
      categoryId: "cat_data",
      title: "Python for Data and AI Builders",
      slug: "python-for-data-ai-builders",
      excerpt: "Learn Python, notebooks, APIs, and model workflows for practical AI projects.",
      description: "Start with Python basics and grow into data analysis, AI tooling, and project delivery with practical labs and capstones.",
      coverImage: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80",
      level: "beginner",
      priceInr: 3999,
      durationHours: 24,
      status: "published",
      outcomes: [
        "Write clean Python scripts and packages",
        "Analyze data with modern tools",
        "Integrate LLM workflows into useful apps"
      ],
      prerequisites: ["No prior coding experience required"],
      tags: ["python", "data", "ai", "automation"],
      featured: true,
      createdAt: now
    }
  ],
  modules: [
    {
      id: "mod_next_1",
      courseId: "course_nextjs",
      title: "Foundations",
      description: "Set up tools, understand the web platform, and build your first Next.js screens.",
      order: 1
    },
    {
      id: "mod_next_2",
      courseId: "course_nextjs",
      title: "Backend and Delivery",
      description: "Add data, auth, payments, and deployment workflows.",
      order: 2
    },
    {
      id: "mod_py_1",
      courseId: "course_python",
      title: "Python Fundamentals",
      description: "Variables, control flow, functions, and project structure.",
      order: 1
    }
  ],
  lessons: [
    {
      id: "lesson_next_intro",
      moduleId: "mod_next_1",
      slug: "nextjs-intro",
      title: "Why Full Stack Product Builders Win",
      type: "video",
      order: 1,
      durationMinutes: 18,
      isPreview: true,
      videoKey: "videos/nextjs/intro/index.m3u8",
      body: "This lesson frames the course around outcomes: shipping products, understanding the user journey, and connecting frontend decisions to business results."
    },
    {
      id: "lesson_next_routes",
      moduleId: "mod_next_1",
      slug: "app-router-foundations",
      title: "App Router Foundations",
      type: "article",
      order: 2,
      durationMinutes: 22,
      isPreview: false,
      body: "Learn layouts, nested routes, server components, and how to keep data fetching close to the UI that needs it."
    },
    {
      id: "lesson_next_ship",
      moduleId: "mod_next_2",
      slug: "shipping-your-first-product",
      title: "Shipping Your First Product",
      type: "video",
      order: 1,
      durationMinutes: 26,
      isPreview: false,
      videoKey: "videos/nextjs/shipping/index.m3u8",
      body: "We bring together auth, storage, background jobs, and production deployment practices to launch an end-to-end product."
    },
    {
      id: "lesson_py_intro",
      moduleId: "mod_py_1",
      slug: "python-and-ai-overview",
      title: "Python and AI Overview",
      type: "video",
      order: 1,
      durationMinutes: 20,
      isPreview: true,
      videoKey: "videos/python/overview/index.m3u8",
      body: "See how Python fits into automation, data workflows, APIs, and modern AI product development."
    }
  ],
  assets: [
    {
      id: "asset_next_project",
      lessonId: "lesson_next_ship",
      label: "Starter project repository guide",
      kind: "project",
      fileKey: "resources/nextjs/starter-guide.pdf"
    }
  ],
  enrollments: [
    {
      id: "enrollment_1",
      userId: "user_learner",
      courseId: "course_nextjs",
      createdAt: now
    }
  ],
  progress: [
    {
      id: "progress_1",
      userId: "user_learner",
      courseId: "course_nextjs",
      lessonId: "lesson_next_intro",
      completed: true,
      watchPositionSeconds: 1080,
      updatedAt: now
    }
  ],
  notes: [
    {
      id: "note_1",
      userId: "user_learner",
      lessonId: "lesson_next_intro",
      content: "The product mindset angle is important: tie every technical choice back to learner value.",
      createdAt: now
    }
  ],
  coupons: [
    {
      id: "coupon_launch",
      code: "LAUNCH20",
      percentageOff: 20,
      active: true
    }
  ],
  orders: [
    {
      id: "order_1",
      userId: "user_learner",
      courseId: "course_python",
      amountInr: 3199,
      couponCode: "LAUNCH20",
      status: "pending",
      createdAt: now
    }
  ],
  payments: [
    {
      id: "payment_1",
      orderId: "order_1",
      reference: "UPI-REF-DEMO-1001",
      notes: "Awaiting admin verification.",
      status: "proof_submitted"
    }
  ],
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
