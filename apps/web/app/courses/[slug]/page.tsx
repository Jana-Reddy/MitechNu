import Link from "next/link";
import { notFound } from "next/navigation";
import { Pill, SectionShell } from "@academy/ui";
import { getCourseBySlug, getDashboardData } from "@academy/db";
import { getCurrentUser } from "../../../lib/auth";
import { createOrderAction } from "../../../lib/actions";
import { formatInr } from "../../../lib/utils";

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [course, user] = await Promise.all([getCourseBySlug(slug), getCurrentUser()]);

  if (!course) {
    notFound();
  }

  const dashboard = user ? await getDashboardData(user.id) : null;
  const activeCourse = dashboard?.activeCourses.find((item) => item.id === course.id);

  return (
    <div className="pb-20">
      <SectionShell>
        <section className="grid gap-10 py-14 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <div className="space-y-4">
              <Pill>{course.category?.name ?? "Tech"}</Pill>
              <div className="space-y-4">
                <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{course.title}</h1>
                <p className="max-w-3xl text-lg leading-8 text-slate-600">{course.description}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Level</p>
                <p className="mt-2 text-lg font-bold capitalize text-slate-950">{course.level}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Duration</p>
                <p className="mt-2 text-lg font-bold text-slate-950">{course.durationHours} hours</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Modules</p>
                <p className="mt-2 text-lg font-bold text-slate-950">{course.modules.length}</p>
              </div>
            </div>

            {activeCourse ? (
              <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Enrolled</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">Your learner progress</h2>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {activeCourse.completedLessons}/{activeCourse.lessonCount} lessons complete • {activeCourse.progress}% complete
                </p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/80">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-accent" style={{ width: `${activeCourse.progress}%` }} />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href={activeCourse.resumeLessonSlug ? `/learn/${course.slug}/${activeCourse.resumeLessonSlug}` : `/courses/${course.slug}`} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                    {activeCourse.progress === 100 ? "Review course" : "Resume learning"}
                  </Link>
                  {activeCourse.certificateNumber ? (
                    <span className="rounded-full border border-emerald-300 px-4 py-3 text-sm font-semibold text-emerald-700">
                      Certificate: {activeCourse.certificateNumber}
                    </span>
                  ) : null}
                </div>
                {activeCourse.certificateNumber ? (
                  <div className="mt-5 rounded-[1.5rem] border border-emerald-200 bg-white/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Completion unlocked</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      You finished this course and earned certificate <span className="font-semibold">{activeCourse.certificateNumber}</span>.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-bold text-slate-950">What you will build</h2>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  {course.outcomes.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-bold text-slate-950">Prerequisites</h2>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  {course.prerequisites.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold text-slate-950">Curriculum</h2>
              <div className="mt-6 space-y-4">
                {course.modules.map((module) => (
                  <div key={module.id} className="rounded-3xl border border-slate-200 p-5">
                    <h3 className="text-lg font-bold text-slate-950">{module.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{module.description}</p>
                    <div className="mt-4 space-y-3">
                      {module.lessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                          <div>
                            <p className="font-semibold text-slate-900">{lesson.title}</p>
                            <p className="text-slate-500">{lesson.type} • {lesson.durationMinutes} min{lesson.isPreview ? " • Preview" : ""}</p>
                          </div>
                          <Link href={`/learn/${course.slug}/${lesson.slug}`} className="font-semibold text-accent">
                            {activeCourse ? "Continue" : "Preview"}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {!course.modules.length ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                    Curriculum is being prepared. Check back soon for the first module release.
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">One-time access</p>
            <p className="mt-4 text-4xl font-black text-slate-950">{formatInr(course.priceInr)}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Manual payment workflow for open-source-first self-hosting. Create an order, submit your payment reference, and an admin approves access.
            </p>
            {activeCourse ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-700">
                You already have access to this course. Continue learning from your dashboard or jump back into the curriculum.
              </div>
            ) : (
              <form action={createOrderAction} className="mt-6 space-y-4">
                <input type="hidden" name="courseSlug" value={course.slug} />
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Coupon code</span>
                  <input name="couponCode" placeholder="LAUNCH20" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none ring-0 transition focus:border-slate-950" />
                </label>
                <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                  Create order
                </button>
              </form>
            )}
          </aside>
        </section>
      </SectionShell>
    </div>
  );
}

