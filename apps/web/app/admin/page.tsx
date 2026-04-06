import { redirect } from "next/navigation";
import { SectionShell } from "@academy/ui";
import { getAdminOverview, listCategories } from "@academy/db";
import { getCurrentUser } from "../../lib/auth";
import { approvePaymentAction, createCourseAction } from "../../lib/actions";
import { formatInr } from "../../lib/utils";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  const [overview, categories] = await Promise.all([getAdminOverview(), listCategories()]);

  return (
    <SectionShell>
      <div className="space-y-8 py-14">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Admin operations</p>
          <h1 className="mt-3 text-4xl font-black text-slate-950">Academy control room</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Manage catalog publishing, learner payments, and launch metrics from one self-hostable admin experience.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Learners", String(overview.stats.learners)],
            ["Courses", String(overview.stats.courses)],
            ["Pending payments", String(overview.stats.pendingPayments)],
            ["Approved revenue", formatInr(overview.stats.revenueInr)]
          ].map(([label, value]) => (
            <div key={label} className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="space-y-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <h2 className="text-2xl font-bold text-slate-950">Payment approvals</h2>
              <div className="mt-5 space-y-4">
                {overview.orders.map((order) => (
                  <div key={order.id} className="rounded-3xl border border-slate-200 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-950">{order.course?.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{order.user?.email} • {formatInr(order.amountInr)}</p>
                        <p className="mt-1 text-sm text-slate-500">Reference: {order.payment?.reference ?? "Not submitted"}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {order.payment?.status ?? order.status}
                      </span>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <form action={approvePaymentAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="decision" value="approved" />
                        <button className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
                          Approve
                        </button>
                      </form>
                      <form action={approvePaymentAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="decision" value="rejected" />
                        <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950">
                          Reject
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <h2 className="text-2xl font-bold text-slate-950">Catalog snapshot</h2>
              <div className="mt-5 space-y-4">
                {overview.courses.map((course) => (
                  <div key={course.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-950">{course.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{course.slug}</p>
                      </div>
                      <span className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {course.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-950">Create draft course</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Seed the catalog from the admin panel. Drafts can later be expanded with modules, lessons, and assets.
            </p>
            <form action={createCourseAction} className="mt-6 space-y-4">
              <input name="title" placeholder="Course title" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
              <input name="slug" placeholder="course-slug" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
              <textarea name="excerpt" rows={3} placeholder="Short sales summary" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
              <textarea name="description" rows={4} placeholder="Detailed description" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
              <input name="priceInr" type="number" placeholder="4999" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
              <select name="categoryId" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950">
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Save draft
              </button>
            </form>

            <div className="mt-8 rounded-2xl bg-slate-50 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Coupons</h3>
              <div className="mt-3 space-y-2">
                {overview.coupons.map((coupon) => (
                  <div key={coupon.id} className="flex items-center justify-between text-sm text-slate-600">
                    <span>{coupon.code}</span>
                    <span>{coupon.percentageOff}% off</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </SectionShell>
  );
}
