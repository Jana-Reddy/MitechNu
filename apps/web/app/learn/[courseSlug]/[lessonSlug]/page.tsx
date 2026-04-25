import Link from "next/link";
import { redirect } from "next/navigation";
import { SectionShell } from "@academy/ui";
import { createSignedMediaToken } from "@academy/media";
import { getCurrentUser } from "../../../../lib/auth";
import { askTutorAction, deleteNoteAction, saveNoteAction, updateNoteAction, updateProgressAction } from "../../../../lib/actions";
import { getLearnerLessonView } from "@academy/db";

export default async function LearnLessonPage({
  params,
  searchParams
}: {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
  searchParams: Promise<{ ai?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { courseSlug, lessonSlug } = await params;
  const query = await searchParams;
  const lessonView = await getLearnerLessonView(user.id, courseSlug, lessonSlug);
  if (!lessonView) {
    redirect("/courses");
  }

  const aiNotice =
    query.ai === "answered"
      ? { tone: "success", message: "AI answer generated and saved to your lesson history below." }
      : query.ai === "rate-limited"
        ? { tone: "error", message: "You have reached the AI tutor limit for this hour. Try again a bit later." }
        : query.ai === "invalid"
          ? { tone: "error", message: "Enter a valid lesson question before sending it to the tutor." }
          : query.ai === "blocked"
            ? { tone: "error", message: "The AI tutor is only available when you can access the lesson." }
            : null;

  const signedVideoUrl = lessonView.lesson.videoKey
    ? `/api/media/stream?token=${encodeURIComponent(createSignedMediaToken(lessonView.lesson.videoKey, user.id))}`
    : null;
  if (lessonView.blocked) {
    return (
      <SectionShell>
        <div className="py-16">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-panel">
            <h1 className="text-3xl font-black text-slate-950">This lesson is locked</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Purchase the course to access the full curriculum. Preview lessons remain open for discovery, but premium lessons require enrollment.
            </p>
            <Link href={`/courses/${courseSlug}`} className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Go back to course
            </Link>
          </div>
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell>
      <div className="grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">{lessonView.course.title}</p>
                <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">{lessonView.lesson.title}</h1>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold capitalize text-slate-600">
                {lessonView.lesson.type}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Course progress</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{lessonView.progressPercent}%</p>
                <p className="mt-1 text-sm text-slate-500">{lessonView.completedLessons}/{lessonView.totalLessons} lessons complete</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current status</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{lessonView.progress?.completed ? "Done" : "In progress"}</p>
                <p className="mt-1 text-sm text-slate-500">{lessonView.lesson.durationMinutes} minute lesson</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Certificate</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{lessonView.certificate?.certificateNumber ?? "Not issued yet"}</p>
                <p className="mt-1 text-sm text-slate-500">Earned automatically at 100% completion</p>
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] bg-slate-950 p-6 text-white">
              <div className="flex aspect-video items-center justify-center rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-accent">
                <div className="max-w-md text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-300">Private lesson player</p>
                  {signedVideoUrl ? (
                    <>
                      <p className="mt-4 text-sm leading-7 text-slate-200">
                        This lesson now issues a signed media URL per learner session. Connect the same endpoint to your MinIO or S3 stream source to serve the protected video.
                      </p>
                      <a href={signedVideoUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-200">
                        Open signed media endpoint
                      </a>
                    </>
                  ) : (
                    <p className="mt-4 text-sm leading-7 text-slate-200">
                      Signed HLS streaming is ready at the API layer. Attach packaged media in MinIO and this player shell can be swapped for a real video element.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] bg-slate-50 p-6">
              <h2 className="text-xl font-bold text-slate-950">Lesson summary</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">{lessonView.lesson.body}</p>
            </div>

            {lessonView.progressPercent === 100 ? (
              <div className="mt-6 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
                <h2 className="text-xl font-bold">Course completed</h2>
                <p className="mt-3 text-sm leading-6">
                  You have completed the full curriculum{lessonView.certificate ? ` and unlocked certificate ${lessonView.certificate.certificateNumber}.` : "."}
                </p>
                {lessonView.certificate ? (
                  <div className="mt-4 rounded-[1.5rem] border border-emerald-200 bg-white/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Certificate ready</p>
                    <p className="mt-2 text-lg font-bold text-slate-950">{lessonView.certificate.certificateNumber}</p>
                    <p className="mt-1 text-sm text-slate-600">Your completion record is now visible from the learner dashboard as well.</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <form action={updateProgressAction} className="rounded-[2rem] border border-slate-200 p-5">
                <input type="hidden" name="courseId" value={lessonView.course.id} />
                <input type="hidden" name="lessonId" value={lessonView.lesson.id} />
                <input type="hidden" name="watchPositionSeconds" value={lessonView.lesson.durationMinutes * 60} />
                <input type="hidden" name="completed" value="true" />
                <input type="hidden" name="returnTo" value={`/learn/${courseSlug}/${lessonSlug}`} />
                <h2 className="text-lg font-bold text-slate-950">Progress</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Mark the lesson complete and keep your course progress synced.
                </p>
                <button className="mt-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                  {lessonView.progress?.completed ? "Completed" : "Mark complete"}
                </button>
              </form>

              <form action={saveNoteAction} className="rounded-[2rem] border border-slate-200 p-5">
                <input type="hidden" name="lessonId" value={lessonView.lesson.id} />
                <input type="hidden" name="returnTo" value={`/learn/${courseSlug}/${lessonSlug}`} />
                <h2 className="text-lg font-bold text-slate-950">Notes</h2>
                <textarea name="content" rows={4} placeholder="Write a quick takeaway or implementation reminder" className="mt-3 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
                <button className="mt-4 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950">
                  Save note
                </button>
              </form>
            </div>

            <div className="mt-6 flex flex-wrap justify-between gap-3 rounded-[2rem] border border-slate-200 p-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Lesson navigation</p>
                <p className="mt-2 text-sm text-slate-600">Move through the curriculum without jumping back to the course page.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {lessonView.previousLessonSlug ? (
                  <Link href={`/learn/${courseSlug}/${lessonView.previousLessonSlug}`} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950">
                    Previous lesson
                  </Link>
                ) : null}
                {lessonView.nextLessonSlug ? (
                  <Link href={`/learn/${courseSlug}/${lessonView.nextLessonSlug}`} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                    Next lesson
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-950">Lesson resources</h2>
              <div className="mt-4 space-y-3">
                {lessonView.assets.length ? lessonView.assets.map((asset: any) => (
                  <div key={asset.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">{asset.label}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{asset.kind}</p>
                    <p className="mt-1 text-xs text-slate-500">{asset.fileKey}</p>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">No downloadable assets attached to this lesson yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-950">Curriculum</h2>
            <div className="mt-4 space-y-3">
              {lessonView.lessons.map((lesson: any) => (
                <Link
                  key={lesson.id}
                  href={`/learn/${courseSlug}/${lesson.slug}`}
                  className={`block rounded-2xl px-4 py-3 text-sm ${lesson.id === lessonView.lesson.id ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
                >
                  {lesson.title}
                </Link>
              ))}
            </div>
            {!lessonView.lessons.length ? (
              <p className="mt-4 text-sm leading-6 text-slate-500">More lessons will show up here as the curriculum expands.</p>
            ) : null}
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-950">AI tutor lite</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Ask questions about the current lesson only. This assistant is scoped to the lesson context and course outcomes.
            </p>
            {aiNotice ? (
              <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                aiNotice.tone === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-red-200 bg-red-50 text-red-700"
              }`}>
                {aiNotice.message}
              </div>
            ) : null}
            <form action={askTutorAction} className="mt-4 space-y-4">
              <input type="hidden" name="courseSlug" value={courseSlug} />
              <input type="hidden" name="lessonSlug" value={lessonSlug} />
              <textarea name="question" rows={5} placeholder="How does this lesson connect to building a real product?" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
              <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Ask tutor
              </button>
            </form>
            <div className="mt-4 space-y-3">
              {lessonView.aiMessages?.length ? lessonView.aiMessages.map((message: any) => (
                <div key={message.id} className={`rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-slate-100 text-slate-700" : "bg-orange-50 text-slate-700"}`}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{message.role === "user" ? "You" : "Tutor"}</p>
                  <p>{message.content}</p>
                </div>
              )) : (
                <p className="text-sm leading-6 text-slate-500">Ask your first question to build a lesson-specific tutor history.</p>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-950">Saved notes</h2>
            <div className="mt-4 space-y-4">
              {lessonView.notes.map((note: any) => (
                <div key={note.id} className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  <form action={updateNoteAction} className="space-y-3">
                    <input type="hidden" name="noteId" value={note.id} />
                    <input type="hidden" name="returnTo" value={`/learn/${courseSlug}/${lessonSlug}`} />
                    <textarea name="content" defaultValue={note.content} rows={4} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-950" />
                    <div className="flex flex-wrap gap-3">
                      <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950">
                        Update note
                      </button>
                    </div>
                  </form>
                  <form action={deleteNoteAction} className="mt-3">
                    <input type="hidden" name="noteId" value={note.id} />
                    <input type="hidden" name="returnTo" value={`/learn/${courseSlug}/${lessonSlug}`} />
                    <button className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:border-red-400 hover:text-red-700">
                      Delete note
                    </button>
                  </form>
                </div>
              ))}
              {!lessonView.notes.length ? (
                <p className="text-sm leading-6 text-slate-500">Save a takeaway and it will appear here for quick revision.</p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </SectionShell>
  );
}


