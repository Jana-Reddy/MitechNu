"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/local-logout", { method: "POST" });
    await signOut({ callbackUrl: "/" });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950"
    >
      Logout
    </button>
  );
}

