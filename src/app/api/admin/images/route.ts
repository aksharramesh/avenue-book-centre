import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// GET — list all uploaded images
export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== "ADMIN" && role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      return NextResponse.json({ images: [] });
    }

    const files = fs.readdirSync(UPLOADS_DIR);
    const images = files
      .filter((f) => /\.(jpe?g|png|gif|webp|svg)$/i.test(f))
      .map((f) => {
        const filePath = path.join(UPLOADS_DIR, f);
        const stat = fs.statSync(filePath);
        return {
          name: f,
          url: `/uploads/${f}`,
          size: stat.size,
          createdAt: stat.birthtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // newest first

    return NextResponse.json({ images });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — remove a specific image by filename
export async function DELETE(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== "ADMIN" && role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await req.json();

    if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename." }, { status: 400 });
    }

    const filePath = path.join(UPLOADS_DIR, name);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    fs.unlinkSync(filePath);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT — upsert CMSContent keys for dynamic configurations
export async function PUT(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== "ADMIN" && role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { key, value, desc } = await req.json();
    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    // Require prisma import locally
    const { default: prisma } = await import("@/lib/prisma");

    await prisma.cMSContent.upsert({
      where: { key },
      update: { value },
      create: { key, value, description: desc || "" },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
