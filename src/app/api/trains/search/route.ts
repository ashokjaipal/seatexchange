import { NextResponse } from "next/server";
import { searchTrains } from "@/lib/trains";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return NextResponse.json({ trains: searchTrains(q) });
}
