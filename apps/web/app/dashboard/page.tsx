import Link from "next/link";
import { redirect } from "next/navigation";
import { SectionShell } from "@academy/ui";
import { getDashboardData, listOrdersForUser, listUserCertificates } from "@academy/db";
import { getCurrentUser } from "../../lib/auth";
import { formatDate, formatInr } from "../../lib/utils";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [dashboard, orders, certificates] = await Promise.all([
    getDashboardData(user.id),
    listOrdersForUser(user.id),
    listUserCertificates(user.id)
  ]);

  return (
    <SectionShell>
      <div className="space-y-10 py-14">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Learner dashboard</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Welcome back, {user.name}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Track your active courses, continue lessons, manage payment approvals, and keep study notes in one place.
          </p>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <h2 className="text-2xl font-bold text-slate-950">Active learning</h2>
              <div className="mt-5 grid gap-4">
                {dashboard.activeCourses.map((course) => (
                  <div key={course.id} className="rounded-3xl border border-slate-200 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-950">{course.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {course.completedLessons}/{course.lessonCount} lessons complete • {course.progress}% complete
                        </p>
                        {course.resumeLessonTitle ? (
                          <p className="mt-2 text-sm text-slate-500">Resume with: {course.resumeLessonTitle}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Link href={`/courses/${course.slug}`} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950">
                          View course
                        </Link>
                        <Link href={course.resumeLessonSlug ? `/learn/${course.slug}/${course.resumeLessonSlug}` : `/courses/${course.slug}`} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                          {course.progress === 100 ? "Review course" : "Resume learning"}
                        </Link>
                      </div>
                    </div>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-sunrise to-accent" style={{ width: `${course.progress}%` }} />
                    </div>
                    {course.certificateNumber ? (
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        Certificate issued: {course.certificateNumber}
                      </p>
                    ) : null}
                  </div>
                ))}
                {!dashboard.activeCourses.length ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6">
                    <h3 className="text-lg font-bold text-slate-950">No active courses yet</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Browse the catalog, create your first order, and your active learning queue will appear here with resume links and progress tracking.
                    </p>
                    <Link href="/courses" className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                      Explore courses
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <h2 className="text-2xl font-bold text-slate-950">Recent notes</h2>
              <div className="mt-4 space-y-4">
                {dashboard.notes.map((note) => (
                  <div key={note.id} className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    {note.content}
                  </div>
                ))}
                {!dashboard.notes.length ? (
                  <p className="text-sm leading-6 text-slate-500">Your saved lesson notes will appear here as you study.</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold text-slate-950">Orders</h2>
              <div className="mt-4 space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-semibold text-slate-950">{order.course?.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{formatInr(order.amountInr)} • {order.status}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">{formatDate(order.createdAt)}</p>
                    <Link href={`/checkout/${order.course?.slug}`} className="mt-3 inline-flex text-sm font-semibold text-accent">
                      Open checkout
                    </Link>
                  </div>
                ))}
                {!orders.length ? (
                  <p className="text-sm leading-6 text-slate-500">No learner orders yet. Enroll in a course to start your payment workflow.</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold text-slate-950">Certificates</h2>
              <div className="mt-4 space-y-4">
                {certificates.length ? certificates.map((certificate) => (
                  <div key={certificate.id} className="rounded-[1.75rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Completion certificate</p>
                    <p className="mt-3 font-semibold text-slate-950">{certificate.course?.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{certificate.certificateNumber}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">Issued {formatDate(certificate.issuedAt)}</p>
                  </div>
                )) : (
                  <p className="text-sm leading-6 text-slate-500">Finish a course to automatically issue a certificate.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </SectionShell>
  );
}

