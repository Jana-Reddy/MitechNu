import Link from "next/link";
import { SectionShell } from "@academy/ui";
import { getFeaturedCatalog } from "@academy/db";
import { CourseCard } from "../components/course-card";
import { SectionTitle } from "../components/section-title";

const outcomes = [
  "Guided paths for beginners who want job-ready execution",
  "Manual payment workflow for open-source-first launches",
  "Learner dashboards, progress tracking, notes, and certificates",
  "Admin tooling for catalog ops, orders, and content publishing"
];

export default async function HomePage() {
  const featuredCourses = await getFeaturedCatalog();

  return (
    <div className="pb-20">
      <SectionShell>
        <section className="grid gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">
              Open-source-first learning platform
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl">
                Learn tech the way products are actually built.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                A modern online academy for full-stack, AI, and software career tracks with structured lessons, private media delivery, and a lightweight study tutor.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/courses" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Explore courses
              </Link>
              <Link href="/signup" className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950">
                Create learner account
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {outcomes.map((item: any) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm leading-6 text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-panel">
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">Launch stack</p>
              <div className="grid gap-4">
                {[
                  "Java 17+ with Spring Boot for enterprise applications",
                  "Spring MVC, Spring Data JPA, and REST API development",
                  "Spring Cloud for microservices architecture",
                  "Service discovery with Eureka and API Gateways",
                  "Distributed systems patterns and event-driven design"
                ].map((item: any) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </SectionShell>

      <SectionTitle
        label="Featured"
        title="Featured Courses"
        description="Practical courses to build real-world skills."
      />

      <SectionShell>
        <div className="grid gap-6 md:grid-cols-2">
          {featuredCourses.map((course: any) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </SectionShell>
    </div>
  );
}

