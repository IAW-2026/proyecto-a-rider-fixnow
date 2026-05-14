import { AppSidebar } from "@/components/Sidebar";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Mi Historial - FixNow",
};

export default async function HistoryPage() {
  const user = await currentUser();
  const profileAddress = user?.unsafeMetadata?.address;
  const userFullName = user?.fullName || "Catalina";

  if (!profileAddress) {
    redirect("/complete-profile");
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <AppSidebar currentView="history" />
      <main className="ml-64 w-full min-h-screen p-12 bg-[#2C446C] from-slate-950 to-slate-900">
        <div className="space-y-10">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Mi Historial
            </h1>
            <p className="mt-1 text-lg text-slate-400">
              Aquí verás todos los servicios que has solicitado
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Sin historial de servicios
              </h3>
              <p className="text-slate-400">
                Cuando completes tu primer servicio, aparecerá aquí
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
