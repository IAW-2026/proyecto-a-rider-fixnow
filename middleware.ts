import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/api/v1/jobs/available",
  "/api/v1/jobs/history",
  "/api/v1/jobs/:id/cancel",
  "/api/v1/jobs/:id/payment-confirmation",
  "/api/v1/jobs/:id",
  "/api/v1/jobs",
  "/api/v1/admin/jobs",
  "/api/v1/clients",
  "/api/v1/payments/:id",
  "/api/v1/reviews",
  "/api/v1/reviews/professional/:id",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
