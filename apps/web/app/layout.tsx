import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer } from "../components/footer";
import { Header } from "../components/header";
import { getCurrentUser } from "../lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mi.Tech.Nu",
  description: "Learn modern tech skills with a self-hosted, AI-assisted academy."
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="min-h-screen">
        <Header user={user ? { name: user.name ?? "Learner", role: user.role } : null} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
