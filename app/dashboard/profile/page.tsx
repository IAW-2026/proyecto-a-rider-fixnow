import { AppSidebar } from "@/components/Sidebar";
import { ProfileClientView } from "@/components/ProfileClientView";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Mi Perfil - FixNow",
};

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  // Obtenemos los datos desde la memoria de Clerk
  const profileAddress = user?.unsafeMetadata?.address as string;
  const profilePhone = user?.unsafeMetadata?.phone as string;

  // Si por alguna razón no los tiene, lo mandamos a completar el perfil
  if (!profileAddress || !profilePhone) {
    redirect("/complete-profile");
  }

  return (
    <div className="flex bg-slate-950 min-h-screen">
      {/* Como es una vista separada pero no está en los items principales, podés pasarle el string que prefieras */}
      <AppSidebar currentView="home" />

      <main className="ml-64 flex-1 p-12 bg-[#2C446C] min-h-screen">
        {/* ACÁ ESTÁ LA MAGIA: Llamamos a tu nuevo componente interactivo y le pasamos los datos */}
        <ProfileClientView
          initialAddress={profileAddress}
          initialPhone={profilePhone}
        />
      </main>
    </div>
  );
}
