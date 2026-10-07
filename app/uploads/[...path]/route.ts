export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import { resolveUploadPath } from "@/lib/uploads";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = resolveUploadPath(params.path || []);
    if (!filePath) {
      return new NextResponse("Not Found", { status: 404 });
    }

    try {
      await fs.access(filePath);
    } catch {
      return new NextResponse("Not Found", { status: 404 });
    }

    const fileBuffer = await fs.readFile(filePath);
    const filename = filePath.toLowerCase();

    let contentType = "application/octet-stream";
    if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) contentType = "image/jpeg";
    else if (filename.endsWith(".png")) contentType = "image/png";
    else if (filename.endsWith(".gif")) contentType = "image/gif";
    else if (filename.endsWith(".webp")) contentType = "image/webp";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
