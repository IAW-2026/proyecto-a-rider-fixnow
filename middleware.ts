import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Acá definimos qué rutas son públicas. Por ahora, dejamos el inicio (/) público.
const isPublicRoute = createRouteMatcher(["/"]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect(); // Si no es pública, exige login
  }
});

export const config = {
  matcher: [
    // Ignora los archivos internos de Next.js y los archivos estáticos
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Siempre ejecuta el middleware para las rutas de la API
    "/(api|trpc)(.*)",
  ],
};
