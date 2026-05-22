import { AppSidebar } from "@/components/Sidebar";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HistoryClientView } from "@/components/HistoryClientView";

export const metadata = {
  title: "Mi Historial - FixNow",
};

export default async function HistoryPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const profileAddress = user?.unsafeMetadata?.address;
  const email = user.emailAddresses[0]?.emailAddress;

  if (!profileAddress) {
    redirect("/complete-profile");
  }

  const dbClient = await prisma.client.findUnique({
    where: { email: email as string },
  });

  let serializedJobs: any[] = [];

  if (dbClient) {
    const jobs = await prisma.job.findMany({
      where: {
        client_id: dbClient.id,
        status: { in: ["PAID", "CANCELLED"] },
      },
      orderBy: { requested_date: { sort: "desc", nulls: "last" } },
    });

    serializedJobs = jobs.map((job) => ({
      id: job.id,
      service_type: job.service_type,
      description: job.description,
      status: job.status,
      estimated_price: Number(job.estimated_price),
      requested_date: job.requested_date
        ? job.requested_date.toISOString()
        : null,
      professional_id: job.professional_id,
      cancellation_payment_required: job.cancellation_payment_required,
    }));
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <AppSidebar currentView="history" />
      <main className="ml-64 w-full min-h-screen p-12 bg-[#2C446C] from-slate-950 to-slate-900">
        {/* Le pasamos toda la data al componente cliente para que arme la magia */}
        <HistoryClientView jobs={serializedJobs} />
      </main>
    </div>
  );
}
