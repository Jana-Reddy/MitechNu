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
  courses: [
    {
      id: "course_sde",
      categoryId: "cat_programming",
      title: "SDE Fundamentals",
      slug: "sde-fundamentals",
      excerpt: "Master the fundamentals of Software Development Engineering.",
      description: "This comprehensive course covers data structures, algorithms, system design basics, and essential tools required to crack top product company interviews and perform well as an SDE.",
      coverImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
      level: "beginner",
      priceInr: 3500,
      durationHours: 40,
      status: "published",
      outcomes: ["Master Data Structures & Algorithms", "Crack SDE interviews", "Understand basic System Design"],
      prerequisites: ["Basic programming knowledge"],
      tags: ["SDE", "DSA", "Interviews"],
      featured: true,
      createdAt: now
    },
    {
      id: "course_java",
      categoryId: "cat_programming",
      title: "Java Core Mastery",
      slug: "java-core-mastery",
      excerpt: "Deep dive into Core Java programming from scratch.",
      description: "Learn everything about Core Java, including OOP concepts, collections framework, multithreading, and JVM internals to build robust applications.",
      coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
      level: "beginner",
      priceInr: 2500,
      durationHours: 30,
      status: "published",
      outcomes: ["Write production-ready Java code", "Understand JVM internals", "Master Collections and Concurrency"],
      prerequisites: ["None"],
      tags: ["Java", "Programming", "OOP"],
      featured: true,
      createdAt: now
    },
    {
      id: "course_mern",
      categoryId: "cat_frontend",
      title: "Full Stack Web Development (MERN)",
      slug: "full-stack-mern",
      excerpt: "Become a full-stack developer using MongoDB, Express, React, and Node.js.",
      description: "Build full-fledged web applications from scratch. This course takes you through frontend development with React to backend APIs with Node.js and MongoDB.",
      coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80",
      level: "intermediate",
      priceInr: 4500,
      durationHours: 60,
      status: "published",
      outcomes: ["Build full-stack MERN apps", "Deploy applications to cloud", "Implement authentication and authorization"],
      prerequisites: ["Basic JavaScript knowledge"],
      tags: ["MERN", "React", "NodeJS", "Full Stack"],
      featured: true,
      createdAt: now
    },
    {
      id: "course_advanced_node",
      categoryId: "cat_backend",
      title: "Advanced Backend with Node.js",
      slug: "advanced-backend-nodejs",
      excerpt: "Master backend development, microservices, and database design with Node.js.",
      description: "Go beyond the basics. Learn how to design scalable backend architectures, work with microservices, message queues, and advanced database optimization techniques.",
      coverImage: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=1200&q=80",
      level: "advanced",
      priceInr: 5000,
      durationHours: 45,
      status: "published",
      outcomes: ["Design scalable APIs", "Implement microservices", "Database optimization"],
      prerequisites: ["Basic Node.js", "Express"],
      tags: ["NodeJS", "Backend", "Microservices"],
      featured: false,
      createdAt: now
    },
    {
      id: "course_nextjs",
      categoryId: "cat_frontend",
      title: "Full Stack Next.js App Router",
      slug: "full-stack-nextjs",
      excerpt: "Build modern, SEO-friendly web apps with Next.js 14 and App Router.",
      description: "Learn the latest paradigms in React development with Next.js. Cover server components, server actions, data fetching, caching, and building full-stack apps in a single framework.",
      coverImage: "https://images.unsplash.com/photo-1627398246734-d81a4b164a2a?auto=format&fit=crop&w=1200&q=80",
      level: "intermediate",
      priceInr: 3800,
      durationHours: 35,
      status: "published",
      outcomes: ["Master Next.js App Router", "Server Components & Server Actions", "SEO optimization"],
      prerequisites: ["React fundamentals"],
      tags: ["Next.js", "React", "Full Stack"],
      featured: true,
      createdAt: now
    },
    {
      id: "course_spring_boot",
      categoryId: "cat_backend",
      title: "Backend with Spring Boot",
      slug: "backend-spring-boot",
      excerpt: "Enterprise-grade backend development with Java and Spring Boot.",
      description: "The industry standard for Java backend development. Learn to build RESTful web services, secure them with Spring Security, and work with Spring Data JPA.",
      coverImage: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80",
      level: "intermediate",
      priceInr: 4200,
      durationHours: 40,
      status: "published",
      outcomes: ["Build Spring Boot APIs", "Implement Spring Security", "Work with Spring Data JPA"],
      prerequisites: ["Core Java knowledge"],
      tags: ["Java", "Spring Boot", "Backend"],
      featured: true,
      createdAt: now
    },
    {
      id: "course_system_design",
      categoryId: "cat_programming",
      title: "SDE System Design",
      slug: "sde-system-design",
      excerpt: "Master the art of designing scalable systems.",
      description: "Crack the system design interview. Learn about scalability, load balancing, caching, database sharding, and design systems like Twitter, Uber, and Netflix.",
      coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
      level: "advanced",
      priceInr: 5500,
      durationHours: 25,
      status: "published",
      outcomes: ["Crack System Design interviews", "Design scalable architectures", "Understand distributed systems"],
      prerequisites: ["Experience building software"],
      tags: ["System Design", "SDE", "Architecture"],
      featured: true,
      createdAt: now
    }
  ],
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
