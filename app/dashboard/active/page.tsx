import { AppSidebar } from "@/components/Sidebar";
import { ActiveJobView } from "../../../components/ActiveJobView";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "Trabajo Activo - FixNow",
};

export default async function ActivePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const profileAddress = user?.unsafeMetadata?.address;

  if (!profileAddress) {
    redirect("/complete-profile");
  }

  const email = user.emailAddresses[0]?.emailAddress;

  if (!email) {
    return (
      <div className="flex">
        <AppSidebar currentView="active" />
        <main className="ml-64 flex min-h-screen w-full flex-1 items-center justify-center bg-[#2C446C] p-12">
          <div className="max-w-md rounded-lg border border-slate-700 bg-slate-800 p-8 text-center shadow-xl">
            <h2 className="text-2xl font-bold text-white">
              No pudimos identificar tu cuenta
            </h2>
            <p className="mt-4 text-slate-400">
              Verifica tu sesión e intenta nuevamente.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const client = await prisma.client.findUnique({
    where: { email },
  });

  // 1- Buscamos el ultimo job activo de este cliente
  const activeJob = await prisma.job.findFirst({
    where: client
      ? {
          client_id: client.id,
          status: {
            in: ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED"],
          },
        }
      : undefined,
    orderBy: {
      id: "desc", //Traemos el ultimo job creado
    },
  });

  const penaltyJob = activeJob
    ? null
    : await prisma.job.findFirst({
        where: client
          ? {
              client_id: client.id,
              status: "CANCELLED",
              cancellation_payment_required: true,
            }
          : undefined,
        orderBy: {
          id: "desc",
        },
      });

  const visibleJob = activeJob ?? penaltyJob;

  // 2- Si el cliente no tiene ningun trabajo activo, mostramos un cartel y boton para ir al dashboard y crear uno
  if (!visibleJob) {
    return (
      <div className="flex">
        <AppSidebar currentView="active" />
        <main className="ml-64 min-h-screen w-full flex-1 bg-[#2C446C] p-12 flex items-center justify-center">
          <div className="max-w-md rounded-lg border border-slate-700 bg-slate-800 p-8 text-center shadow-xl">
            <h2 className="text-2xl font-bold text-white">
              No tienes trabajos activos
            </h2>
            <p className="mt-4 text-slate-400">
              Parece que no tienes ningún trabajo activo en este momento.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-block rounded-lg bg-amber-400 px-6 py-2 font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Ir al Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // 3- Serializamos los datos (Prisma guarda numeros decimales raros que TS
  // a veces no puede pasar directo a componentes cliente)
  const serializedJob = {
    id: visibleJob.id,
    service_type: visibleJob.service_type,
    description: visibleJob.description,
    status: visibleJob.status,
    cancellation_reason: visibleJob.cancellation_reason,
    cancellation_payment_required: visibleJob.cancellation_payment_required,
    cancelled_at: visibleJob.cancelled_at
      ? visibleJob.cancelled_at.toISOString()
      : null,
    urgency: visibleJob.urgency,
    lat: visibleJob.lat,
    lng: visibleJob.lng,
    estimated_price: Number(visibleJob.estimated_price),
    professional_id: visibleJob.professional_id,
  };

  return (
    <div className="flex">
      <AppSidebar currentView="active" />
      <main className="ml-64 min-h-screen w-full flex-1 bg-[#2C446C] p-12">
        <ActiveJobView job={serializedJob} />
      </main>
    </div>
  );
}
