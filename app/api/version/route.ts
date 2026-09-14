import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Reads package.json fresh on every request (not a build-time constant) so
 * this always reflects whichever server process is actually answering —
 * the basis for detecting "a new version has been deployed" client-side.
 */
export async function GET() {
  const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8")) as {
    version: string;
  };
  return NextResponse.json(
    { version: pkg.version },
    { headers: { "Cache-Control": "no-store" } },
  );
}
