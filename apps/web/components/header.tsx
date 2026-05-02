import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "./logout-button";

interface HeaderProps {
  user?: { name: string; role: "admin" | "learner" } | null;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#F5F5EF] border-b-2 border-[#080808]">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 lg:px-10">

        {/* Logo — Devlab style: // prefix */}
        <Link href="/" className="flex items-center gap-3 no-underline group">
          <div className="relative h-8 w-8 overflow-hidden shrink-0">
            <Image src="/logo.png" alt="Mi.Tech.Nu" fill className="object-contain" />
          </div>
          <span className="font-mono font-700 text-[#080808] text-sm tracking-tight">
            <span className="text-[#E63946]">// </span>Mi.Tech.Nu
          </span>
        </Link>

        {/* Centre nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/courses" className="nav-link">Courses</Link>
          <Link href="/dashboard" className="nav-link">Dashboard</Link>
          <Link href="/#pricing" className="nav-link">Pricing</Link>
          {user?.role === "admin" && (
            <Link href="/admin" className="nav-link">Admin</Link>
          )}
        </nav>

        {/* Right auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-7 w-7 bg-[#080808] flex items-center justify-center text-white text-xs font-700">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-600 hidden md:block">{user.name}</span>
              </div>
              <LogoutButton />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="nav-link hidden sm:block">Log in ↗</Link>
              <Link href="/signup" className="btn-primary btn-sm">
                Start Free
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
