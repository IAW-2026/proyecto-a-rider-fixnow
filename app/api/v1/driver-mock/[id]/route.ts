import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getAuthenticatedClient() {
  const user = await currentUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const email = user.emailAddresses[0]?.emailAddress;

  if (!email) {
    return {
      error: NextResponse.json({ error: "Client not found" }, { status: 404 }),
    };
  }

  const client = await prisma.client.findUnique({
    where: { email },
  });

  if (!client) {
    return {
      error: NextResponse.json({ error: "Client not found" }, { status: 404 }),
    };
  }

  return { client };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { client, error } = await getAuthenticatedClient();
  if (error) {
    return error;
  }

  const { id } = await params;

  const job = await prisma.job.findFirst({
    where: {
      id,
      client_id: client.id,
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: job.status,
    professional_id: job.professional_id ?? "JC-12345",
    cancellation_reason: job.cancellation_reason,
    cancellation_payment_required: job.cancellation_payment_required,
    cancelled_at: job.cancelled_at ? job.cancelled_at.toISOString() : null,
  });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { client, error } = await getAuthenticatedClient();
  if (error) {
    return error;
  }

  const { id } = await params;

  const job = await prisma.job.findFirst({
    where: {
      id,
      client_id: client.id,
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const nextStatusMap: Record<string, string> = {
    PENDING: "ACCEPTED",
    ACCEPTED: "IN_PROGRESS",
    IN_PROGRESS: "COMPLETED",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
  };

  const currentStatus = job.status;
  const nextStatus = nextStatusMap[currentStatus] ?? currentStatus;

  const updatedJob = await prisma.job.update({
    where: { id: job.id },
    data: {
      status: nextStatus as
        | "PENDING"
        | "ACCEPTED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "CANCELLED",
      professional_id:
        currentStatus === "PENDING" && !job.professional_id
          ? "JC-12345"
          : job.professional_id,
    },
  });

  return NextResponse.json({
    status: updatedJob.status,
    professional_id: updatedJob.professional_id,
    cancellation_reason: updatedJob.cancellation_reason,
    cancellation_payment_required: updatedJob.cancellation_payment_required,
    cancelled_at: updatedJob.cancelled_at
      ? updatedJob.cancelled_at.toISOString()
      : null,
  });
}
