import { NextResponse } from "next/server";
import { DuvApiError, testAuth } from "@/lib/duv";

// Reports whether the server's DUV_API_KEY is accepted. Never echoes the key.
export async function GET() {
  try {
    const data = await testAuth();
    return NextResponse.json({
      authenticated: data?.success === true,
      client: data?.client ?? null,
    });
  } catch (error) {
    const status = error instanceof DuvApiError ? error.status : 500;
    return NextResponse.json(
      { authenticated: false, error: status === 401 ? "Unauthorized" : "Request failed" },
      { status: status === 401 ? 200 : 502 }
    );
  }
}
