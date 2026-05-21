import { AppSidebar } from "@/components/Sidebar";
import { HomeView } from "@/components/HomeView";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Inicio - FixNow",
};

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const profileAddress = user?.unsafeMetadata?.address;
  const userFullName = user?.fullName || "User";
  const email = user?.emailAddresses[0]?.emailAddress || "No email";

  if (!profileAddress) {
    redirect("/complete-profile");
  }

  const dbClient = await prisma.client.findUnique({
    where: { email: email as string },
  });

  let serializedActiveJob: any = null;
  let serializedRecentJobs: any[] = [];

  if (dbClient) {
    const activeJobRaw = await prisma.job.findFirst({
      where: {
        client_id: dbClient.id,
        OR: [
          {
            status: { in: ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED"] },
          },
          { status: "CANCELLED", cancellation_payment_required: true }, // <-- Lo atrapamos acá
        ],
      },
      orderBy: { requested_date: { sort: "desc", nulls: "last" } },
    });

    if (activeJobRaw) {
      serializedActiveJob = {
        id: activeJobRaw.id,
        service_type: activeJobRaw.service_type,
        description: activeJobRaw.description,
        status: activeJobRaw.status,
        estimated_price: Number(activeJobRaw.estimated_price),
        requested_date: activeJobRaw.requested_date
          ? activeJobRaw.requested_date.toISOString()
          : null,
        cancellation_payment_required:
          activeJobRaw.cancellation_payment_required,
        professional_id: activeJobRaw.professional_id,
      };
    }

    const recentJobs = await prisma.job.findMany({
      where: {
        client_id: dbClient.id,
        OR: [
          { status: "PAID" },
          { status: "CANCELLED", cancellation_payment_required: false },
        ],
      },
      orderBy: { requested_date: { sort: "desc", nulls: "last" } },
      take: 4,
    });

    serializedRecentJobs = recentJobs.map((job) => ({
      id: job.id,
      service_type: job.service_type,
      description: job.description,
      status: job.status,
      estimated_price: Number(job.estimated_price),
      requested_date: job.requested_date
        ? job.requested_date.toISOString()
        : null,
      professional_id: job.professional_id,
    }));

    return (
      <div className="flex bg-slate-950 min-h-screen">
        <AppSidebar currentView="home" />
        <main className="ml-64 flex-1 p-12 bg-[#2C446C]">
          <HomeView
            userName={userFullName}
            address={profileAddress as string}
            recentJobs={serializedRecentJobs}
            activeJob={serializedActiveJob}
          />
        </main>
      </div>
    );
  }
}
