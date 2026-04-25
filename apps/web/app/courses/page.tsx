import { SectionShell } from "@academy/ui";
import { getCatalog } from "@academy/db";
import { CourseCard } from "../../components/course-card";
import { SectionTitle } from "../../components/section-title";

export default async function CoursesPage() {
  const courses = await getCatalog();

  return (
    <div className="pb-20">
      <SectionTitle
        label="Catalog"
        title="All tech courses"
        description="Browse beginner-friendly learning paths built to help learners reach real project and job-readiness milestones."
      />
      <SectionShell>
        <div className="grid gap-6 md:grid-cols-2">
          {courses.map((course: any) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </SectionShell>
    </div>
  );
}

