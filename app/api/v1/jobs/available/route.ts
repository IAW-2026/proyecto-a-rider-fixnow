// Para qué: Es el Endpoint 1 de tu documento. Sirve para que Lautaro consulte
// los turnos programados (urgency: "SCHEDULED", status: "PENDING").
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  // 1. Validar seguridad inter-servicios
  const authHeader = request.headers.get("Authorization");
  const secret = process.env.INTERNAL_API_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 2. Leer parámetros de la URL
  const { searchParams } = new URL(request.url);
  const service_type = searchParams.get("service_type");

  if (!service_type) {
    return NextResponse.json({ error: "Falta service_type" }, { status: 422 });
  }

  const serviceTypeMap: Record<string, "PLOMERIA" | "ELECTRICIDAD" | "GAS"> = {
    plomeria: "PLOMERIA",
    electricidad: "ELECTRICIDAD",
    gas: "GAS",
  };

  const prismaServiceType = serviceTypeMap[service_type.toLowerCase()];

  if (!prismaServiceType) {
    return NextResponse.json(
      { error: "service_type inválido" },
      { status: 422 },
    );
  }

  // 3. Buscar en la base de datos
  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: "PENDING",
        urgency: "SCHEDULED",
        service_type: prismaServiceType,
      },
      orderBy: { requested_date: "asc" }, // Ordenamos por los más próximos
    });

    // 4. Formatear la respuesta según el contrato
    const formattedJobs = jobs.map((job) => ({
      job_id: job.id,
      service_type: job.service_type.toLowerCase(),
      description: job.description,
      location: { lat: Number(job.lat), lng: Number(job.lng) },
      requested_date: job.requested_date
        ? job.requested_date.toISOString()
        : null,
      urgency: job.urgency.toLowerCase(),
      estimated_price: Number(job.estimated_price),
    }));

    return NextResponse.json({ jobs: formattedJobs });
  } catch (error) {
    console.error("Error fetching available jobs:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
