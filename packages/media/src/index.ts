import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@academy/config";

interface SignedMediaPayload {
  mediaKey: string;
  userId: string;
  expiresAt: number;
}

function encode(payload: SignedMediaPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", env.mediaSecret).update(value).digest("base64url");
}

export function createSignedMediaToken(mediaKey: string, userId: string, ttlSeconds = 1800) {
  const encoded = encode({
    mediaKey,
    userId,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
  return `${encoded}.${sign(encoded)}`;
}

export function verifySignedMediaToken(token: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expected = sign(encoded);
  if (signature.length !== expected.length) {
    return null;
  }
  const isValid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!isValid) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SignedMediaPayload;
  if (Date.now() > payload.expiresAt) {
    return null;
  }

  return payload;
}
