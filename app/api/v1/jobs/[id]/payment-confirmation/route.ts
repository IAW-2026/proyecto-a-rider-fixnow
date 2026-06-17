import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. Validar seguridad inter-servicios
  const authHeader = request.headers.get("Authorization");
  const secret = process.env.INTERNAL_API_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();

    // 2. Validar que el pago haya sido exitoso (Según el JSON que te manda Chiara)
    if (body.status !== "paid") {
      return NextResponse.json(
        { error: "El estado del pago no es válido o está pendiente" },
        { status: 400 },
      );
    }

    // 3. Buscar el trabajo original
    const job = await prisma.job.findUnique({ where: { id } });

    if (!job) {
      return NextResponse.json(
        { error: "Trabajo no encontrado" },
        { status: 404 },
      );
    }

    // 4. Actualizar la base de datos oficial
    const isCancelled = job.status === "CANCELLED";

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        status: isCancelled ? "CANCELLED" : "PAID",
        cancellation_payment_required: false,
      },
    });

    // 5. Limpiamos la caché de Next.js para que tu app web refleje el nuevo estado
    revalidatePath("/dashboard/active");
    revalidatePath("/dashboard/history");

    return NextResponse.json(
      {
        message: "Pago confirmado y procesado exitosamente",
        job_id: updatedJob.id,
        status: updatedJob.status,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error procesando el Webhook de pago:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar el pago" },
      { status: 500 },
    );
  }
}
