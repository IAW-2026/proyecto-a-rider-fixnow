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

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const client = await getAuthenticatedClient();

  if (!client) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const job = await prisma.job.findFirst({
    where: {
      id,
      client_id: client.id,
    },
  });

  if (!job) {
    return NextResponse.json(
      { error: "Trabajo no encontrado" },
      { status: 404 },
    );
  }

  const updatedJob = await prisma.job.update({
    where: { id },
    data: { status: "PAID", cancellation_payment_required: false },
  });

  return NextResponse.json({
    status: updatedJob.status,
    professional_id: updatedJob.professional_id,
    cancellation_reason: updatedJob.cancellation_reason,
    cancellation_payment_required: updatedJob.cancellation_payment_required,
  });
}
