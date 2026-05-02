import Link from "next/link";
import { getCatalog } from "@academy/db";
import { CourseCard } from "../../components/course-card";

export default async function CoursesPage() {
  const courses = await getCatalog();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="border-b-2 border-[#080808] bg-white">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-16">
          <p className="section-tag mb-4">
            <span className="h-1.5 w-1.5 bg-[#E63946] inline-block rounded-full" />
            Course Catalog
          </p>
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <h1 className="text-5xl lg:text-6xl font-700 tracking-tight text-[#080808] leading-[1.04]">
              All Tech<br/>Courses
            </h1>
            <div className="space-y-2 max-w-xs">
              <p className="text-sm text-[#6B6B65] leading-relaxed">
                Beginner-friendly learning paths built to reach real project and job-readiness milestones.
              </p>
              <Link href="/signup" className="btn-primary btn-sm inline-flex">Start Free →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-12">
        {courses.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E0E0D8]">
              <p className="text-sm font-600 text-[#6B6B65] uppercase tracking-widest">
                {courses.length} course{courses.length !== 1 ? "s" : ""} available
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course: any) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </>
        ) : (
          <div className="border-2 border-dashed border-[#E0E0D8] py-24 text-center space-y-5">
            <p className="text-4xl font-700 text-[#080808]">Courses coming soon</p>
            <p className="text-[#6B6B65] text-base">The first batch is being prepared. Get notified on launch.</p>
            <Link href="/signup" className="btn-primary inline-flex">Get Notified →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
