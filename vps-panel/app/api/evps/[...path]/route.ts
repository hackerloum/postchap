import { NextRequest, NextResponse } from "next/server";
import { evps } from "@/lib/evps";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const [resource, id, sub, file] = (await params).path;
  if (resource === "balance") {
    const r = await evps.balance();
    return NextResponse.json(r);
  }
  if (resource === "vps" && !id) {
    const r = await evps.listVps();
    return NextResponse.json(r);
  }
  if (resource === "vps" && id && !sub) {
    const r = await evps.getVps(id);
    return NextResponse.json(r);
  }
  if (resource === "vps" && id && sub === "backup") {
    const r = await evps.listBackups(id);
    return NextResponse.json(r);
  }
  if (resource === "vps" && id && sub === "vnc") {
    const r = await evps.vnc(id);
    return NextResponse.json(r);
  }
  return NextResponse.json({ status: 0, result: "Not found" }, { status: 404 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const path = (await params).path;
  const [resource, id, sub, file] = path;
  if (resource === "vps" && id && sub === "action") {
    const action = new URL(req.url).searchParams.get("action");
    let r;
    if (action === "start") r = await evps.start(id);
    else if (action === "stop") r = await evps.stop(id);
    else if (action === "reboot") r = await evps.reboot(id);
    else if (action === "shutdown") r = await evps.shutdown(id);
    else return NextResponse.json({ status: 0, result: "Unknown action" }, { status: 400 });
    return NextResponse.json(r);
  }
  if (resource === "vps" && id && sub === "backup" && !file) {
    const r = await evps.createBackup(id);
    return NextResponse.json(r);
  }
  if (resource === "vps" && id && sub === "restore" && file) {
    const r = await evps.restoreBackup(id, decodeURIComponent(file));
    return NextResponse.json(r);
  }
  return NextResponse.json({ status: 0, result: "Not found" }, { status: 404 });
}
