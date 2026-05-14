import { AppSidebar } from "@/components/Sidebar";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Mi Perfil - FixNow",
};

export default async function ProfilePage() {
  const user = await currentUser();
  const profileAddress = user?.unsafeMetadata?.address;
  const userFullName = user?.fullName || "Usuario";
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || "";

  if (!profileAddress) {
    redirect("/complete-profile");
  }

  return (
    <div className="flex">
      <AppSidebar currentView="home" />
      <main className="ml-64 flex-1 min-h-screen p-12 bg-[#2C446C] from-slate-950 to-slate-900">
        <div className="space-y-10">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Mi Perfil
            </h1>
            <p className="mt-1 text-lg text-slate-400">
              Actualiza tu información personal
            </p>
          </div>

          {/* Profile Card */}
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nombre Completo
                </label>
                <p className="text-slate-400">{userFullName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email
                </label>
                <p className="text-slate-400">{userEmail}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Dirección
                </label>
                <p className="text-slate-400">{profileAddress as string}</p>
              </div>

              <div className="pt-4">
                <p className="text-sm text-slate-400">
                  Para editar tu información, contacta con soporte
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
