"use client";

import { signIn } from "next-auth/react";

interface GoogleAuthButtonProps {
  label: string;
}

export function GoogleAuthButton({ label }: GoogleAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950"
    >
      {label}
    </button>
  );
}

