import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t-2 border-[#080808] bg-[#F5F5EF]">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        {/* Main footer grid */}
        <div className="grid gap-12 py-16 md:grid-cols-4 border-b-2 border-[#E0E0D8]">
          {/* Brand */}
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative h-8 w-8 shrink-0">
                <Image src="/logo.png" alt="Mi.Tech.Nu" fill className="object-contain" />
              </div>
              <span className="font-mono font-700 text-sm">
                <span className="text-[#E63946]">// </span>Mi.Tech.Nu
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-[#6B6B65] max-w-xs">
              Open-source-first online learning platform for tech education. Learn, build, and grow your career.
            </p>
            <div className="flex gap-3">
              {["GH", "TW", "YT"].map(s => (
                <div key={s} className="h-8 w-8 border-2 border-[#080808] flex items-center justify-center text-[10px] font-700 cursor-pointer hover:bg-[#080808] hover:text-white transition-all">
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            { title: "Platform", links: ["Courses", "Dashboard", "Certificates", "Progress"] },
            { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
            { title: "Support", links: ["Docs", "Community", "Contact", "Status"] },
          ].map(col => (
            <div key={col.title} className="space-y-4">
              <h4 className="text-xs font-700 uppercase tracking-[0.14em] text-[#080808]">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l}>
                    <a href="#" className="text-sm text-[#6B6B65] hover:text-[#080808] transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-5">
          <p className="text-xs text-[#6B6B65]">© 2026 Mi.Tech.Nu. Open-source, built for learners.</p>
          <div className="flex gap-5">
            <a href="#" className="text-xs text-[#6B6B65] hover:text-[#080808]">Privacy</a>
            <a href="#" className="text-xs text-[#6B6B65] hover:text-[#080808]">Terms</a>
            <a href="#" className="text-xs text-[#6B6B65] hover:text-[#080808]">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
