import Image from "next/image";
import Link from "next/link";
import { getFeaturedCatalog } from "@academy/db";
import { CourseCard } from "../components/course-card";

export default async function HomePage() {
  const featuredCourses = await getFeaturedCatalog();

  return (
    <div>
      {/* ── HERO ── */}
      <section className="border-b-2 border-[#080808]">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid lg:grid-cols-2 min-h-[580px]">

            {/* Left panel */}
            <div className="flex flex-col justify-between p-8 lg:p-14 border-r-0 lg:border-r-2 lg:border-[#080808]">
              <div className="space-y-8">
                {/* Sparkle + headline */}
                <div className="flex items-start gap-4">
                  <svg className="h-8 w-8 mt-2 shrink-0 text-[#080808]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l1.5 6.5L20 12l-6.5 1.5L12 20l-1.5-6.5L4 12l6.5-1.5z"/>
                  </svg>
                  <h1 className="text-5xl lg:text-6xl font-700 leading-[1.04] tracking-tight text-[#080808]">
                    Learn tech<br/>the way real<br/>products<br/>are built.
                  </h1>
                </div>

                <p className="text-base leading-relaxed text-[#6B6B65] max-w-sm">
                  Explore structured full-stack, AI, and software career tracks with AI-assisted lessons, real-world projects, and verifiable certificates.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <Link href="/courses" className="btn-primary">
                    Learn Now
                  </Link>
                  <Link href="/signup" className="btn-outline flex items-center gap-2">
                    <span className="h-7 w-7 bg-[#080808] rounded-full flex items-center justify-center">
                      <svg className="h-3 w-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                      </svg>
                    </span>
                    Watch Demo
                  </Link>
                </div>

                {/* Badge */}
                <div className="flex items-start gap-2 text-sm text-[#6B6B65]">
                  <span className="text-[#E63946] font-700 text-base mt-0.5">✱</span>
                  <span>Free start and job-ready outcomes for all learners</span>
                </div>
              </div>
            </div>

            {/* Right panel — illustration */}
            <div className="relative bg-white overflow-hidden flex items-center justify-center min-h-[320px] lg:min-h-0">
              <Image
                src="/hero-illustration.png"
                alt="Geometric illustration"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* ── Testimonials ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 border-t-2 border-[#080808]">
            {[
              { text: "This platform completely changed how I learn programming. The AI tutor is incredible.", author: "Priya M.", role: "SDE I" },
              { text: "The structured curriculum helped me transition from QA to Full Stack in 6 months.", author: "Rahul K.", role: "Full Stack Dev" },
              { text: "Best tech education platform. The courses are exactly what industry demands.", author: "Anita S.", role: "Backend Engineer" },
            ].map((testimonial, i) => (
              <div
                key={i}
                className={`flex flex-col justify-between p-6 ${i < 2 ? "border-b-2 sm:border-b-0 sm:border-r-2 border-[#080808]" : ""}`}
              >
                <p className="text-sm text-[#080808] italic mb-4">"{testimonial.text}"</p>
                <div>
                  <p className="text-sm font-700 text-[#080808]">{testimonial.author}</p>
                  <p className="text-xs text-[#6B6B65]">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="border-b-2 border-[#080808]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <p className="section-tag mb-3">
                <span className="h-1.5 w-1.5 bg-[#E63946] inline-block rounded-full" />
                Why Mi.Tech.Nu
              </p>
              <h2 className="text-4xl lg:text-5xl font-700 tracking-tight text-[#080808] leading-[1.05]">
                Everything you need<br/>to learn and grow
              </h2>
            </div>
            <Link href="/courses" className="btn-outline btn-sm shrink-0">See all courses →</Link>
          </div>

          <div className="grid gap-0 md:grid-cols-3 border-2 border-[#080808]">
            {[
              {
                num: "01", title: "Structured Curriculum",
                desc: "Carefully sequenced modules from foundation to production-ready skills, designed by working engineers.",
                color: "bg-white"
              },
              {
                num: "02", title: "AI Study Tutor",
                desc: "Get context-aware help as you work through lessons. Powered by Ollama — private, fast, and reliable.",
                color: "bg-[#E63946]", light: true
              },
              {
                num: "03", title: "Verified Certificates",
                desc: "Earn certificates on completion. Shareable, unique, and verified by admin sign-off.",
                color: "bg-white"
              },
              {
                num: "04", title: "Progress Tracking",
                desc: "Visual progress bars, resume links, lesson notes, and dashboard analytics keep you on track.",
                color: "bg-[#5BADAF]", light: true
              },
              {
                num: "05", title: "Flexible Payments",
                desc: "Manual UPI payment flow, coupon codes (LAUNCH20), and admin-approved access control.",
                color: "bg-white"
              },
              {
                num: "06", title: "Self-Hosted & Open",
                desc: "Deploy on your own infra with Docker Compose. No vendor lock-in, 100% open-source.",
                color: "bg-[#080808]", light: true
              },
            ].map((f, i) => (
              <div
                key={f.num}
                className={`${f.color} p-8 border-b-2 border-r-2 border-[#080808] group cursor-default`}
                style={{ borderRight: (i + 1) % 3 === 0 ? "none" : "", borderBottom: i >= 3 ? "none" : "" }}
              >
                <p className={`font-mono text-xs font-700 mb-6 ${f.light ? "opacity-60 text-white" : "text-[#C8C8C0]"}`}>{f.num}</p>
                <h3 className={`text-xl font-700 mb-3 ${f.light ? "text-white" : "text-[#080808]"}`}>{f.title}</h3>
                <p className={`text-sm leading-relaxed ${f.light ? "text-white/80" : "text-[#6B6B65]"}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED COURSES ── */}
      {featuredCourses.length > 0 && (
        <section className="border-b-2 border-[#080808]">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="section-tag mb-3">
                  <span className="h-1.5 w-1.5 bg-[#E63946] inline-block rounded-full" />
                  Featured
                </p>
                <h2 className="text-4xl font-700 text-[#080808] tracking-tight">Top Courses</h2>
              </div>
              <Link href="/courses" className="btn-outline btn-sm">View All →</Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredCourses.map((course: any) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA BANNER ── */}
      <section id="pricing" className="bg-[#080808] border-b-2 border-[#080808]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <p className="section-tag text-[#E63946]">
                <span className="h-1.5 w-1.5 bg-[#E63946] inline-block rounded-full" />
                Get Started Today
              </p>
              <h2 className="text-4xl lg:text-5xl font-700 text-white tracking-tight leading-[1.05]">
                Ready to level up<br/>your tech career?
              </h2>
              <p className="text-[#9B9B95] text-base leading-relaxed max-w-md">
                Join thousands of learners building real skills with structured courses, AI assistance, and verifiable certificates. Use coupon <span className="font-mono font-700 text-white bg-[#E63946] px-1">LAUNCH20</span> for 20% off.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/signup" className="btn-primary" style={{ background: "#E63946", borderColor: "#E63946" }}>
                  Start Learning Free ↗
                </Link>
                <Link href="/courses" className="btn-outline" style={{ borderColor: "#6B6B65", color: "#fff" }}>
                  Browse Courses
                </Link>
              </div>
            </div>

            <div className="border-2 border-[#2A2A2A] bg-[#141414] p-8 space-y-6">
              <h3 className="text-white font-700 text-xl">What's included</h3>
              {[
                "Lifetime course access",
                "AI-powered study tutor (Ollama)",
                "Progress tracking & lesson notes",
                "Admin-verified completion certificate",
                "Manual UPI payment with coupon support",
                "Self-hostable — open-source codebase",
              ].map(item => (
                <div key={item} className="flex items-center gap-3 text-sm text-[#9B9B95]">
                  <span className="h-4 w-4 bg-[#E63946] flex items-center justify-center shrink-0 text-white text-[10px] font-700">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
