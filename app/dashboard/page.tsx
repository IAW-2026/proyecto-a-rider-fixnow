import { AppSidebar } from "@/components/Sidebar";
import { HomeView } from "@/components/HomeView";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Inicio - FixNow",
};

export default async function DashboardPage() {
  const user = await currentUser();
  const profileAddress = user?.unsafeMetadata?.address;
  const userFullName = user?.fullName || "Catalina";

  if (!profileAddress) {
    redirect("/complete-profile");
  }

  return (
    <div className="flex bg-slate-950 min-h-screen">
      <AppSidebar currentView="home" />
      <main className="ml-64 flex-1 p-12 bg-[#2C446C]">
        <HomeView userName={userFullName} address={profileAddress as string} />
      </main>
    </div>
  );
}
