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
      id: "course_java_spring",
      categoryId: "cat_backend",
      title: "Java Spring Boot Mastery",
      slug: "java-spring-boot-mastery",
      excerpt: "Build enterprise applications with Java 17+, Spring Boot, REST APIs, and PostgreSQL.",
      description: "A comprehensive path from Java fundamentals to production-ready Spring Boot applications with modules on dependency injection, data access, security, and deployment.",
      coverImage: "https://placehold.co/1200x630/1e3a8a/ffffff?text=Java+Spring+Boot+Mastery&font=playfair-display",
      level: "beginner",
      priceInr: 4999,
      durationHours: 32,
      status: "published",
      outcomes: [
        "Build production-grade Spring Boot applications",
        "Design RESTful APIs and JPA data models",
        "Implement security, testing, and deployment"
      ],
      prerequisites: ["Basic programming knowledge", "Understanding of object-oriented concepts"],
      tags: ["java", "spring", "springboot", "postgres", "enterprise"],
      featured: true,
      createdAt: now
    },
    {
      id: "course_java_advanced",
      categoryId: "cat_backend",
      title: "Advanced Java & Microservices",
      slug: "advanced-java-microservices",
      excerpt: "Master microservices architecture, Spring Cloud, distributed systems, and performance tuning.",
      description: "Take your Java skills to the next level with microservices patterns, event-driven architecture, containerization, and cloud-native deployment strategies.",
      coverImage: "https://placehold.co/1200x630/1e3a8a/ffffff?text=Advanced+Java+%26+Microservices&font=playfair-display",
      level: "intermediate",
      priceInr: 5999,
      durationHours: 40,
      status: "published",
      outcomes: [
        "Design and implement microservices architecture",
        "Use Spring Cloud for distributed systems",
        "Deploy Java applications with Docker and Kubernetes"
      ],
      prerequisites: ["Java Spring Boot experience", "Understanding of REST APIs"],
      tags: ["java", "microservices", "springcloud", "kubernetes", "architecture"],
      featured: true,
      createdAt: now
    }
  ],
  modules: [
    {
      id: "mod_java_1",
      courseId: "course_java_spring",
      title: "Java Fundamentals",
      description: "Master Java syntax, OOP concepts, and core libraries.",
      order: 1
    },
    {
      id: "mod_java_2",
      courseId: "course_java_spring",
      title: "Spring Boot Essentials",
      description: "Build REST APIs with Spring Boot, Spring MVC, and Spring Data JPA.",
      order: 2
    },
    {
      id: "mod_java_3",
      courseId: "course_java_spring",
      title: "Data Access & Security",
      description: "Implement JPA repositories, database operations, and Spring Security.",
      order: 3
    },
    {
      id: "mod_micro_1",
      courseId: "course_java_advanced",
      title: "Microservices Patterns",
      description: "Learn microservices architecture, service discovery, and API gateways.",
      order: 1
    },
    {
      id: "mod_micro_2",
      courseId: "course_java_advanced",
      title: "Spring Cloud & Distributed Systems",
      description: "Implement Spring Cloud components for distributed applications.",
      order: 2
    }
  ],
  lessons: [
    {
      id: "lesson_java_intro",
      moduleId: "mod_java_1",
      slug: "java-introduction",
      title: "Introduction to Java Programming",
      type: "video",
      order: 1,
      durationMinutes: 25,
      isPreview: true,
      videoKey: "videos/java/intro/index.m3u8",
      body: "This lesson introduces Java programming, its ecosystem, and why it's the preferred choice for enterprise applications."
    },
    {
      id: "lesson_java_oop",
      moduleId: "mod_java_1",
      slug: "java-oop-concepts",
      title: "Object-Oriented Programming in Java",
      type: "article",
      order: 2,
      durationMinutes: 30,
      isPreview: false,
      body: "Deep dive into OOP principles: encapsulation, inheritance, polymorphism, and abstraction with practical Java examples."
    },
    {
      id: "lesson_spring_boot",
      moduleId: "mod_java_2",
      slug: "spring-boot-fundamentals",
      title: "Spring Boot Fundamentals",
      type: "video",
      order: 1,
      durationMinutes: 35,
      isPreview: false,
      videoKey: "videos/spring/boot-fundamentals/index.m3u8",
      body: "Learn how to set up a Spring Boot project, understand auto-configuration, and create your first REST endpoint."
    },
    {
      id: "lesson_spring_data",
      moduleId: "mod_java_3",
      slug: "spring-data-jpa",
      title: "Spring Data JPA and Database Operations",
      type: "video",
      order: 1,
      durationMinutes: 40,
      isPreview: false,
      videoKey: "videos/spring/data-jpa/index.m3u8",
      body: "Master JPA repositories, entity relationships, and database transactions with Spring Data."
    },
    {
      id: "lesson_micro_intro",
      moduleId: "mod_micro_1",
      slug: "microservices-intro",
      title: "Introduction to Microservices Architecture",
      type: "video",
      order: 1,
      durationMinutes: 30,
      isPreview: true,
      videoKey: "videos/microservices/intro/index.m3u8",
      body: "Understand the microservices architecture pattern, its benefits, and when to use it over monolithic applications."
    },
    {
      id: "lesson_spring_cloud",
      moduleId: "mod_micro_2",
      slug: "spring-cloud-components",
      title: "Spring Cloud for Distributed Systems",
      type: "article",
      order: 1,
      durationMinutes: 45,
      isPreview: false,
      body: "Learn Spring Cloud components: Config Server, Service Discovery (Eureka), API Gateway, and Circuit Breakers."
    }
  ],
  assets: [
    {
      id: "asset_java_starter",
      lessonId: "lesson_spring_boot",
      label: "Spring Boot starter project template",
      kind: "project",
      fileKey: "resources/java/spring-starter.zip"
    },
    {
      id: "asset_micro_arch",
      lessonId: "lesson_micro_intro",
      label: "Microservices architecture diagrams",
      kind: "slide",
      fileKey: "resources/microservices/architecture.pdf"
    }
  ],
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
