//Para qué: Para alimentar los gráficos de tus Dashboards.
// Un prisma.job.findMany() puro y duro sin filtrar por cliente,
// protegido por la key de Analytics.
// Este lo vas a consumir VOS MISMA desde el Analytics Dashboard
// para armar los gráficos y sacar las estadísticas globales de la plataforma

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  // 1. Validar seguridad inter-servicios (Dashboards -> Rider App)
  const authHeader = request.headers.get("Authorization");
  const secret = process.env.ANALYTICS_SECRET_KEY;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // 2. Traer ABSOLUTAMENTE TODO (sin filtrar por cliente)
    const allJobs = await prisma.job.findMany({
      orderBy: {
        id: "desc", // Ordenamos desde el más nuevo al más viejo
      },
    });

    // 3. Mapear para asegurarnos que los decimales viajen como números
    const formattedJobs = allJobs.map((job) => ({
      id: job.id,
      client_id: job.client_id,
      professional_id: job.professional_id,
      service_type: job.service_type,
      urgency: job.urgency,
      status: job.status,
      estimated_price: Number(job.estimated_price),
      cancellation_reason: job.cancellation_reason,
      cancellation_payment_required: job.cancellation_payment_required,
      requested_date: job.requested_date,
      cancelled_at: job.cancelled_at,
      location: {
        lat: Number(job.lat),
        lng: Number(job.lng),
      },
    }));

    // 4. Entregar los datos consolidados
    return NextResponse.json({
      total_records: formattedJobs.length,
      data: formattedJobs,
    });
  } catch (error) {
    console.error("Error en Admin Jobs Endpoint:", error);
    return NextResponse.json(
      { error: "Error obteniendo datos globales" },
      { status: 500 },
    );
  }
}
