import Image from "next/image";
import Link from "next/link";
import { GoogleAuthButton } from "../../components/google-auth-button";
import { signupAction } from "../../lib/actions";

import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const errorMessage =
    params.error === "google" ? "Google sign-up failed. Check OAuth setup and try again."
    : params.error === "exists" ? "An account with this email already exists. Try signing in."
    : params.error === "rate-limited" ? "Too many attempts. Please wait a moment and try again."
    : params.error === "invalid" ? "Please provide valid name, email, and password (min 6 characters)."
    : params.error === "failed" ? "Something went wrong. Please try again."
    : null;

  return (
    <div className="min-h-[calc(100vh-73px)] grid lg:grid-cols-2">
      {/* Left — dark panel */}
      <div className="hidden lg:flex flex-col justify-between p-14 bg-[#080808] text-white border-r-2 border-[#080808]">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 bg-white/10 p-1">
            <Image src="/logo.png" alt="Mi.Tech.Nu" fill className="object-contain" />
          </div>
          <span className="font-mono font-700 text-sm">
            <span className="text-[#E63946]">// </span>Mi.Tech.Nu
          </span>
        </div>

        <div className="space-y-8">
          <h1 className="text-5xl font-700 leading-[1.04] tracking-tight">
            Join thousands<br/>of learners<br/>building real<br/>tech skills.
          </h1>
          <p className="text-[#9B9B95] text-base leading-relaxed max-w-sm">
            Start free, learn at your own pace, and earn certificates that matter in the real world.
          </p>

          {/* Testimonial */}
          <div className="border border-[#2A2A2A] bg-[#141414] p-6 space-y-4">
            <p className="text-sm text-[#9B9B95] italic leading-relaxed">
              "This platform completely changed how I learn programming. The structured curriculum helped me transition to Full Stack quickly."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-[#E63946] rounded-full flex items-center justify-center text-white text-xs font-700">R</div>
              <div>
                <p className="text-sm font-700 text-white">Rahul K.</p>
                <p className="text-xs text-[#6B6B65]">Full Stack Dev</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#4A4A44]">© 2026 Mi.Tech.Nu. Open-source & self-hostable.</p>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-8 sm:p-14 bg-[#F5F5EF]">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-2.5 mb-2">
            <div className="relative h-8 w-8"><Image src="/logo.png" alt="Mi.Tech.Nu" fill className="object-contain" /></div>
            <span className="font-mono font-700 text-sm"><span className="text-[#E63946]">// </span>Mi.Tech.Nu</span>
          </div>

          <div>
            <h2 className="text-3xl font-700 text-[#080808] tracking-tight">Create account</h2>
            <p className="mt-1.5 text-sm text-[#6B6B65]">Free to start. No credit card required.</p>
          </div>

          {errorMessage && (
            <div className="border-2 border-[#E63946] bg-white p-4 text-sm text-[#E63946] font-600 flex items-center gap-2">
              <span className="h-4 w-4 bg-[#E63946] text-white flex items-center justify-center text-[10px] font-700 shrink-0">!</span>
              {errorMessage}
            </div>
          )}

          <form action={signupAction} className="space-y-4">
            <div>
              <label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-2">Full Name</label>
              <input name="name" placeholder="Aarav Sharma" className="input-field" required />
            </div>
            <div>
              <label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-2">Email</label>
              <input name="email" type="email" placeholder="you@example.com" className="input-field" required />
            </div>
            <div>
              <label className="block text-xs font-700 uppercase tracking-widest text-[#080808] mb-2">Password</label>
              <input name="password" type="password" placeholder="Create a strong password" className="input-field" required />
            </div>
            <button type="submit" className="btn-primary w-full justify-center mt-2">
              Create Free Account →
            </button>
          </form>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-[#E0E0D8]" />
            <span className="text-xs text-[#6B6B65] font-600 uppercase tracking-widest">or</span>
            <div className="h-px flex-1 bg-[#E0E0D8]" />
          </div>

          <GoogleAuthButton label="Sign up with Google" />

          <p className="text-sm text-[#6B6B65]">
            Have an account?{" "}
            <Link href="/login" className="font-700 text-[#080808] underline underline-offset-2">Sign in →</Link>
          </p>

          <p className="text-xs text-[#9B9B95] leading-relaxed">
            By creating an account you agree to our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
