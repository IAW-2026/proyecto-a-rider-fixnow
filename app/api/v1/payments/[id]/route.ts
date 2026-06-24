import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getAuthenticatedClient() {
  const user = await currentUser();
  if (!user)
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email)
    return {
      error: NextResponse.json({ error: "Client not found" }, { status: 404 }),
    };

  const client = await prisma.client.findUnique({ where: { email } });
  if (!client)
    return {
      error: NextResponse.json({ error: "Client not found" }, { status: 404 }),
    };

  return { client, clerkId: user.id };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { client, clerkId, error } = await getAuthenticatedClient();
  if (error) return error;

  const { id } = await params;

  // 1. Buscamos el trabajo en nuestra base de datos
  const job = await prisma.job.findFirst({
    where: {
      id: id,
      client_id: client.id,
    },
  });

  if (!job) {
    return NextResponse.json(
      { error: "Trabajo no encontrado" },
      { status: 404 },
    );
  }

  if (!job.professional_id) {
    return NextResponse.json(
      { error: "El trabajo no tiene un profesional asignado" },
      { status: 400 },
    );
  }

  let finalAmount = Number(job.estimated_price);

  // Si el trabajo fue cancelado y requiere pago, cobramos la multa (20% o mínimo $1000)
  if (job.status === "CANCELLED" && job.cancellation_payment_required) {
    finalAmount = Math.max(1000, Math.round(Number(job.estimated_price) * 0.2));
  }

  // 2. Conectamos con el servidor de Chiara
  const paymentsUrl = process.env.PAYMENTS_APP_URL;
  const secret = process.env.INTERNAL_API_SECRET;

  if (!paymentsUrl || !secret) {
    return NextResponse.json(
      { error: "Faltan variables de entorno de configuración" },
      { status: 500 },
    );
  }

  try {
    // 3. Enviamos los datos según el contrato de la Etapa 3
    const response = await fetch(`${paymentsUrl}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        job_id: job.id,
        client_id: clerkId, // Enviamos el ID de Clerk o el de Prisma según hayan acordado
        professional_id: job.professional_id,
        amount: finalAmount,
        commission_rate: 0.1, // 10% de comisión para FixNow
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || "La aplicación de pagos rechazó la solicitud",
      );
    }

    const paymentData = await response.json();

    // Extraemos la ruta que devuelve Chiara
    let checkoutUrl =
      paymentData.checkout_url || paymentData.url || paymentData.init_point;

    if (!checkoutUrl) {
      throw new Error(
        "La aplicación de pagos no devolvió una URL de redirección.",
      );
    }

    // ARREGLO: Si Chiara nos mandó una ruta relativa, la convertimos en URL absoluta
    if (!checkoutUrl.startsWith("http")) {
      // Le quitamos la barra final a paymentsUrl por si la tiene (ej: "http://localhost:3001/")
      const baseUrl = paymentsUrl.replace(/\/$/, "");
      // Nos aseguramos de que el path arranque con barra
      const path = checkoutUrl.startsWith("/")
        ? checkoutUrl
        : `/${checkoutUrl}`;

      // Armamos el link completo
      checkoutUrl = `${baseUrl}${path}`;
    }

    // 4. Devolvemos la URL absoluta y lista para usar a tu Frontend
    return NextResponse.json(
      {
        message: "Redirigiendo a pagos...",
        payment_id: paymentData.payment_id,
        checkout_url: checkoutUrl,
        status: "PROCESSING",
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("Error conectando con Payments App:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
