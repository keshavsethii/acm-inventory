import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, readToken } from "@/lib/token";

// Quick gate: no valid session cookie means go to /login.
// Pages and actions still check the database through requireUser().
export async function proxy(request: NextRequest) {
  const session = await readToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Public files (logo, icons, images) must load on the login page too.
  matcher: ["/((?!api/health|_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
