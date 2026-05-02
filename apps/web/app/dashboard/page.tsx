import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardData, listOrdersForUser, listUserCertificates } from "@academy/db";
import { getCurrentUser } from "../../lib/auth";
import { formatDate, formatInr } from "../../lib/utils";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [dashboard, orders, certificates] = await Promise.all([
    getDashboardData(user.id),
    listOrdersForUser(user.id),
    listUserCertificates(user.id)
  ]);

  const avgProgress = dashboard.activeCourses.length
    ? Math.round(dashboard.activeCourses.reduce((s: number, c: any) => s + c.progress, 0) / dashboard.activeCourses.length)
    : 0;

  return (
    <div className="flex min-h-[calc(100vh-73px)]">
      {/* ── Left sidebar ── */}
      <aside className="hidden lg:flex flex-col items-center gap-4 w-16 shrink-0 border-r-2 border-[#080808] bg-[#F5F5EF] py-8 px-3">
        <Link href="/" className="sidebar-btn" title="Home">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
        <div className="sidebar-btn active" title="Dashboard">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </div>
        <Link href="/courses" className="sidebar-btn" title="Courses">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </Link>
        <div className="sidebar-btn" title="Notes">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="sidebar-btn" title="Certificates">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        {user.role === "admin" && (
          <Link href="/admin" className="sidebar-btn mt-auto" title="Admin">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        )}
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-auto bg-[#F5F5EF]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

          {/* Welcome */}
          <div className="card bg-white p-7">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs font-700 uppercase tracking-[0.14em] text-[#E63946] mb-2">
                  {user.role === "admin" ? "Admin & Learner Dashboard" : "Learner Dashboard"}
                </p>
                <h1 className="text-4xl font-700 tracking-tight text-[#080808]">
                  Dashboard
                </h1>
                <p className="mt-1 text-[#6B6B65] text-base">Welcome back, {user.name}</p>
              </div>
              <div className="h-14 w-14 bg-[#080808] flex items-center justify-center text-white text-2xl font-700 shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 border border-[#E0E0D8]">
              {[
                { val: dashboard.activeCourses.length, label: "Active Courses" },
                { val: `${avgProgress}%`, label: "Avg Progress" },
                { val: certificates.length, label: "Certificates" },
                { val: orders.length, label: "Orders" },
              ].map((s, i) => (
                <div key={s.label} className={`p-4 ${i < 3 ? "border-r border-[#E0E0D8]" : ""}`}>
                  <p className="text-2xl font-700 text-[#080808]">{s.val}</p>
                  <p className="text-xs text-[#6B6B65] mt-1 uppercase tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>

            {user.role === "admin" && (
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/admin" className="btn-primary btn-sm">Go to Admin Panel</Link>
                <Link href="/courses" className="btn-outline btn-sm">Manage Courses</Link>
              </div>
            )}
          </div>

          {/* Main grid */}
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* Left */}
            <div className="space-y-6">
              {/* Active courses */}
              <div className="card bg-white p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-700 text-[#080808]">Active Learning</h2>
                  <Link href="/courses" className="text-xs font-700 uppercase tracking-widest text-[#6B6B65] hover:text-[#080808]">Browse →</Link>
                </div>
                <div className="space-y-4">
                  {dashboard.activeCourses.map((course: any) => (
                    <div key={course.id} className="border border-[#E0E0D8] bg-[#F9F9F5] p-5 hover:border-[#080808] transition-colors">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <h3 className="font-700 text-[#080808]">{course.title}</h3>
                          <p className="mt-1 text-sm text-[#6B6B65]">
                            {course.completedLessons}/{course.lessonCount} lessons • {course.progress}%
                          </p>
                          {course.resumeLessonTitle && (
                            <p className="text-xs text-[#E63946] mt-0.5">Next: {course.resumeLessonTitle}</p>
                          )}
                        </div>
                        <span className="text-xl font-700 text-[#080808]">{course.progress}%</span>
                      </div>
                      <div className="mt-4 progress-track">
                        <div className="progress-fill" style={{ width: `${course.progress}%` }} />
                      </div>
                      {course.certificateNumber && (
                        <p className="mt-3 text-xs font-700 uppercase tracking-widest text-[#5BADAF]">✓ Certificate: {course.certificateNumber}</p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link href={`/courses/${course.slug}`} className="btn-outline btn-sm">View</Link>
                        <Link
                          href={course.resumeLessonSlug ? `/learn/${course.slug}/${course.resumeLessonSlug}` : `/courses/${course.slug}`}
                          className="btn-primary btn-sm"
                        >
                          {course.progress === 100 ? "Review" : "Resume →"}
                        </Link>
                      </div>
                    </div>
                  ))}

                  {!dashboard.activeCourses.length && (
                    <div className="border-2 border-dashed border-[#E0E0D8] p-10 text-center">
                      <p className="text-2xl font-700 text-[#080808] mb-2">No active courses</p>
                      <p className="text-sm text-[#6B6B65] mb-5">Browse the catalog, enroll, and your progress will appear here.</p>
                      <Link href="/courses" className="btn-primary btn-sm">Browse Courses →</Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="card bg-white p-6">
                <h2 className="text-xl font-700 text-[#080808] mb-5">Study Notes</h2>
                <div className="space-y-3">
                  {dashboard.notes.map((note: any) => (
                    <div key={note.id} className="border border-[#E0E0D8] bg-[#F9F9F5] p-4 text-sm leading-relaxed text-[#6B6B65] font-mono">
                      {note.content}
                    </div>
                  ))}
                  {!dashboard.notes.length && (
                    <p className="text-sm text-[#9B9B95] text-center py-6">Notes from your lessons will appear here.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="space-y-6">
              {/* Orders */}
              <div className="card bg-white p-5">
                <h2 className="text-lg font-700 text-[#080808] mb-4">Orders</h2>
                <div className="space-y-3">
                  {orders.map((order: any) => (
                    <div key={order.id} className="border border-[#E0E0D8] p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-700 text-sm text-[#080808] leading-snug">{order.course?.title}</p>
                        <span className={`badge shrink-0 ${
                          order.status === "approved" ? "badge-teal" :
                          order.status === "rejected" ? "badge-red" : "badge-muted"
                        }`}>{order.status}</span>
                      </div>
                      <p className="mt-1 text-xs text-[#6B6B65]">{formatInr(order.amountInr)} • {formatDate(order.createdAt)}</p>
                      <Link href={`/checkout/${order.course?.slug}`} className="mt-2 inline-block text-xs font-700 text-[#E63946] hover:underline">
                        Open checkout →
                      </Link>
                    </div>
                  ))}
                  {!orders.length && (
                    <p className="text-sm text-[#9B9B95] text-center py-4">No orders yet.</p>
                  )}
                </div>
              </div>

              {/* Certificates */}
              <div className="card bg-white p-5">
                <h2 className="text-lg font-700 text-[#080808] mb-4">Certificates</h2>
                <div className="space-y-3">
                  {certificates.map((cert: any) => (
                    <div key={cert.id} className="border-2 border-[#080808] bg-[#F9F9F5] p-4" style={{ boxShadow: "3px 3px 0 #080808" }}>
                      <p className="text-[10px] font-700 uppercase tracking-[0.14em] text-[#E63946]">✱ Completion Certificate</p>
                      <p className="mt-2 font-700 text-[#080808] text-sm">{cert.course?.title}</p>
                      <p className="mt-1 text-xs font-mono text-[#6B6B65]">{cert.certificateNumber}</p>
                      <p className="mt-1 text-xs text-[#9B9B95]">Issued {formatDate(cert.issuedAt)}</p>
                    </div>
                  ))}
                  {!certificates.length && (
                    <p className="text-sm text-[#9B9B95] text-center py-4">Finish a course to earn your certificate.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
