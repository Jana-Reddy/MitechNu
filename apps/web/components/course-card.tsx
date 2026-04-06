import Image from "next/image";
import Link from "next/link";
import { Pill } from "@academy/ui";
import { formatInr } from "../lib/utils";

interface CourseCardProps {
  course: {
    title: string;
    slug: string;
    excerpt: string;
    coverImage: string;
    level: string;
    durationHours: number;
    priceInr: number;
    lessonCount: number;
    category?: {
      name: string;
    };
  };
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-panel">
      <div className="relative h-56">
        <Image src={course.coverImage} alt={course.title} fill className="object-cover" />
      </div>
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <Pill>{course.category?.name ?? "Tech"}</Pill>
          <span className="text-sm font-semibold text-accent">{formatInr(course.priceInr)}</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-950">{course.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{course.excerpt}</p>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{course.level}</span>
          <span>{course.durationHours}h</span>
          <span>{course.lessonCount} lessons</span>
        </div>
        <Link href={`/courses/${course.slug}`} className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          View course
        </Link>
      </div>
    </article>
  );
}

