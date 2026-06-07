import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

export async function POST(req: NextRequest) {
  // Auth guard — admin/staff only
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== "ADMIN" && role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files received." }, { status: 400 });
    }

    const uploaded: { name: string; url: string; size: number; type: string }[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // Validate type
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`"${file.name}" — unsupported file type (${file.type}).`);
        continue;
      }

      // Validate size
      if (file.size > MAX_SIZE_BYTES) {
        errors.push(`"${file.name}" — file too large (max 10 MB).`);
        continue;
      }

      // Build a safe, unique filename
      const ext = path.extname(file.name) || `.${file.type.split("/")[1]}`;
      const safeName = file.name
        .replace(ext, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .toLowerCase()
        .slice(0, 60);
      const uniqueName = `${Date.now()}_${safeName}${ext}`;
      const filePath = path.join(UPLOADS_DIR, uniqueName);

      // Write to disk
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      uploaded.push({
        name: uniqueName,
        url: `/uploads/${uniqueName}`,
        size: file.size,
        type: file.type,
      });
    }

    return NextResponse.json({ uploaded, errors });
  } catch (err: any) {
    console.error("[upload] error:", err);
    return NextResponse.json({ error: err.message || "Upload failed." }, { status: 500 });
  }
}
