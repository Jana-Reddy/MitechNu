import { NextResponse } from "next/server";
import { createSignedMediaToken } from "@academy/media";
import { getCurrentUser } from "../../../../lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { mediaKey?: string };
  if (!body.mediaKey) {
    return NextResponse.json({ error: "mediaKey is required" }, { status: 400 });
  }

  return NextResponse.json({
    token: createSignedMediaToken(body.mediaKey, user.id)
  });
}

