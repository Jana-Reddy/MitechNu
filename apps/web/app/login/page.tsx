import Image from "next/image";
import Link from "next/link";
import { GoogleAuthButton } from "../../components/google-auth-button";
import { loginAction } from "../../lib/actions";

import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const errorMessage =
    params.error === "google" ? "Google sign-in failed. Check OAuth setup and try again."
    : params.error === "invalid" ? "Invalid email or password. Please try again."
    : params.error === "rate-limited" ? "Too many attempts. Please wait a moment and try again."
    : params.error ? "Authentication failed. Please try again."
    : null;

  return (
    <div className="min-h-[calc(100vh-73px)] grid lg:grid-cols-2">
      {/* Left — dark panel */}
      <div className="hidden lg:flex flex-col justify-between p-14 bg-[#080808] text-white border-r-2 border-[#080808]">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 bg-white/10 p-1">
            <Image src="/logo.png" alt="Mi.Tech.Nu" fill className="object-contain" />
          </div>
          <span className="font-mono font-700 text-sm">
            <span className="text-[#E63946]">// </span>Mi.Tech.Nu
          </span>
        </div>

        {/* Main content */}
        <div className="space-y-8">
          <h1 className="text-5xl font-700 leading-[1.04] tracking-tight">
            Welcome<br/>back to<br/>your journey.
          </h1>
          <p className="text-[#9B9B95] text-base leading-relaxed max-w-sm">
            Your progress, notes, and certificates are waiting. Pick up exactly where you left off.
          </p>
          {/* Feature list */}
          <div className="space-y-4">
            {[
              "Track your progress in real-time",
              "AI-powered study assistant",
              "Earn verified certificates",
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <span className="h-5 w-5 bg-[#E63946] flex items-center justify-center text-white text-[10px] font-700 shrink-0">✓</span>
                <span className="text-sm text-[#9B9B95]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-[#4A4A44]">© 2026 Mi.Tech.Nu. Open-source platform.</p>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-8 sm:p-14 bg-[#F5F5EF]">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-2">
            <div className="relative h-8 w-8"><Image src="/logo.png" alt="Mi.Tech.Nu" fill className="object-contain" /></div>
            <span className="font-mono font-700 text-sm"><span className="text-[#E63946]">// </span>Mi.Tech.Nu</span>
          </div>

          <div>
            <h2 className="text-3xl font-700 text-[#080808] tracking-tight">Sign in</h2>
            <p className="mt-1.5 text-sm text-[#6B6B65]">Use your account or continue with Google.</p>
          </div>

          {errorMessage && (
            <div className="border-2 border-[#E63946] bg-white p-4 text-sm text-[#E63946] font-600 flex items-center gap-2">
              <span className="h-4 w-4 bg-[#E63946] text-white flex items-center justify-center text-[10px] font-700 shrink-0">!</span>
              {errorMessage}
            </div>
          )}

          <form action={loginAction} className="space-y-4">
            <div>
              <label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-2">Email</label>
              <input name="email" type="email" placeholder="you@example.com" className="input-field" required />
            </div>
            <div>
              <label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-2">Password</label>
              <input name="password" type="password" placeholder="••••••••" className="input-field" required />
            </div>
            <button type="submit" className="btn-primary w-full justify-center mt-2">
              Sign In →
            </button>
          </form>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-[#E0E0D8]" />
            <span className="text-xs text-[#6B6B65] font-600 uppercase tracking-widest">or</span>
            <div className="h-px flex-1 bg-[#E0E0D8]" />
          </div>

          <GoogleAuthButton label="Continue with Google" />

          <p className="text-sm text-[#6B6B65]">
            No account?{" "}
            <Link href="/signup" className="font-700 text-[#080808] underline underline-offset-2">Sign up free →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
