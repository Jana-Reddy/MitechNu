import Link from "next/link";
import { LogoutButton } from "./logout-button";

interface HeaderProps {
  user?: {
    name: string;
    role: "admin" | "learner";
  } | null;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-slate-950">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sunrise to-accent text-sm font-black text-white">
            MN
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Mi.Tech.Nu</div>
            <div className="text-lg font-bold">Tech Learning Platform</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/courses" className="hover:text-slate-950">Courses</Link>
          <Link href="/dashboard" className="hover:text-slate-950">Dashboard</Link>
          <Link href="/admin" className="hover:text-slate-950">Admin</Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{user.role}</p>
              </div>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950">
                Login
              </Link>
              <Link href="/signup" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Start learning
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
