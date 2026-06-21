import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  // 1. Verificamos que el usuario logueado sea válido
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { jobId, rating, comment } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "Falta el ID del trabajo" },
        { status: 400 },
      );
    }

    // 2. Buscamos el trabajo en nuestra DB para sacar el professional_id real
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job || !job.professional_id) {
      return NextResponse.json(
        { error: "Trabajo inválido o sin profesional asignado" },
        { status: 400 },
      );
    }

    const feedbackUrl = process.env.FEEDBACK_APP_URL;
    const secret = process.env.INTERNAL_API_SECRET;

    if (feedbackUrl && secret) {
      // 3. Hacemos el puente hacia la app de Feedback con los datos seguros de la DB
      const response = await fetch(`${feedbackUrl}/api/reviews/from-client`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({
          job_id: job.id,
          client_id: user.id, // O usá "client.id" si acordaron usar el ID de tu tabla Prisma en vez del de Clerk
          professional_id: job.professional_id, // Extraído de forma segura de tu DB
          rating: rating,
          comment: comment,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Feedback App rechazó con status ${response.status}:`,
          errorText,
        );

        const textLower = errorText.toLowerCase();
        if (
          response.status === 409 ||
          textLower.includes("already") ||
          textLower.includes("exist") ||
          textLower.includes("ya")
        ) {
          return NextResponse.json(
            { error: "ALREADY_REVIEWED" },
            { status: 400 },
          );
        }

        throw new Error(`La app de Feedback rechazó la reseña: ${errorText}`);
      }

      const data = await response.json();
      return NextResponse.json(data, { status: 201 });
    } else {
      return NextResponse.json(
        { error: "Faltan variables de entorno" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error enviando reseña a Feedback App:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
