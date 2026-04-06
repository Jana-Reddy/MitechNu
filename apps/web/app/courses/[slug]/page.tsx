import Link from "next/link";
import { notFound } from "next/navigation";
import { Pill, SectionShell } from "@academy/ui";
import { getCourseBySlug } from "@academy/db";
import { createOrderAction } from "../../../lib/actions";
import { formatInr } from "../../../lib/utils";

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

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
                            <p className="text-slate-500">{lesson.type} • {lesson.durationMinutes} min {lesson.isPreview ? "• Preview" : ""}</p>
                          </div>
                          <Link href={`/learn/${course.slug}/${lesson.slug}`} className="font-semibold text-accent">
                            Open
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">One-time access</p>
            <p className="mt-4 text-4xl font-black text-slate-950">{formatInr(course.priceInr)}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Manual payment workflow for open-source-first self-hosting. Create an order, submit your payment reference, and an admin approves access.
            </p>
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
          </aside>
        </section>
      </SectionShell>
    </div>
  );
}
