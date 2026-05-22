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

  const profileAddress = user?.unsafeMetadata?.address as string;
  const profilePhone = user?.unsafeMetadata?.phone as string;

  if (!profileAddress || !profilePhone) {
    redirect("/complete-profile");
  }

  return (
    <div className="flex bg-slate-950 min-h-screen">
      <main className="ml-64 flex-1 p-12 bg-[#2C446C]">
        <ProfileClientView
          initialAddress={profileAddress}
          initialPhone={profilePhone}
        />
      </main>
    </div>
  );
}
