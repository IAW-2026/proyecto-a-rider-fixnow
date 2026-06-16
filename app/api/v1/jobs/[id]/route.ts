import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.emailAddresses[0]?.emailAddress;
  const client = await prisma.client.findUnique({
    where: { email: email as string },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const { id } = await params;

  const job = await prisma.job.findFirst({
    where: { id, client_id: client.id },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Devolvemos el estado actual del trabajo a tu frontend
  return NextResponse.json({
    status: job.status,
    professional_id: job.professional_id,
    cancellation_reason: job.cancellation_reason,
    cancellation_payment_required: job.cancellation_payment_required,
    cancelled_at: job.cancelled_at ? job.cancelled_at.toISOString() : null,
    estimated_price: Number(job.estimated_price),
    description: job.description,
    service_type: job.service_type,
    direction: job.direction,
    lat: Number(job.lat),
    lng: Number(job.lng),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  // ----------------------------------------------------------------------
  // CASO 1: LA PETICIÓN VIENE DE LAUTARO (DRIVER APP)
  // Usa el Secreto en el Header, no usa Clerk. Él nos avisa de un cambio de estado (aceptar, completar o cancelar).
  // ----------------------------------------------------------------------
  const authHeader = request.headers.get("Authorization");
  const secret = process.env.INTERNAL_API_SECRET;

  if (authHeader === `Bearer ${secret}`) {
    // Si Lautaro mandó el secreto correcto, actualizamos nuestra DB con lo que nos dijo
    const updateData: any = { status: body.status.toUpperCase() };

    if (body.professional_id) updateData.professional_id = body.professional_id;
    if (body.estimated_price) updateData.estimated_price = body.estimated_price;
    if (body.description) updateData.description = body.description;

    try {
      const updatedJob = await prisma.job.update({
        where: { id },
        data: updateData,
      });
      return NextResponse.json({
        job_id: updatedJob.id,
        status: updatedJob.status,
      });
    } catch (error) {
      return NextResponse.json({ error: "Job no encontrado" }, { status: 404 });
    }
  }

  // ----------------------------------------------------------------------
  // CASO 2: LA PETICIÓN VIENE DE NUESTRO FRONTEND (RIDER APP)
  // Viene del EditJobModal. Usa Clerk para validar que es nuestro cliente.
  // ----------------------------------------------------------------------
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.emailAddresses[0]?.emailAddress;
  const client = await prisma.client.findUnique({
    where: { email: email as string },
  });

  if (!client)
    return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const job = await prisma.job.findFirst({
    where: { id, client_id: client.id },
  });

  if (!job || job.status !== "PENDING") {
    return NextResponse.json(
      { error: "El trabajo no existe o ya no puede modificarse" },
      { status: 400 },
    );
  }

  // Actualizamos nuestra base de datos con los nuevos datos del cliente
  const updatedJob = await prisma.job.update({
    where: { id: job.id },
    data: {
      service_type: body.service_type ?? job.service_type,
      direction: body.direction ?? job.direction,
      description: body.description ?? job.description,
      lat: body.lat ?? job.lat,
      lng: body.lng ?? job.lng,
      requested_date: body.requested_date
        ? new Date(body.requested_date)
        : job.requested_date,
    },
  });

  // Le avisamos a Lautaro que nuestro cliente modificó el trabajo
  try {
    const driverUrl = process.env.DRIVER_APP_URL;
    if (driverUrl && secret) {
      await fetch(`${driverUrl}/api/jobs/${updatedJob.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({
          service_type: updatedJob.service_type,
          description: updatedJob.description,
          location: { lat: updatedJob.lat, lng: updatedJob.lng },
          urgency: updatedJob.urgency,
          requested_date: updatedJob.requested_date
            ? updatedJob.requested_date.toISOString()
            : null,
        }),
      });
    }
  } catch (error) {
    console.error("Error avisando a Driver App de la modificación", error);
  }

  return NextResponse.json(updatedJob);
}
