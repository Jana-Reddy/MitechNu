import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "admin" | "learner";
    };
  }

  interface User {
    role?: "admin" | "learner";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    academyUserId?: string;
    role?: "admin" | "learner";
  }
}
