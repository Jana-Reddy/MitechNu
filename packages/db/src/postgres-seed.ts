import { db } from "./client";
import { eq } from "drizzle-orm";
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
  payments,
  progressRecords,
  users
} from "./schema";
import { seedData } from "./seed";

async function insertIfAny<TTable, TValue>(table: TTable, values: TValue[]) {
  if (!values.length) {
    return;
  }

  await db.insert(table as never).values(values as never).onConflictDoNothing();
}

async function seedPostgres() {
  await insertIfAny(users, 
    seedData.users.map((user) => ({
      ...user,
      createdAt: new Date(user.createdAt)
    }))
  );

  await insertIfAny(categories, seedData.categories);

  await insertIfAny(courses,
    seedData.courses.map((course) => ({
      ...course,
      createdAt: new Date(course.createdAt)
    }))
  );


  await insertIfAny(modules, seedData.modules);
  await insertIfAny(lessons, seedData.lessons);
  await insertIfAny(lessonAssets, seedData.assets);

  await insertIfAny(enrollments,
    seedData.enrollments.map((enrollment) => ({
      ...enrollment,
      createdAt: new Date(enrollment.createdAt)
    }))
  );

  await insertIfAny(progressRecords,
    seedData.progress.map((record) => ({
      ...record,
      updatedAt: new Date(record.updatedAt)
    }))
  );

  await insertIfAny(notes,
    seedData.notes.map((note) => ({
      ...note,
      createdAt: new Date(note.createdAt)
    }))
  );

  await insertIfAny(coupons, seedData.coupons);

  await insertIfAny(orders,
    seedData.orders.map((order) => ({
      ...order,
      createdAt: new Date(order.createdAt)
    }))
  );

  await insertIfAny(payments,
    seedData.payments.map((payment) => ({
      ...payment,
      reviewedAt: payment.reviewedAt ? new Date(payment.reviewedAt) : null
    }))
  );

  await insertIfAny(certificates,
    seedData.certificates.map((certificate) => ({
      ...certificate,
      issuedAt: new Date(certificate.issuedAt)
    }))
  );

  await insertIfAny(aiMessages,
    seedData.aiMessages.map((message) => ({
      ...message,
      createdAt: new Date(message.createdAt)
    }))
  );

  await insertIfAny(auditLogs,
    seedData.auditLogs.map((entry) => ({
      ...entry,
      createdAt: new Date(entry.createdAt)
    }))
  );

  console.log("Postgres seed complete.");
}

seedPostgres().catch((error) => {
  console.error("Postgres seed failed.");
  console.error(error);
  process.exit(1);
});
