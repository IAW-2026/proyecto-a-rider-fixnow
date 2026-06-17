//Para qué:
// Sirve para que él te mande un professional_id y vos le devuelvas todos los
// trabajos de tu base de datos que ese profesional haya completado o cancelado.

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
  const professionalId = searchParams.get("professional_id");

  if (!professionalId) {
    return NextResponse.json(
      { error: "Falta professional_id" },
      { status: 400 },
    );
  }

  try {
    // 3. Buscar trabajos de ese profesional que ya no estén activos
    const jobs = await prisma.job.findMany({
      where: {
        professional_id: professionalId,
        status: {
          in: ["COMPLETED", "PAID", "CANCELLED"],
        },
      },
      orderBy: {
        id: "desc", // Los más recientes primero
      },
    });

    return NextResponse.json({
      professional_id: professionalId,
      total_history: jobs.length,
      jobs: jobs.map((job) => ({
        job_id: job.id,
        service_type: job.service_type.toLowerCase(),
        description: job.description,
        status: job.status.toLowerCase(),
        estimated_price: Number(job.estimated_price),
        requested_date: job.requested_date
          ? job.requested_date.toISOString()
          : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching job history:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
