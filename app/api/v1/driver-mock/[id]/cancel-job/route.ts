import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const getAuthenticatedClient = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const email = user.emailAddresses[0]?.emailAddress;

  if (!email) {
    return null;
  }

  return prisma.client.findUnique({
    where: { email },
  });
};

const getPenaltyAmount = (estimatedPrice: number) =>
  Math.max(1000, Math.round(estimatedPrice * 0.2));

const ALLOWED_REASONS = new Set([
  "MUCHO_TIEMPO_ESPERA",
  "VALOR_TRABAJO_ALTO",
  "CAMBIE_DE_OPINION",
  "YA_NO_LO_NECESITO",
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const client = await getAuthenticatedClient();

  if (!client) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  let job = await prisma.job.findFirst({
    where: {
      id,
      client_id: client.id,
    },
  });

  // Fallback para evitar 404 si el cliente tiene un id stale en la UI.
  // En ese caso, cancelamos el ultimo trabajo activo del mismo cliente.
  if (!job) {
    job = await prisma.job.findFirst({
      where: {
        client_id: client.id,
        status: {
          in: ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED"],
        },
      },
      orderBy: {
        id: "desc",
      },
    });
  }

  if (!job) {
    return NextResponse.json(
      { error: "Trabajo no encontrado para este cliente" },
      { status: 404 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    reason?: string;
  } | null;
  const selectedReason = body?.reason;

  if (!selectedReason || !ALLOWED_REASONS.has(selectedReason)) {
    return NextResponse.json(
      { error: "Debes seleccionar un motivo de cancelación válido." },
      { status: 400 },
    );
  }

  const requiresPayment =
    job.status === "ACCEPTED" || job.status === "IN_PROGRESS";
  const penaltyAmount = requiresPayment
    ? getPenaltyAmount(Number(job.estimated_price))
    : 0;

  const updatedJob = await prisma.job.update({
    where: { id: job.id },
    data: {
      status: "CANCELLED",
      cancelled_at: new Date(),
      cancellation_reason: selectedReason,
      cancellation_payment_required: requiresPayment,
    },
  });

  return NextResponse.json({
    id: updatedJob.id,
    status: updatedJob.status,
    professional_id: updatedJob.professional_id,
    cancellation_reason: updatedJob.cancellation_reason,
    cancellation_payment_required: updatedJob.cancellation_payment_required,
    requires_payment: requiresPayment,
    penalty_amount: penaltyAmount,
  });
}
