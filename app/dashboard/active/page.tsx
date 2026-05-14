import { AppSidebar } from "@/components/Sidebar";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Trabajo Activo - FixNow",
};

export default async function ActivePage() {
  const user = await currentUser();
  const profileAddress = user?.unsafeMetadata?.address;
  const userFullName = user?.fullName || "Catalina";

  if (!profileAddress) {
    redirect("/complete-profile");
  }

  return (
    <div className="flex">
      <AppSidebar currentView="active" />
      <main className="ml-64 flex-1 w-full min-h-screen p-12 bg-[#2C446C] from-slate-950 to-slate-900">
        <div className="space-y-10">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Trabajo Activo
            </h1>
            <p className="mt-1 text-lg text-slate-400">
              Aquí verás los servicios que están en curso
            </p>
          </div>

          {/* Empty State */}
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="size-16 rounded-full bg-slate-700 flex items-center justify-center mb-4">
                <svg
                  className="size-8 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                No hay trabajos activos
              </h3>
              <p className="text-slate-400 mb-6">
                Cuando solicites un servicio, aparecerá aquí con el estado en
                tiempo real
              </p>
              <a
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors font-medium"
              >
                Solicitar Servicio
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
