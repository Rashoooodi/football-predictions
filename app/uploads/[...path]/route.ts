export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const filename = params.path.join("/");
    const filePath = path.join(process.cwd(), "public", "uploads", filename);
    
    // Check if the file exists
    try {
      await fs.access(filePath);
    } catch {
      return new NextResponse("Not Found", { status: 404 });
    }

    const fileBuffer = await fs.readFile(filePath);
    
    // Determine content type
    let contentType = "application/octet-stream";
    if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) contentType = "image/jpeg";
    else if (filename.endsWith(".png")) contentType = "image/png";
    else if (filename.endsWith(".gif")) contentType = "image/gif";
    else if (filename.endsWith(".webp")) contentType = "image/webp";
    else if (filename.endsWith(".svg")) contentType = "image/svg+xml";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
