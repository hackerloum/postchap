import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { verifySuperadminSession } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  let uid: string;
  try {
    const session = await verifySuperadminSession(req);
    uid = session.uid;
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const secret = process.env.TERMINAL_JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const token = jwt.sign(
    { uid, role: "superadmin", purpose: "terminal" },
    secret,
    { expiresIn: "5m" }
  );

  return NextResponse.json({ token });
}
