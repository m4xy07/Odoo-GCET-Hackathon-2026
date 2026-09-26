import { clerkMiddleware } from '@clerk/nextjs/server';

// Pages a signed out visitor may open. API routes are skipped here because
// requireUser() answers them with a 401 JSON body instead of a redirect.
const publicPaths = ['/sign-in', '/sign-up', '/forgot-password'];

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/api') || publicPaths.some((p) => pathname.startsWith(p))) return;
  await auth.protect(); // redirects to /sign-in
});

export const config = {
  matcher: [
    // skip Next internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|lottie|json)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
