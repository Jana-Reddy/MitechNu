import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import { getUserByEmail, upsertOAuthUser } from "@academy/db";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? ""
    })
  ],
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async signIn({ user, profile }) {
      if (!user.email) {
        return false;
      }

      const academyUser = await upsertOAuthUser({
        email: user.email,
        name: user.name ?? profile?.name ?? "Google Learner",
        avatarUrl: user.image ?? undefined,
        role: "learner"
      });

      user.id = academyUser.id;
      user.role = academyUser.role;
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const academyUser = await getUserByEmail(user.email);
        if (academyUser) {
          token.academyUserId = academyUser.id;
          token.role = academyUser.role;
          token.name = academyUser.name;
          token.picture = academyUser.avatarUrl;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.academyUserId ?? "");
        session.user.role = (token.role as "admin" | "learner" | undefined) ?? "learner";
        session.user.name = typeof token.name === "string" ? token.name : session.user.name;
        session.user.image = typeof token.picture === "string" ? token.picture : session.user.image;
      }
      return session;
    }
  }
};
