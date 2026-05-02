import { redirect } from "next/navigation";
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
  courseCreated?: string; courseDeleted?: string; courseUpdated?: string;
  paymentSettingsUpdated?: string; reviewed?: string; error?: string;
  paymentFilter?: string; paymentPage?: string;
}

function getNotice(q: AdminSearchParams) {
  if (q.courseCreated) return { ok: true, msg: "Course created." };
  if (q.courseDeleted) return { ok: true, msg: "Course deleted." };
  if (q.courseUpdated) return { ok: true, msg: "Course updated." };
  if (q.paymentSettingsUpdated) return { ok: true, msg: "Payment settings saved." };
  if (q.reviewed) return { ok: true, msg: "Payment review saved." };
  const errors: Record<string, string> = {
    "duplicate-slug": "That slug already exists.",
    "invalid-course": "Fill in all required course fields.",
    "course-create": "Course creation failed.",
    "invalid-course-delete": "Invalid delete request.",
    "course-has-enrollments": "Cannot delete course with active enrollments.",
    "course-not-found": "Course not found.",
    "course-delete": "Deletion failed.",
    "invalid-pdf-link": "Use a valid Google Drive URL for the PDF.",
    "invalid-payment-settings": "Invalid payment settings.",
    "payment-settings": "Payment settings could not be saved.",
  };
  if (q.error && errors[q.error]) return { ok: false, msg: errors[q.error] };
  return null;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<AdminSearchParams> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const query = await searchParams;
  const [overview, paymentSettings, categories] = await Promise.all([
    getAdminOverview(), getPaymentSettings(), listCategories()
  ]);
  const notice = getNotice(query);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="border-b-2 border-[#080808] bg-white">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-12">
          <p className="section-tag mb-3"><span className="h-1.5 w-1.5 bg-[#E63946] inline-block rounded-full" />Admin Operations</p>
          <h1 className="text-4xl lg:text-5xl font-700 tracking-tight text-[#080808]">Control Room</h1>
          <p className="mt-2 text-[#6B6B65] text-base max-w-xl leading-relaxed">
            Manage catalog publishing, review learner payments, and monitor platform metrics.
          </p>
          {notice && (
            <div className={`mt-5 inline-flex items-center gap-2 border-2 px-5 py-2.5 text-sm font-700 ${
              notice.ok ? "border-[#5BADAF] bg-[#F0FAFA] text-[#2B7A7A]" : "border-[#E63946] bg-white text-[#E63946]"
            }`}>
              <span>{notice.ok ? "✓" : "✕"}</span> {notice.msg}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-10 space-y-8">
        {/* Stat cards */}
        <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4 border-2 border-[#080808]">
          {[
            { label: "Learners", value: String(overview.stats.learners), bg: "bg-white" },
            { label: "Courses", value: String(overview.stats.courses), bg: "bg-[#F5F5EF]" },
            { label: "Pending Payments", value: String(overview.stats.pendingPayments), bg: "bg-[#E63946]", light: true },
            { label: "Approved Revenue", value: formatInr(overview.stats.revenueInr), bg: "bg-[#080808]", light: true },
          ].map((s, i) => (
            <div key={s.label} className={`${s.bg} p-8 ${i < 3 ? "border-r-2 border-[#080808]" : ""}`}>
              <p className={`text-xs font-700 uppercase tracking-widest mb-3 ${s.light ? "text-white/60" : "text-[#9B9B95]"}`}>{s.label}</p>
              <p className={`text-4xl font-700 ${s.light ? "text-white" : "text-[#080808]"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            {/* Payment approvals */}
            <div className="card bg-white p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-700 text-[#080808]">Payment Approvals</h2>
                <PaymentFilter />
              </div>
              <div className="space-y-4">
                {(() => {
                  const PER_PAGE = 10;
                  const page = parseInt(query.paymentPage || "1", 10);
                  const filtered = overview.orders.filter((o: any) => {
                    const s = o.payment?.status ?? o.status;
                    if (!query.paymentFilter || query.paymentFilter === "all") return true;
                    return s === query.paymentFilter;
                  });
                  const pages = Math.ceil(filtered.length / PER_PAGE);
                  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

                  return (
                    <>
                      {paginated.map((order: any) => {
                        const s = order.payment?.status ?? order.status;
                        return (
                          <div key={order.id} className="border border-[#E0E0D8] bg-[#F9F9F5] p-5 hover:border-[#080808] transition-colors">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex-1">
                                <h3 className="font-700 text-[#080808]">{order.course?.title}</h3>
                                <p className="text-sm text-[#6B6B65] mt-1">{order.user?.email} • {formatInr(order.amountInr)}</p>
                                <p className="text-sm text-[#6B6B65] mt-0.5">Ref: <span className="font-700 text-[#080808]">{order.payment?.reference ?? "Not submitted"}</span></p>
                                {order.payment?.notes && <p className="text-sm text-[#6B6B65] mt-1.5">Note: {order.payment.notes}</p>}
                                {order.payment?.reviewedAt && <p className="text-xs text-[#9B9B95] mt-1">Reviewed {formatDate(order.payment.reviewedAt)}</p>}
                              </div>
                              <span className={`badge shrink-0 ${s === "approved" ? "badge-teal" : s === "rejected" ? "badge-red" : "badge-muted"}`}>{s}</span>
                            </div>
                            {order.payment?.screenshotUrl && (
                              <div className="mt-4 border border-[#E0E0D8] p-3">
                                <p className="text-xs font-700 uppercase tracking-widest text-[#9B9B95] mb-2">Payment Proof</p>
                                <img src={order.payment.screenshotUrl} alt="Payment proof" className="max-h-56 w-full object-contain" />
                              </div>
                            )}
                            {(s === "proof_submitted" || s === "pending") ? (
                              <div className="mt-4 flex gap-2.5">
                                <form action={approvePaymentAction}>
                                  <input type="hidden" name="orderId" value={order.id} />
                                  <input type="hidden" name="decision" value="approved" />
                                  <button className="btn-primary btn-sm" style={{ background: "#5BADAF", borderColor: "#5BADAF" }}>Approve</button>
                                </form>
                                <form action={approvePaymentAction}>
                                  <input type="hidden" name="orderId" value={order.id} />
                                  <input type="hidden" name="decision" value="rejected" />
                                  <button className="btn-outline btn-sm">Reject</button>
                                </form>
                              </div>
                            ) : (
                              <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-700 ${s === "approved" ? "text-[#2B7A7A] bg-[#F0FAFA]" : "text-[#E63946] bg-[#FFF5F5]"}`}>
                                {s === "approved" ? "✓ Approved — learner has been enrolled" : "✕ Rejected"}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {!paginated.length && (
                        <div className="border-2 border-dashed border-[#E0E0D8] p-8 text-center text-sm text-[#9B9B95]">No orders match the current filter.</div>
                      )}
                      {pages > 1 && (
                        <div className="flex gap-2 pt-2">
                          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => { const params = new URLSearchParams(); Object.entries(query).forEach(([k, v]) => { if (v) params.set(k, v); }); if (p === 1) params.delete("paymentPage"); else params.set("paymentPage", p.toString()); window.location.href = `/admin?${params.toString()}`; }}
                              className={p === page ? "btn-primary btn-sm" : "btn-outline btn-sm"}>{p}</button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Create course */}
            <div className="card bg-white p-6">
              <h2 className="text-xl font-700 text-[#080808] mb-5">Create Course Draft</h2>
              <form action={createCourseAction} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div><label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-2">Course Title</label><input name="title" placeholder="Spring Boot Mastery" className="input-field text-sm" /></div>
                  <div><label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-2">URL Slug</label><input name="slug" placeholder="spring-boot-mastery" className="input-field text-sm" /></div>
                </div>
                <div><label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-2">Short Excerpt</label><textarea name="excerpt" rows={2} placeholder="One-line sales summary..." className="input-field text-sm resize-none" /></div>
                <div><label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-2">Full Description</label><textarea name="description" rows={3} placeholder="Detailed course description..." className="input-field text-sm resize-none" /></div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div><label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-2">Price (INR)</label><input name="priceInr" type="number" placeholder="2999" className="input-field text-sm" /></div>
                  <div><label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-2">Duration (hrs)</label><input name="durationHours" type="number" placeholder="20" className="input-field text-sm" /></div>
                  <div><label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-2">Category</label>
                    <select name="categoryId" className="input-field text-sm"><option value="">Select...</option>{categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div><label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-2">Level</label><input name="level" placeholder="Beginner / Intermediate / Advanced" className="input-field text-sm" /></div>
                  <div><label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-2">Tech Stack</label><input name="tags" placeholder="Java, Spring Boot, Docker" className="input-field text-sm" /></div>
                </div>
                <div><label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-2">PDF Link (optional)</label><input name="pdfLink" placeholder="Google Drive URL" className="input-field text-sm" /></div>
                <div className="flex justify-end"><button className="btn-primary btn-sm">Create Course →</button></div>
              </form>
            </div>

            {/* Course list */}
            <div className="card bg-white p-6">
              <h2 className="text-xl font-700 text-[#080808] mb-5">All Courses</h2>
              <div className="space-y-4">
                {overview.courses.map((course: any) => (
                  <div key={course.id} className="border border-[#E0E0D8] p-5 hover:border-[#080808] transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="font-700 text-[#080808]">{course.title}</h3>
                        <p className="mt-1.5 text-sm text-[#6B6B65] leading-relaxed">{course.excerpt}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="badge badge-muted">{course.level}</span>
                          <span className="badge badge-muted">{course.durationHours}h</span>
                          <span className="badge badge-black">{formatInr(course.priceInr)}</span>
                        </div>
                        {course.tags?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {course.tags.map((t: string) => <span key={t} className="text-[10px] bg-[#F0F0E8] text-[#6B6B65] px-2 py-0.5 font-mono">{t}</span>)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`badge ${course.status === "published" ? "badge-teal" : "badge-muted"}`}>{course.status}</span>
                        <div className="flex gap-2">
                          <form action={setCourseStatusAction} className="inline">
                            <input type="hidden" name="courseId" value={course.id} />
                            <input type="hidden" name="status" value={course.status === "published" ? "draft" : "published"} />
                            <button className="btn-outline" style={{ fontSize: "0.7rem", padding: "0.3rem 0.75rem" }}>{course.status === "published" ? "Unpublish" : "Publish"}</button>
                          </form>
                          <form action={deleteCourseAction} className="inline">
                            <input type="hidden" name="courseId" value={course.id} />
                            <button disabled={course.status === "published"} className={`badge cursor-pointer ${course.status === "published" ? "badge-muted opacity-40 cursor-not-allowed" : "badge-red hover:opacity-80"}`}>Delete</button>
                          </form>
                        </div>
                      </div>
                    </div>

                    {course.status === "published" ? (
                      <div className="border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 font-600">
                        Published — unpublish first to edit.
                      </div>
                    ) : (
                      <form action={updateCourseAction} className="pt-4 border-t border-[#E0E0D8] space-y-3">
                        <input type="hidden" name="courseId" value={course.id} />
                        <div className="grid gap-3 md:grid-cols-2">
                          <input name="title" defaultValue={course.title} placeholder="Title" className="input-field text-sm" />
                          <input name="slug" defaultValue={course.slug} placeholder="slug" className="input-field text-sm" />
                        </div>
                        <textarea name="excerpt" defaultValue={course.excerpt} rows={2} className="input-field text-sm resize-none" />
                        <textarea name="description" defaultValue={course.description} rows={3} className="input-field text-sm resize-none" />
                        <div className="grid gap-3 md:grid-cols-3">
                          <input name="priceInr" type="number" defaultValue={course.priceInr} className="input-field text-sm" />
                          <input name="durationHours" type="number" defaultValue={course.durationHours} className="input-field text-sm" />
                          <select name="categoryId" defaultValue={course.categoryId} className="input-field text-sm">{categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <input name="level" defaultValue={course.level} className="input-field text-sm" />
                          <input name="tags" defaultValue={course.tags?.join(", ")} placeholder="Tags" className="input-field text-sm" />
                        </div>
                        <input name="coverImage" defaultValue={course.coverImage} placeholder="Cover image URL" className="input-field text-sm" />
                        <input name="pdfLink" defaultValue={course.pdfLink ?? ""} placeholder="PDF link" className="input-field text-sm" />
                        <div className="flex justify-end"><button className="btn-primary btn-sm">Update Course →</button></div>
                      </form>
                    )}
                  </div>
                ))}
                {!overview.courses.length && (
                  <div className="border-2 border-dashed border-[#E0E0D8] p-8 text-center text-sm text-[#9B9B95]">No courses yet. Create one above.</div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="card bg-white p-6">
              <h2 className="text-lg font-700 text-[#080808] mb-1">UPI Payment Settings</h2>
              <p className="text-xs text-[#9B9B95] mb-5 leading-relaxed">Update UPI ID, payee name, QR code, and checkout note.</p>
              <form action={updatePaymentSettingsAction} className="space-y-3">
                <div><label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-2">UPI ID</label><input name="upiId" defaultValue={paymentSettings?.upiId ?? ""} placeholder="academy@upi" className="input-field text-sm" /></div>
                <div><label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-2">Payee Name</label><input name="payeeName" defaultValue={paymentSettings?.payeeName ?? ""} placeholder="Mi.Tech.Nu Courses" className="input-field text-sm" /></div>
                <div><label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-2">QR Code URL</label><input name="qrCodeUrl" defaultValue={paymentSettings?.qrCodeUrl ?? ""} placeholder="https://..." className="input-field text-sm" /></div>
                <div className="border-2 border-dashed border-[#E0E0D8] p-4">
                  <label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-1">Upload QR Image</label>
                  <p className="text-[10px] text-[#9B9B95] mb-2">PNG, JPG, WEBP up to 1MB. Overrides URL above.</p>
                  <input name="qrCodeFile" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="block w-full text-xs text-[#6B6B65] file:mr-3 file:border-0 file:bg-[#080808] file:px-3 file:py-1.5 file:font-700 file:text-white file:text-xs cursor-pointer" />
                </div>
                {paymentSettings?.qrCodeUrl && !paymentSettings.qrCodeUrl.includes("example.com") ? (
                  <div className="border border-[#E0E0D8] p-3">
                    <p className="text-xs font-700 uppercase tracking-widest text-[#9B9B95] mb-2">Current QR</p>
                    <img src={paymentSettings.qrCodeUrl} alt="QR" className="w-full object-contain max-h-40" />
                  </div>
                ) : (
                  <div className="border border-dashed border-[#E0E0D8] p-3 text-center text-xs text-[#9B9B95]">
                    No QR code set yet. Paste a URL above or upload an image.
                  </div>
                )}
                <div><label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-2">Payment Note</label><textarea name="note" rows={3} defaultValue={paymentSettings?.note ?? ""} placeholder="Instructions shown on checkout..." className="input-field text-sm resize-none" /></div>
                <button className="btn-primary w-full justify-center btn-sm">Save Payment Settings →</button>
              </form>
            </div>

            <div className="card bg-white p-5">
              <h2 className="text-base font-700 text-[#080808] mb-4">Active Coupons</h2>
              <div className="space-y-2">
                {overview.coupons.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between border border-[#E0E0D8] px-4 py-3">
                    <span className="font-mono font-700 text-[#080808] text-sm">{c.code}</span>
                    <span className="badge badge-red">{c.percentageOff}% off</span>
                  </div>
                ))}
                {!overview.coupons.length && <p className="text-sm text-[#9B9B95] text-center py-3">No active coupons.</p>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
