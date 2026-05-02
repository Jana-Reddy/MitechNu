import Image from "next/image";
import Link from "next/link";
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
    category?: { name: string };
  };
}

const levelColors: Record<string, string> = {
  beginner: "badge-teal",
  intermediate: "badge-amber",
  advanced: "badge-red",
};

export function CourseCard({ course }: CourseCardProps) {
  const lvlClass = levelColors[course.level?.toLowerCase()] ?? "badge-black";

  return (
    <article className="card-float group flex flex-col">
      {/* Cover */}
      <div className="relative h-44 overflow-hidden border-b-2 border-[#080808]">
        <Image
          src={course.coverImage}
          alt={course.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-[#080808]/10 group-hover:bg-[#080808]/0 transition-all" />
        <div className="absolute top-3 left-3">
          <span className="badge badge-black text-[10px]">{course.category?.name ?? "Tech"}</span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="badge badge-red text-[10px]">{formatInr(course.priceInr)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 space-y-4 bg-white">
        <div className="flex-1">
          <h3 className="font-700 text-[#080808] text-base leading-snug line-clamp-2">
            {course.title}
          </h3>
          <p className="mt-2 text-sm text-[#6B6B65] leading-relaxed line-clamp-2">{course.excerpt}</p>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E0E0D8]">
          <span className={`badge ${lvlClass}`}>{course.level}</span>
          <span className="badge badge-muted">{course.durationHours}h</span>
          <span className="badge badge-muted">{course.lessonCount} lessons</span>
        </div>

        <Link
          href={`/courses/${course.slug}`}
          className="btn-primary btn-sm text-center w-full justify-center"
        >
          View Course →
        </Link>
      </div>
    </article>
  );
}
