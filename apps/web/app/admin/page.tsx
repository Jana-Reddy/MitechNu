import { redirect } from "next/navigation";
import { SectionShell } from "@academy/ui";
import { getAdminOverview, getPaymentSettings, listCategories } from "@academy/db";
import { getCurrentUser } from "../../lib/auth";
import {
  approvePaymentAction,
  createCourseAction,
  deleteCourseAction,
  setCourseStatusAction,
  updateCourseAction,
  updatePaymentSettingsAction
} from "../../lib/actions";
import { formatDate, formatInr } from "../../lib/utils";
import { PaymentFilter } from "../../components/payment-filter";

export interface AdminSearchParams {
  courseCreated?: string;
  courseDeleted?: string;
  courseUpdated?: string;
  paymentSettingsUpdated?: string;
  reviewed?: string;
  error?: string;
  paymentFilter?: string;
  paymentPage?: string;
}

function getNotice(query: AdminSearchParams) {
  if (query.courseCreated) return { tone: "success", message: "Course created successfully." };
  if (query.courseDeleted) return { tone: "success", message: "Course deleted successfully." };
  if (query.courseUpdated) return { tone: "success", message: "Course updated successfully." };
  if (query.paymentSettingsUpdated) return { tone: "success", message: "Payment settings updated successfully." };
  if (query.reviewed) return { tone: "success", message: "Payment review saved." };

  switch (query.error) {
    case "duplicate-slug":
      return { tone: "error", message: "That course slug already exists. Choose a different slug." };
    case "invalid-course":
      return { tone: "error", message: "Please fill in all course fields and use a valid price." };
    case "course-create":
      return { tone: "error", message: "Course creation failed. Please try again." };
    case "invalid-course-delete":
      return { tone: "error", message: "Invalid course deletion request." };
    case "course-has-enrollments":
      return { tone: "error", message: "Cannot delete course with active enrollments." };
    case "course-not-found":
      return { tone: "error", message: "Course not found in database." };
    case "course-delete":
      return { tone: "error", message: "Course deletion failed. Please try again." };
    case "invalid-pdf-link":
      return { tone: "error", message: "Please use a valid Google Drive URL for the PDF link." };
    case "invalid-payment-settings":
      return { tone: "error", message: "Please use a valid UPI ID, payee name, QR image URL, and note." };
    case "payment-settings":
      return { tone: "error", message: "Payment settings could not be saved. Run the latest DB schema update if needed." };
    default:
      return null;
  }
}

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login");
  }

  const query = await searchParams;
  const [overview, paymentSettings, categories] = await Promise.all([getAdminOverview(), getPaymentSettings(), listCategories()]);

  const notice = getNotice(query);

  return (
    <SectionShell>
      <div className="space-y-8 py-14">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Admin operations</p>
          <h1 className="mt-3 text-4xl font-black text-slate-950">Academy control room</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Manage catalog publishing, learner payments, and launch metrics from one self-hostable admin experience.
          </p>
          {notice ? (
            <div className={`mt-6 rounded-2xl px-4 py-3 text-sm ${
              notice.tone === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}>
              {notice.message}
            </div>
          ) : null}
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
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-950">Payment approvals</h2>
                <PaymentFilter />
              </div>
              <div className="mt-5 space-y-4">
                {(() => {
                  const ITEMS_PER_PAGE = 10;
                  const currentPage = parseInt(query.paymentPage || "1", 10);
                  const filteredOrders = overview.orders.filter((order) => {
                    const status = order.payment?.status ?? order.status;
                    if (!query.paymentFilter || query.paymentFilter === "all") return true;
                    return status === query.paymentFilter;
                  });
                  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
                  const paginatedOrders = filteredOrders.slice(
                    (currentPage - 1) * ITEMS_PER_PAGE,
                    currentPage * ITEMS_PER_PAGE
                  );

                  return (
                    <>
                      {paginatedOrders.map((order) => (
                        <div key={order.id} className="rounded-3xl border border-slate-200 p-5">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-bold text-slate-950">{order.course?.title}</h3>
                              <p className="mt-1 text-sm text-slate-500">{order.user?.email} • {formatInr(order.amountInr)}</p>
                              <p className="mt-1 text-sm text-slate-500">Reference: {order.payment?.reference ?? "Not submitted"}</p>
                              {order.payment?.notes ? (
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Learner note: {order.payment.notes}</p>
                              ) : null}
                              {order.payment?.reviewedAt ? (
                                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">Reviewed {formatDate(order.payment.reviewedAt)}</p>
                              ) : null}
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              {order.payment?.status ?? order.status}
                            </span>
                          </div>
                          {order.payment?.screenshotUrl ? (
                            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Uploaded proof</p>
                              <img src={order.payment.screenshotUrl} alt="Payment proof screenshot" className="mt-3 max-h-72 w-full rounded-2xl border border-slate-200 bg-white object-contain" />
                            </div>
                          ) : null}
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
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => {
                                const params = new URLSearchParams();
                                Object.entries(query).forEach(([key, value]) => {
                                  if (value) params.set(key, value);
                                });
                                if (page === 1) {
                                  params.delete("paymentPage");
                                } else {
                                  params.set("paymentPage", page.toString());
                                }
                                window.location.href = `/admin?${params.toString()}`;
                              }}
                              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                page === currentPage
                                  ? "bg-accent text-white"
                                  : "border border-slate-300 text-slate-700 hover:border-slate-950 hover:text-slate-950"
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <h2 className="text-2xl font-bold text-slate-950">Create Course Draft</h2>
              <form action={createCourseAction} className="mt-5 space-y-4">
                <input name="title" placeholder="Course title" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
                <input name="slug" placeholder="course-slug" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
                <textarea name="excerpt" rows={2} placeholder="Short sales summary" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
                <textarea name="description" rows={4} placeholder="Detailed description" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
                <div className="grid gap-4 md:grid-cols-3">
                  <input name="priceInr" type="number" placeholder="Price (INR)" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
                  <input name="durationHours" type="number" placeholder="Duration (hours)" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
                  <select name="categoryId" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950">
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <input name="level" placeholder="Level" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
                  <input name="tags" placeholder="Tech stack (comma separated)" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
                </div>
                <input name="pdfLink" placeholder="Google Drive PDF link (optional)" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
                <div className="flex justify-end">
                  <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                    Create Course
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <h2 className="text-2xl font-bold text-slate-950">Courses</h2>
              <div className="mt-5 space-y-4">
                {overview.courses.map((course) => (
                  <div key={course.id} className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-950">{course.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{course.excerpt}</p>
                        <div className="mt-4 flex flex-wrap gap-3 text-sm">
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">{course.level}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">{course.durationHours}h duration</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">{formatInr(course.priceInr)}</span>
                        </div>
                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tech Stack</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {course.tags?.map((tag) => (
                              <span key={tag} className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs text-slate-600">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                          course.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {course.status}
                        </span>
                        <div className="flex gap-2">
                          <form action={setCourseStatusAction} className="inline">
                            <input type="hidden" name="courseId" value={course.id} />
                            <input type="hidden" name="status" value={course.status === "published" ? "draft" : "published"} />
                            <button className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 hover:border-slate-950 hover:text-slate-950">
                              {course.status === "published" ? "Unpublish" : "Publish"}
                            </button>
                          </form>
                          <form action={deleteCourseAction} className="inline">
                            <input type="hidden" name="courseId" value={course.id} />
                            <button disabled={course.status === "published"} className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${
                              course.status === "published"
                                ? "border-slate-200 text-slate-400 cursor-not-allowed"
                                : "border-red-200 text-red-600 hover:border-red-400 hover:text-red-700"
                            }`}>
                              Delete
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                    {course.status === "published" ? (
                      <div className="mt-4 pt-4 border-t border-slate-200 rounded-2xl bg-amber-50 p-4">
                        <p className="text-sm font-semibold text-amber-800">Published course locked</p>
                        <p className="mt-1 text-sm text-amber-700">Unpublish this course first to make edits.</p>
                      </div>
                    ) : (
                      <form action={updateCourseAction} className="mt-4 pt-4 border-t border-slate-200 grid gap-3">
                        <input type="hidden" name="courseId" value={course.id} />
                        <div className="grid gap-3 md:grid-cols-2">
                          <input name="title" defaultValue={course.title} placeholder="Course title" className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-950" />
                          <input name="slug" defaultValue={course.slug} placeholder="course-slug" className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-950" />
                        </div>
                        <textarea name="excerpt" defaultValue={course.excerpt} rows={2} placeholder="Short sales summary" className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-950" />
                        <textarea name="description" defaultValue={course.description} rows={3} placeholder="Detailed description" className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-950" />
                        <div className="grid gap-3 md:grid-cols-3">
                          <input name="priceInr" type="number" defaultValue={course.priceInr} placeholder="Price (INR)" className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-950" />
                          <input name="durationHours" type="number" defaultValue={course.durationHours} placeholder="Duration (hours)" className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-950" />
                          <select name="categoryId" defaultValue={course.categoryId} className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-950">
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <input name="level" defaultValue={course.level} placeholder="Level" className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-950" />
                          <input name="tags" defaultValue={course.tags?.join(", ")} placeholder="Tech stack (comma separated)" className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-950" />
                        </div>
                        <input name="pdfLink" defaultValue={course.pdfLink ?? ""} placeholder="Google Drive PDF link (optional)" className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-950" />
                        <div className="flex justify-end">
                          <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                            Update Course
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-xl font-bold text-slate-950">UPI payment settings</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Update the checkout UPI ID, payee name, QR image URL, and payment note directly from admin.
              </p>
              <form action={updatePaymentSettingsAction} className="mt-5 space-y-4">
                <input
                  name="upiId"
                  defaultValue={paymentSettings?.upiId ?? ""}
                  placeholder="academy@upi"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950"
                />
                <input
                  name="payeeName"
                  defaultValue={paymentSettings?.payeeName ?? ""}
                  placeholder="Mi.Tech.Nu Courses"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950"
                />
                <input
                  name="qrCodeUrl"
                  defaultValue={paymentSettings?.qrCodeUrl ?? ""}
                  placeholder="https://your-cdn.example.com/upi-qr.png"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950"
                />
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4">
                  <label className="block text-sm font-semibold text-slate-700">Upload QR image</label>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    PNG, JPG, WEBP, or SVG up to 1 MB. If you upload a file here, it overrides the QR URL above.
                  </p>
                  <input
                    name="qrCodeFile"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="mt-3 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-slate-800"
                  />
                </div>
                {paymentSettings?.qrCodeUrl ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-700">Current QR preview</p>
                    <img src={paymentSettings.qrCodeUrl} alt="Current payment QR" className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 object-contain" />
                  </div>
                ) : null}
                <textarea
                  name="note"
                  rows={3}
                  defaultValue={paymentSettings?.note ?? ""}
                  placeholder="Optional message shown to learners on checkout"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950"
                />
                <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                  Save payment settings
                </button>
              </form>
            </div>

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
