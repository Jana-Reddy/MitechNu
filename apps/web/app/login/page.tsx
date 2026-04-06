import Link from "next/link";
import { GoogleAuthButton } from "../../components/google-auth-button";
import { loginAction } from "../../lib/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const errorMessage =
    params.error === "google"
      ? "Google sign-in could not be started or completed. Please verify the authentication setup and try again."
      : params.error === "invalid"
        ? "Invalid email or password."
        : params.error
          ? "Authentication failed. Please try again."
          : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-panel">
        <h1 className="text-3xl font-black text-slate-950">Login to your academy</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use a seeded development account or sign in with Google to explore the platform locally.
        </p>
        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
        <form action={loginAction} className="mt-6 space-y-4">
          <input name="email" type="email" placeholder="Email" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
          <input name="password" type="password" placeholder="Password" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
          <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Login
          </button>
        </form>
        <div className="mt-4">
          <GoogleAuthButton label="Continue with Google" />
        </div>
        <p className="mt-5 text-sm text-slate-500">
          Need an account? <Link href="/signup" className="font-semibold text-accent">Create one</Link>
        </p>
      </div>
    </div>
  );
}
