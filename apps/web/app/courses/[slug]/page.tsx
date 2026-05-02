import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseBySlug, getDashboardData } from "@academy/db";
import { getCurrentUser } from "../../../lib/auth";
import { createOrderAction } from "../../../lib/actions";
import { formatInr } from "../../../lib/utils";

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [course, user] = await Promise.all([getCourseBySlug(slug), getCurrentUser()]);
  if (!course) notFound();

  const dashboard = user ? await getDashboardData(user.id) : null;
  const activeCourse = dashboard?.activeCourses.find((item: any) => item.id === course.id);

  const levelBadge: Record<string, string> = {
    beginner: "badge-teal", intermediate: "badge-amber", advanced: "badge-red",
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="border-b-2 border-[#080808] bg-white">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-14">
          <div className="flex flex-wrap gap-2 mb-5">
            <span className={`badge ${levelBadge[course.level?.toLowerCase()] ?? "badge-black"}`}>{course.level}</span>
            <span className="badge badge-black">{course.category?.name ?? "Tech"}</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-700 tracking-tight text-[#080808] leading-[1.05] max-w-3xl">{course.title}</h1>
          <p className="mt-4 text-base text-[#6B6B65] leading-relaxed max-w-2xl">{course.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { icon: "⏱", label: `${course.durationHours} hours` },
              { icon: "📦", label: `${course.modules.length} modules` },
              { icon: "✓", label: "Certificate included" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 border border-[#E0E0D8] bg-white px-4 py-2 text-sm font-600 text-[#080808]">
                <span>{s.icon}</span>{s.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* Main */}
          <div className="space-y-8">
            {/* Enrolled progress */}
            {activeCourse && (
              <div className="card p-6 border-l-4 border-l-[#E63946] bg-white">
                <p className="text-xs font-700 uppercase tracking-[0.14em] text-[#E63946] mb-2">Enrolled</p>
                <h2 className="text-xl font-700 text-[#080808] mb-2">Your Progress</h2>
                <p className="text-sm text-[#6B6B65] mb-4">{activeCourse.completedLessons}/{activeCourse.lessonCount} lessons • {activeCourse.progress}% complete</p>
                <div className="progress-track mb-5">
                  <div className="progress-fill" style={{ width: `${activeCourse.progress}%` }} />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={activeCourse.resumeLessonSlug ? `/learn/${course.slug}/${activeCourse.resumeLessonSlug}` : `/courses/${course.slug}`}
                    className="btn-primary btn-sm"
                  >
                    {activeCourse.progress === 100 ? "Review Course" : "Resume Learning →"}
                  </Link>
                  {activeCourse.certificateNumber && (
                    <span className="btn-outline btn-sm">✱ Certificate: {activeCourse.certificateNumber}</span>
                  )}
                </div>
              </div>
            )}

            {/* Outcomes + Prerequisites */}
            <div className="grid gap-5 md:grid-cols-2">
              {[
                { title: "What you'll build", items: course.outcomes, marker: "→" },
                { title: "Prerequisites", items: course.prerequisites, marker: "–" },
              ].map(section => (
                <div key={section.title} className="card bg-white p-6">
                  <h2 className="text-lg font-700 text-[#080808] mb-4">{section.title}</h2>
                  <ul className="space-y-2.5">
                    {section.items.map((item: string) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-[#6B6B65]">
                        <span className="text-[#E63946] font-700 shrink-0 mt-0.5">{section.marker}</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Curriculum */}
            <div className="card bg-white p-6">
              <h2 className="text-xl font-700 text-[#080808] mb-6">Curriculum</h2>
              <div className="space-y-4">
                {course.modules.map((module: any, idx: number) => (
                  <div key={module.id} className="border border-[#E0E0D8]">
                    <div className="bg-[#F5F5EF] px-5 py-4 flex items-center gap-3 border-b border-[#E0E0D8]">
                      <span className="font-mono text-xs font-700 text-[#E63946] shrink-0">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="font-700 text-[#080808]">{module.title}</h3>
                        {module.description && <p className="text-xs text-[#6B6B65] mt-0.5">{module.description}</p>}
                      </div>
                    </div>
                    <div>
                      {module.lessons.map((lesson: any, lessonIdx: number) => (
                        <div key={lesson.id} className={`flex items-center justify-between px-5 py-3 hover:bg-[#F9F9F5] transition-colors ${lessonIdx < module.lessons.length - 1 ? "border-b border-[#F0F0E8]" : ""}`}>
                          <div>
                            <p className="text-sm font-600 text-[#080808]">{lesson.title}</p>
                            <p className="text-xs text-[#9B9B95] mt-0.5">{lesson.type} • {lesson.durationMinutes} min{lesson.isPreview ? " • Free preview" : ""}</p>
                          </div>
                          <Link href={`/learn/${course.slug}/${lesson.slug}`} className="text-xs font-700 text-[#E63946] hover:underline shrink-0">
                            {activeCourse ? "Continue →" : "Preview →"}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {!course.modules.length && (
                  <div className="border-2 border-dashed border-[#E0E0D8] p-8 text-center text-sm text-[#9B9B95]">
                    Curriculum is being prepared. Check back soon.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky sidebar */}
          <aside className="lg:sticky lg:top-24 self-start">
            <div className="card-float bg-white p-6 space-y-5">
              <div>
                <p className="text-xs font-700 uppercase tracking-widest text-[#6B6B65]">One-time access</p>
                <p className="text-5xl font-700 text-[#080808] mt-2">{formatInr(course.priceInr)}</p>
              </div>

              <div className="space-y-2.5 py-4 border-y border-[#E0E0D8]">
                {["Lifetime course access", "AI-assisted study tutor", "Progress tracking & notes", "Completion certificate", "Admin-verified payment"].map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-[#6B6B65]">
                    <span className="h-4 w-4 bg-[#080808] flex items-center justify-center text-white text-[10px] font-700 shrink-0">✓</span>
                    {item}
                  </div>
                ))}
              </div>

              {activeCourse ? (
                <div className="border border-[#5BADAF] bg-[#F0FAFA] p-4 text-sm text-[#2B7A7A] font-600">
                  ✓ You already have access. Continue from your dashboard.
                </div>
              ) : (
                <form action={createOrderAction} className="space-y-3">
                  <input type="hidden" name="courseSlug" value={course.slug} />
                  <div>
                    <label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-2">Coupon Code</label>
                    <input name="couponCode" placeholder="LAUNCH20" className="input-field text-sm" />
                  </div>
                  <button className="btn-primary w-full justify-center py-3.5">
                    Enroll Now — {formatInr(course.priceInr)}
                  </button>
                  <p className="text-xs text-[#9B9B95] text-center leading-relaxed">
                    Pay via UPI → submit reference → admin approves access
                  </p>
                </form>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
