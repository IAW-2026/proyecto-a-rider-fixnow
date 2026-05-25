import { AppSidebar } from "@/components/Sidebar";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ScheduledJobsView } from "@/components/ScheduledJobsView";

export const metadata = {
  title: "Mis Turnos Programados - FixNow",
};

export default async function ScheduledPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const profileAddress = user?.unsafeMetadata?.address;
  const profilePhone = user?.unsafeMetadata?.phone;
  const email = user.emailAddresses[0]?.emailAddress;

  if (!profileAddress || !profilePhone) redirect("/complete-profile");

  const dbClient = await prisma.client.findUnique({
    where: { email: email as string },
  });

  let serializedScheduledJobs: any[] = [];

  if (dbClient) {
    // Buscamos los trabajos programados que sigan activos
    const scheduledJobs = await prisma.job.findMany({
      where: {
        client_id: dbClient.id,
        urgency: "SCHEDULED", // Filtramos por urgencia programada
        status: {
          in: ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED"], // Que no estén cerrados
        },
      },
      orderBy: { requested_date: { sort: "asc", nulls: "last" } }, // Los más próximos primero
    });

    serializedScheduledJobs = scheduledJobs.map((job) => ({
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
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <AppSidebar currentView="scheduled" />
      <main className="ml-64 w-full min-h-screen p-12 bg-[#2C446C] from-slate-950 to-slate-900">
        <ScheduledJobsView jobs={serializedScheduledJobs} />
      </main>
    </div>
  );
}
