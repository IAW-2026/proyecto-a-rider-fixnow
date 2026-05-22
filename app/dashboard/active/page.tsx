import { AppSidebar } from "@/components/Sidebar";
import { ActiveJobView } from "../../../components/ActiveJobView";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Clock } from "lucide-react";

export const metadata = {
  title: "Trabajo Activo - FixNow",
};

export default async function ActiveJobPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const profileAddress = user?.unsafeMetadata?.address;
  const email = user.emailAddresses[0]?.emailAddress;

  if (!profileAddress) redirect("/complete-profile");

  const dbClient = await prisma.client.findUnique({
    where: { email: email as string },
  });

  let currentActiveJob = null;

  if (dbClient) {
    // APLICAMOS EL FILTRO ESTRICTO: Solo trabajos que requieran seguimiento EN VIVO ahora
    currentActiveJob = await prisma.job.findFirst({
      where: {
        client_id: dbClient.id,
        OR: [
          // A: Emergencias inmediatas activas
          {
            urgency: "IMMEDIATE",
            status: { in: ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED"] },
          },
          // B: Turnos programados que YA empezaron (el profesional llegó o está cobrando)
          {
            urgency: "SCHEDULED",
            status: { in: ["IN_PROGRESS", "COMPLETED"] },
          },
          // C: Cancelaciones que todavía deben la multa
          { status: "CANCELLED", cancellation_payment_required: true },
        ],
      },
      orderBy: { requested_date: { sort: "desc", nulls: "last" } },
    });
  }

  // Serializamos los datos para el componente cliente de la misma forma que antes
  const serializedJob = currentActiveJob
    ? {
        id: currentActiveJob.id,
        service_type: currentActiveJob.service_type,
        description: currentActiveJob.description,
        status: currentActiveJob.status,
        cancellation_reason: currentActiveJob.cancellation_reason,
        cancellation_payment_required:
          currentActiveJob.cancellation_payment_required,
        cancelled_at: currentActiveJob.cancelled_at
          ? currentActiveJob.cancelled_at.toISOString()
          : null,
        urgency: currentActiveJob.urgency,
        lat: currentActiveJob.lat,
        lng: currentActiveJob.lng,
        estimated_price: Number(currentActiveJob.estimated_price),
        professional_id: currentActiveJob.professional_id,
      }
    : null;

  return (
    <div className="flex bg-slate-950 min-h-screen">
      <AppSidebar currentView="active" />
      <main className="ml-64 flex-1 p-12 bg-[#2C446C] text-white">
        {/* LÓGICA CONDICIONAL: Si no hay un trabajo que requiera atención inmediata, mostramos un estado vacío limpio */}
        {!serializedJob ? (
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">
              Trabajo Activo
            </h1>
            <p className="mt-1 text-lg text-slate-400">
              Seguimiento en tiempo real de tu servicio
            </p>

            <div className="rounded-lg border border-slate-700 bg-slate-800 p-12 text-center mt-10">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-700 text-slate-400 mb-4">
                <Clock className="size-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                No tienes ningún servicio en curso
              </h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Las solicitudes inmediatas aparecerán aquí para su seguimiento.
                Los turnos agendados para días futuros se encuentran en la
                sección de{" "}
                <span className="text-amber-400 font-medium">
                  <a
                    href="/dashboard/scheduled"
                    className="text-amber-400 hover:text-amber-300"
                  >
                    Servicios Programados
                  </a>
                </span>
                .
              </p>
            </div>
          </div>
        ) : (
          /* Si hay una urgencia o un turno en proceso real, renderizamos la vista del mapa */
          <ActiveJobView job={serializedJob as any} />
        )}
      </main>
    </div>
  );
}
