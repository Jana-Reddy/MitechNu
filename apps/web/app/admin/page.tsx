import { redirect } from "next/navigation";
import { SectionShell } from "@academy/ui";
import { getAdminOverview, getCourseBySlug, getPaymentSettings, listCategories } from "@academy/db";
import { getCurrentUser } from "../../lib/auth";
import {
  approvePaymentAction,
  createCourseAction,
  createLessonAction,
  createLessonAssetAction,
  createModuleAction,
  deleteLessonAction,
  deleteModuleAction,
  moveLessonAction,
  moveModuleAction,
  setCourseStatusAction,
  updatePaymentSettingsAction,
  updateCourseAction,
  updateLessonAction,
  updateModuleAction
} from "../../lib/actions";
import { formatDate, formatInr } from "../../lib/utils";

type AdminSearchParams = {
  reviewed?: string;
  courseCreated?: string;
  courseUpdated?: string;
  moduleCreated?: string;
  moduleUpdated?: string;
  moduleReordered?: string;
  moduleDeleted?: string;
  lessonCreated?: string;
  lessonUpdated?: string;
  lessonReordered?: string;
  lessonDeleted?: string;
  assetCreated?: string;
  courseStatus?: string;
  paymentSettingsUpdated?: string;
  error?: string;
};

function getNotice(query: AdminSearchParams) {
  if (query.courseCreated) return { tone: "success", message: "Draft course created successfully." };
  if (query.courseUpdated) return { tone: "success", message: "Course details updated successfully." };
  if (query.courseStatus === "published") return { tone: "success", message: "Course published successfully." };
  if (query.courseStatus === "draft") return { tone: "success", message: "Course moved back to draft." };
  if (query.moduleCreated) return { tone: "success", message: "Module created successfully." };
  if (query.moduleUpdated) return { tone: "success", message: "Module updated successfully." };
  if (query.moduleReordered) return { tone: "success", message: "Module order updated successfully." };
  if (query.moduleDeleted) return { tone: "success", message: "Module deleted successfully." };
  if (query.lessonCreated) return { tone: "success", message: "Lesson created successfully." };
  if (query.lessonUpdated) return { tone: "success", message: "Lesson updated successfully." };
  if (query.lessonReordered) return { tone: "success", message: "Lesson order updated successfully." };
  if (query.lessonDeleted) return { tone: "success", message: "Lesson deleted successfully." };
  if (query.assetCreated) return { tone: "success", message: "Lesson asset added successfully." };
  if (query.paymentSettingsUpdated) return { tone: "success", message: "Payment settings updated successfully." };
  if (query.reviewed) return { tone: "success", message: "Payment review saved." };

  switch (query.error) {
    case "duplicate-slug":
      return { tone: "error", message: "That course slug already exists. Choose a different slug." };
    case "invalid-course":
      return { tone: "error", message: "Please fill in all course fields and use a valid price." };
    case "invalid-course-edit":
      return { tone: "error", message: "Please use valid course values before saving changes." };
    case "course-create":
      return { tone: "error", message: "Course creation failed. Please try again." };
    case "course-update":
      return { tone: "error", message: "Course update failed. Please try again." };
    case "invalid-course-status":
      return { tone: "error", message: "Invalid publish action requested." };
    case "course-status":
      return { tone: "error", message: "Course status update failed. Please try again." };
    case "invalid-module":
      return { tone: "error", message: "Please use a valid module title and description." };
    case "invalid-module-edit":
      return { tone: "error", message: "Please use valid module values before saving changes." };
    case "module-create":
      return { tone: "error", message: "Module creation failed. Please try again." };
    case "module-update":
      return { tone: "error", message: "Module update failed. Please try again." };
    case "invalid-module-order":
      return { tone: "error", message: "Invalid module move request." };
    case "module-order":
      return { tone: "error", message: "Module reorder failed. Please try again." };
    case "invalid-module-delete":
      return { tone: "error", message: "Invalid module delete request." };
    case "module-has-lessons":
      return { tone: "error", message: "Delete the lessons in this module before deleting the module." };
    case "module-delete":
      return { tone: "error", message: "Module deletion failed. Please try again." };
    case "invalid-lesson":
      return { tone: "error", message: "Please use valid lesson details before saving." };
    case "invalid-lesson-edit":
      return { tone: "error", message: "Please use valid lesson values before saving changes." };
    case "duplicate-lesson-slug":
      return { tone: "error", message: "That lesson slug already exists. Choose a different slug." };
    case "lesson-create":
      return { tone: "error", message: "Lesson creation failed. Please try again." };
    case "lesson-update":
      return { tone: "error", message: "Lesson update failed. Please try again." };
    case "invalid-lesson-order":
      return { tone: "error", message: "Invalid lesson move request." };
    case "lesson-order":
      return { tone: "error", message: "Lesson reorder failed. Please try again." };
    case "invalid-lesson-delete":
      return { tone: "error", message: "Invalid lesson delete request." };
    case "lesson-has-activity":
      return { tone: "error", message: "This lesson already has learner activity and cannot be deleted." };
    case "lesson-delete":
      return { tone: "error", message: "Lesson deletion failed. Please try again." };
    case "invalid-asset":
      return { tone: "error", message: "Please use a valid asset label, type, and file key." };
    case "asset-create":
      return { tone: "error", message: "Asset creation failed. Please try again." };
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
  const [overview, categories, paymentSettings] = await Promise.all([getAdminOverview(), listCategories(), getPaymentSettings()]);
  const courseDetails = await Promise.all(
    overview.courses.map(async (course) => {
      const detail = await getCourseBySlug(course.slug);
      return detail ?? { ...course, modules: [] };
    })
  );

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
              <h2 className="text-2xl font-bold text-slate-950">Payment approvals</h2>
              <div className="mt-5 space-y-4">
                {overview.orders.map((order) => (
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
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <h2 className="text-2xl font-bold text-slate-950">Catalog snapshot</h2>
              <div className="mt-5 space-y-4">
                {courseDetails.map((course) => (
                  <div key={course.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-950">{course.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{course.slug}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {course.status}
                        </span>
                        <form action={setCourseStatusAction}>
                          <input type="hidden" name="courseId" value={course.id} />
                          <input type="hidden" name="status" value={course.status === "published" ? "draft" : "published"} />
                          <button className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 hover:border-slate-950 hover:text-slate-950">
                            {course.status === "published" ? "Unpublish" : "Publish"}
                          </button>
                        </form>
                      </div>
                    </div>
                    <form action={updateCourseAction} className="mt-5 grid gap-3">
                      <input type="hidden" name="courseId" value={course.id} />
                      <input name="title" defaultValue={course.title} placeholder="Course title" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                      <input name="slug" defaultValue={course.slug} placeholder="course-slug" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                      <textarea name="excerpt" defaultValue={course.excerpt} rows={2} placeholder="Short sales summary" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                      <textarea name="description" defaultValue={course.description} rows={4} placeholder="Detailed description" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                      <div className="grid gap-3 md:grid-cols-[160px_1fr]">
                        <input name="priceInr" type="number" defaultValue={course.priceInr} placeholder="4999" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                        <select name="categoryId" defaultValue={course.categoryId} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950">
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-end">
                        <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                          Save changes
                        </button>
                      </div>
                    </form>
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Curriculum</h3>
                        <span className="text-xs text-slate-400">{course.modules.length} modules</span>
                      </div>

                      <div className="mt-4 space-y-4">
                        {course.modules.length ? course.modules.map((module, moduleIndex) => (
                          <div key={module.id} className="rounded-2xl border border-slate-200 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <p className="font-semibold text-slate-950">{module.title}</p>
                                <p className="mt-1 text-sm text-slate-500">{module.description}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  {module.lessons.length} lessons
                                </span>
                                <form action={moveModuleAction}>
                                  <input type="hidden" name="moduleId" value={module.id} />
                                  <input type="hidden" name="direction" value="up" />
                                  <button disabled={moduleIndex === 0} className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 hover:border-slate-950 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">
                                    Up
                                  </button>
                                </form>
                                <form action={moveModuleAction}>
                                  <input type="hidden" name="moduleId" value={module.id} />
                                  <input type="hidden" name="direction" value="down" />
                                  <button disabled={moduleIndex === course.modules.length - 1} className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 hover:border-slate-950 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">
                                    Down
                                  </button>
                                </form>
                                <form action={deleteModuleAction}>
                                  <input type="hidden" name="moduleId" value={module.id} />
                                  <button className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-600 hover:border-red-400 hover:text-red-700">
                                    Delete module
                                  </button>
                                </form>
                              </div>
                            </div>

                            <form action={updateModuleAction} className="mt-4 grid gap-3">
                              <input type="hidden" name="moduleId" value={module.id} />
                              <input name="title" defaultValue={module.title} placeholder="Module title" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                              <textarea name="description" defaultValue={module.description} rows={3} placeholder="Module description" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                              <div className="flex justify-end">
                                <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950">
                                  Save module
                                </button>
                              </div>
                            </form>

                            <div className="mt-4 space-y-3">
                              {module.lessons.length ? module.lessons.map((lesson, lessonIndex) => (
                                <div key={lesson.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                      <p className="font-semibold text-slate-900">{lesson.title}</p>
                                      <p className="text-slate-500">{lesson.slug} • {lesson.type} • {lesson.durationMinutes} min {lesson.isPreview ? "• Preview" : ""}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <form action={moveLessonAction}>
                                        <input type="hidden" name="lessonId" value={lesson.id} />
                                        <input type="hidden" name="direction" value="up" />
                                        <button disabled={lessonIndex === 0} className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 hover:border-slate-950 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">
                                          Up
                                        </button>
                                      </form>
                                      <form action={moveLessonAction}>
                                        <input type="hidden" name="lessonId" value={lesson.id} />
                                        <input type="hidden" name="direction" value="down" />
                                        <button disabled={lessonIndex === module.lessons.length - 1} className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 hover:border-slate-950 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">
                                          Down
                                        </button>
                                      </form>
                                      <form action={deleteLessonAction}>
                                        <input type="hidden" name="lessonId" value={lesson.id} />
                                        <button className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-600 hover:border-red-400 hover:text-red-700">
                                          Delete lesson
                                        </button>
                                      </form>
                                    </div>
                                  </div>

                                  <form action={updateLessonAction} className="mt-4 grid gap-3">
                                    <input type="hidden" name="lessonId" value={lesson.id} />
                                    <div className="grid gap-3 md:grid-cols-2">
                                      <input name="title" defaultValue={lesson.title} placeholder="Lesson title" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                                      <input name="slug" defaultValue={lesson.slug} placeholder="lesson-slug" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-[140px_140px_1fr]">
                                      <select name="type" defaultValue={lesson.type} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950">
                                        <option value="article">Article</option>
                                        <option value="video">Video</option>
                                        <option value="quiz">Quiz</option>
                                        <option value="resource">Resource</option>
                                      </select>
                                      <input name="durationMinutes" type="number" min="1" defaultValue={lesson.durationMinutes} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                                      <input name="videoKey" defaultValue={lesson.videoKey ?? ""} placeholder="Optional video key" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                                    </div>
                                    <label className="flex items-center gap-3 text-sm text-slate-600">
                                      <input type="checkbox" name="isPreview" value="true" defaultChecked={lesson.isPreview} className="h-4 w-4 rounded border-slate-300" />
                                      Preview lesson
                                    </label>
                                    <textarea name="body" defaultValue={lesson.body} rows={4} placeholder="Lesson body or summary" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                                    <div className="flex justify-end">
                                      <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950">
                                        Save lesson
                                      </button>
                                    </div>
                                  </form>

                                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                                    <div className="flex items-center justify-between gap-3">
                                      <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Lesson assets</h4>
                                      <span className="text-xs text-slate-400">{lesson.assets?.length ?? 0} items</span>
                                    </div>
                                    <div className="mt-3 space-y-2">
                                      {lesson.assets?.length ? lesson.assets.map((asset) => (
                                        <div key={asset.id} className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                          <span className="font-semibold text-slate-800">{asset.label}</span> • <span>{asset.kind}</span> • <span>{asset.fileKey}</span>
                                        </div>
                                      )) : (
                                        <p className="text-xs text-slate-500">No assets attached yet.</p>
                                      )}
                                    </div>
                                    <form action={createLessonAssetAction} className="mt-4 grid gap-3">
                                      <input type="hidden" name="lessonId" value={lesson.id} />
                                      <div className="grid gap-3 md:grid-cols-2">
                                        <input name="label" placeholder="Asset label" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                                        <select name="kind" defaultValue="attachment" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950">
                                          <option value="attachment">Attachment</option>
                                          <option value="slide">Slide</option>
                                          <option value="project">Project</option>
                                        </select>
                                      </div>
                                      <input name="fileKey" placeholder="storage/path/file.pdf" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                                      <div className="flex justify-end">
                                        <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950">
                                          Add asset
                                        </button>
                                      </div>
                                    </form>
                                  </div>
                                </div>
                              )) : (
                                <p className="text-sm text-slate-500">No lessons in this module yet.</p>
                              )}
                            </div>

                            <form action={createLessonAction} className="mt-4 grid gap-3">
                              <input type="hidden" name="moduleId" value={module.id} />
                              <div className="grid gap-3 md:grid-cols-2">
                                <input name="title" placeholder="Lesson title" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                                <input name="slug" placeholder="lesson-slug" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                              </div>
                              <div className="grid gap-3 md:grid-cols-[140px_140px_1fr]">
                                <select name="type" defaultValue="article" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950">
                                  <option value="article">Article</option>
                                  <option value="video">Video</option>
                                  <option value="quiz">Quiz</option>
                                  <option value="resource">Resource</option>
                                </select>
                                <input name="durationMinutes" type="number" min="1" placeholder="15" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                                <input name="videoKey" placeholder="Optional video key" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                              </div>
                              <label className="flex items-center gap-3 text-sm text-slate-600">
                                <input type="checkbox" name="isPreview" value="true" className="h-4 w-4 rounded border-slate-300" />
                                Preview lesson
                              </label>
                              <textarea name="body" rows={4} placeholder="Lesson body or summary" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                              <div className="flex justify-end">
                                <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950">
                                  Add lesson
                                </button>
                              </div>
                            </form>
                          </div>
                        )) : (
                          <p className="text-sm text-slate-500">No modules yet. Create the first module below.</p>
                        )}
                      </div>

                      <form action={createModuleAction} className="mt-5 grid gap-3 border-t border-slate-200 pt-5">
                        <input type="hidden" name="courseId" value={course.id} />
                        <input name="title" placeholder="Module title" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                        <textarea name="description" rows={3} placeholder="Module description" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
                        <div className="flex justify-end">
                          <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-slate-300 hover:ring-slate-950">
                            Add module
                          </button>
                        </div>
                      </form>
                    </div>
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
