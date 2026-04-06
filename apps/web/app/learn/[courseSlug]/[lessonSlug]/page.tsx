import Link from "next/link";
import { redirect } from "next/navigation";
import { SectionShell } from "@academy/ui";
import { getCurrentUser } from "../../../../lib/auth";
import { askTutorAction, saveNoteAction, updateProgressAction } from "../../../../lib/actions";
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

            <div className="mt-6 rounded-[2rem] bg-slate-950 p-6 text-white">
              <div className="flex aspect-video items-center justify-center rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-accent">
                <div className="max-w-md text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-300">Private lesson player</p>
                  <p className="mt-4 text-sm leading-7 text-slate-200">
                    Signed HLS streaming is ready at the API layer. Attach packaged media in MinIO and this player shell can be swapped for a real video element.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] bg-slate-50 p-6">
              <h2 className="text-xl font-bold text-slate-950">Lesson summary</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">{lessonView.lesson.body}</p>
            </div>

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
                  Mark complete
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

            <div className="mt-6 rounded-[2rem] border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-950">Lesson resources</h2>
              <div className="mt-4 space-y-3">
                {lessonView.assets.length ? lessonView.assets.map((asset) => (
                  <div key={asset.id} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {asset.label}
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
              {lessonView.lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/learn/${courseSlug}/${lesson.slug}`}
                  className={`block rounded-2xl px-4 py-3 text-sm ${lesson.id === lessonView.lesson.id ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
                >
                  {lesson.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-950">AI tutor lite</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Ask questions about the current lesson only. This assistant is scoped to the lesson context and course outcomes.
            </p>
            {query.ai ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                AI answer generated. Check the API endpoint response in the runtime store for saved chat history.
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
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-950">Saved notes</h2>
            <div className="mt-4 space-y-3">
              {lessonView.notes.map((note) => (
                <div key={note.id} className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {note.content}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </SectionShell>
  );
}

