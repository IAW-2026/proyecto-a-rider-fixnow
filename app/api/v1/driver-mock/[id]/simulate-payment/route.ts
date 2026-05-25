import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Usamos LA MISMA función que tenés en el otro endpoint para evitar discrepancias
async function getAuthenticatedClient() {
  const user = await currentUser();
  if (!user)
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email)
    return {
      error: NextResponse.json({ error: "Client not found" }, { status: 404 }),
    };

  const client = await prisma.client.findUnique({ where: { email } });
  if (!client)
    return {
      error: NextResponse.json({ error: "Client not found" }, { status: 404 }),
    };

  return { client };
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { client, error } = await getAuthenticatedClient();
  if (error) return error;

  const { id } = await params;

  // Buscamos el trabajo
  const job = await prisma.job.findFirst({
    where: {
      id: id,
      client_id: client.id,
    },
  });

  // Si tu terminal tira 404, es porque este if se está ejecutando
  if (!job) {
    console.error(
      `¡Fallo de ID! Trabajo ${id} no encontrado para el cliente de la BD: ${client.id}`,
    );
    return NextResponse.json(
      { error: "Trabajo no encontrado" },
      { status: 404 },
    );
  }

  const isCancelled = job.status === "CANCELLED";

  // Actualizamos a PAID
  const updatedJob = await prisma.job.update({
    where: { id: job.id },
    data: {
      status: isCancelled ? "CANCELLED" : "PAID",
      cancellation_payment_required: false,
    },
  });

  // IMPORTANTE: Limpiamos la caché de Next.js para que el Dashboard re-lea la base de datos
  revalidatePath("/dashboard/active");
  revalidatePath("/dashboard");

  return NextResponse.json({
    status: updatedJob.status,
    professional_id: updatedJob.professional_id,
  });
}
