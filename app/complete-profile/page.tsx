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

  const profileAddress = (user?.unsafeMetadata?.address as string) ?? "";
  const profilePhone = (user?.unsafeMetadata?.phone as string) ?? "";

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12 sm:px-10 lg:px-12">
        <ProfileClientView
          initialFullName={user.fullName ?? ""}
          initialAddress={profileAddress}
          initialPhone={profilePhone}
          mode="setup"
        />
      </main>
    </div>
  );
}
