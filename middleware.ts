import { NextResponse } from "next/server";

export function middleware(request: Request) {
  const hostHeader = request.headers.get("host") ?? "";
  const hostname = hostHeader.split(":")[0];

  // Skip localhost→127.0.0.1 redirect in dev to avoid redirect loops when
  // browser/proxy rewrites 127.0.0.1 back to localhost.
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev && hostname === "localhost") {
    const url = new URL(request.url);
    url.hostname = "127.0.0.1";
    return NextResponse.redirect(url.toString());
  }

  return NextResponse.next();
}
