//Para qué: Es el Endpoint 3 de tu documento.
// Es la "puerta" que le dejás abierta a Chiara para que te avise
// "Che Cata, el cliente ya pagó el Job en MercadoPago",
// así vos podés cambiar el estado en tu base de datos a PAID.
// La aplicación de Chiara (Payments) va a "golpear" acá cuando
// la tarjeta del cliente pase con éxito.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // 2. Validar que el pago haya sido exitoso
    if (body.status !== "paid") {
      return NextResponse.json(
        { error: "El estado del pago no es válido" },
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

    // 4. Actualizar estado. Si era una multa por cancelación, mantenemos el estado CANCELLED pero quitamos la deuda.
    // Si era un trabajo normal, lo pasamos a PAID.
    const isCancelled = job.status === "CANCELLED";

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        status: isCancelled ? "CANCELLED" : "PAID",
        cancellation_payment_required: false,
      },
    });

    return NextResponse.json(
      {
        message: "Pago confirmado y procesado exitosamente",
        job_id: updatedJob.id,
        status: updatedJob.status,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error confirmando pago:", error);
    return NextResponse.json(
      { error: "Error procesando la confirmación de pago" },
      { status: 500 },
    );
  }
}
