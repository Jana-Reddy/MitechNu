import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { env } from "@academy/config";
import { getUserByEmail, getUserById } from "@academy/db";
import { authOptions } from "../auth";

const sessionCookieName = "academy_session";

function sign(value: string) {
  return createHmac("sha256", env.sessionSecret).update(value).digest("base64url");
}

function encodeSession(userId: string) {
  const payload = `${userId}.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token: string) {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) {
    return null;
  }

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const expected = sign(payload);
  if (signature.length !== expected.length) {
    return null;
  }
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  const [userId] = payload.split(".");
  return userId;
}

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, encodeSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (token) {
    const userId = decodeSession(token);
    if (userId) {
      const localUser = await getUserById(userId);
      if (localUser) {
        return localUser;
      }
    }
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }

  if (session.user.id) {
    const byId = await getUserById(session.user.id);
    if (byId) {
      return byId;
    }
  }

  return getUserByEmail(session.user.email);
}
