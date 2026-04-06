import { NextResponse } from "next/server";
import { verifySignedMediaToken } from "@academy/media";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const payload = verifySignedMediaToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  }

  return NextResponse.json({
    mediaKey: payload.mediaKey,
    userId: payload.userId,
    status: "signed-access-valid",
    note: "Attach this route to MinIO/S3-backed HLS manifests in production."
  });
}

