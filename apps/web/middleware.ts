import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/", "/goals", "/plans", "/execution", "/review", "/onboarding"];
const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const authToken = request.cookies.get("horus_access_token")?.value;
  const demoMode = request.cookies.get("horus_demo_mode")?.value === "1";
  const onboardingCompleted = request.cookies.get("horus_onboarding_completed")?.value === "1";
  const isProtectedRoute = protectedRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);
  const isOnboardingRoute = pathname === "/onboarding";

  if (isProtectedRoute && !authToken && !demoMode) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", `${pathname}${search}`);
    }

    return NextResponse.redirect(loginUrl);
  }

  if (isOnboardingRoute && demoMode && !authToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (authToken && !onboardingCompleted && !isOnboardingRoute && !isAuthRoute) {
    const onboardingUrl = new URL("/onboarding", request.url);
    onboardingUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(onboardingUrl);
  }

  if (authToken && onboardingCompleted && isOnboardingRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAuthRoute && authToken) {
    return NextResponse.redirect(new URL(onboardingCompleted ? "/" : "/onboarding", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/goals", "/plans", "/execution", "/review", "/onboarding", "/login", "/register"],
};
