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
  const profilePhone = user?.unsafeMetadata?.phone;
  const userFullName = user?.fullName || "User";
  const email = user?.emailAddresses[0]?.emailAddress || "No email";

  if (!profileAddress || !profilePhone) {
    redirect("/complete-profile");
  }

  const dbClient = await prisma.client.findUnique({
    where: { email: email as string },
  });

  let serializedActiveJobs: any[] = [];
  let serializedRecentJobs: any[] = [];

  if (dbClient) {
    const activeJobsRaw = await prisma.job.findMany({
      where: {
        client_id: dbClient.id,
        OR: [
          // Trabajos INMEDIATOS que estén activos
          {
            urgency: "IMMEDIATE",
            status: { in: ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED"] },
          },
          // Trabajos PROGRAMADOS que ya estén ocurriendo hoy (en progreso o a pagar)
          {
            urgency: "SCHEDULED",
            status: { in: ["IN_PROGRESS", "COMPLETED"] },
          },
          // Cancelados con multa pendiente (sin importar si eran inmediatos o programados)
          { status: "CANCELLED", cancellation_payment_required: true },
        ],
      },
      orderBy: { requested_date: { sort: "desc", nulls: "last" } },
    });

    serializedActiveJobs = activeJobsRaw.map((activeJobRaw) => ({
      id: activeJobRaw.id,
      service_type: activeJobRaw.service_type,
      description: activeJobRaw.description,
      status: activeJobRaw.status,
      estimated_price: Number(activeJobRaw.estimated_price),
      requested_date: activeJobRaw.requested_date
        ? activeJobRaw.requested_date.toISOString()
        : null,
      cancellation_payment_required: activeJobRaw.cancellation_payment_required,
      professional_id: activeJobRaw.professional_id,
    }));

    const recentJobs = await prisma.job.findMany({
      where: {
        client_id: dbClient.id,
        OR: [
          { status: "PAID" },
          { status: "CANCELLED", cancellation_payment_required: false },
        ],
      },
      orderBy: { requested_date: { sort: "desc", nulls: "last" } },
      take: 2,
    });

    serializedRecentJobs = recentJobs.map((job) => {
      const isCancelled = job.status === "CANCELLED";
      const hadPenalty = isCancelled && job.professional_id !== null;

      return {
        id: job.id,
        service_type: job.service_type,
        description: job.description,
        status: job.status,
        estimated_price: isCancelled
          ? hadPenalty
            ? Math.max(1000, Math.round(Number(job.estimated_price) * 0.2))
            : 0
          : Number(job.estimated_price),
        requested_date: job.requested_date
          ? job.requested_date.toISOString()
          : null,
        professional_id: job.professional_id,
        cancellation_reason: job.cancellation_reason,
      };
    });

    return (
      <div className="flex bg-slate-950 min-h-screen">
        <AppSidebar currentView="home" />
        <main className="ml-64 flex-1 p-12 bg-[#2C446C]">
          <HomeView
            userName={userFullName}
            address={profileAddress as string}
            recentJobs={serializedRecentJobs}
            activeJobs={serializedActiveJobs}
          />
        </main>
      </div>
    );
  }
}
