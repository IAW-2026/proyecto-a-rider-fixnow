import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// 1. BASE DE DATOS FALSA DE PROFESIONALES (Alineada con Feedback App)
const MOCK_PROFESSIONALS = [
  { id: "prof-plomeria-001", service_type: "PLOMERIA" },
  { id: "prof-electricidad-002", service_type: "ELECTRICIDAD" },
  { id: "prof-gas-003", service_type: "GAS" },
];

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

  // Fallback inteligente: si la UI pide el dato y aún no está en la BD, calcula a quién le tocaría
  const defaultProf =
    MOCK_PROFESSIONALS.find(
      (p) => p.service_type === job.service_type.toString().toUpperCase(),
    )?.id ?? "prof-generico-000";

  return NextResponse.json({
    status: job.status,
    professional_id: job.professional_id ?? defaultProf,
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

  // 2. LÓGICA DE ASIGNACIÓN INTELIGENTE
  const assignedProfessional = MOCK_PROFESSIONALS.find(
    (p) => p.service_type === job.service_type.toString().toUpperCase(),
  );
  const professionalIdToAssign = assignedProfessional
    ? assignedProfessional.id
    : "prof-generico-000";

  let finalPrice = Number(job.estimated_price);
  let finalDescription = job.description;

  if (currentStatus === "IN_PROGRESS" && nextStatus === "COMPLETED") {
    // Caso 1: electricidad se complica y sube el precio un 40%
    if (job.service_type.toString().toUpperCase() === "ELECTRICIDAD") {
      finalPrice = Math.round(finalPrice * 1.4);
      finalDescription = `${job.description}\n\n[INFORME DEL PROFESIONAL]: Se complicó la instalación, el cableado principal estaba sulfatado y debió reemplazarse una llave térmica. El monto final ha sido ajustado.`;
    } else {
      // Caso 2: Plomería y gas mantienen el precio original, pero agregan un comentario de cierre
      finalDescription = `${job.description}\n\n[INFORME DEL PROFESIONAL]: Trabajo finalizado con éxito sin complicaciones extra. El monto original se mantiene.`;
    }
  }

  const updatedJob = await prisma.job.update({
    where: { id: job.id },
    data: {
      status: nextStatus as
        | "PENDING"
        | "ACCEPTED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "CANCELLED",
      estimated_price: finalPrice,
      description: finalDescription,
      // Si el trabajo pasa de PENDING a ACCEPTED, le inyectamos el ID que calculamos
      professional_id:
        currentStatus === "PENDING" && !job.professional_id
          ? professionalIdToAssign
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
    estimated_price: Number(updatedJob.estimated_price),
    description: updatedJob.description,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { client, error } = await getAuthenticatedClient();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const job = await prisma.job.findFirst({
    where: { id, client_id: client.id },
  });

  if (!job || job.status !== "PENDING") {
    return NextResponse.json(
      { error: "El trabajo no existe o ya no puede modificarse" },
      { status: 400 },
    );
  }

  const updatedJob = await prisma.job.update({
    where: { id: job.id },
    data: {
      service_type: body.service_type ?? job.service_type,
      description: body.description ?? job.description,
      lat: body.lat ?? job.lat,
      lng: body.lng ?? job.lng,
    },
  });

  return NextResponse.json({
    status: updatedJob.status,
    service_type: updatedJob.service_type,
    description: updatedJob.description,
    lat: updatedJob.lat,
    lng: updatedJob.lng,
  });
}
