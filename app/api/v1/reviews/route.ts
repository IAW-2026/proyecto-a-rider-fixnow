import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  // Verificamos que el usuario logueado en tu frontend sea válido
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // Leemos lo que mandó tu modal de React
    const body = await request.json();
    const { jobId, professionalId, rating, comment } = body;

    const feedbackUrl = process.env.FEEDBACK_APP_URL;
    const secret = process.env.INTERNAL_API_SECRET;

    if (feedbackUrl && secret) {
      // Hacemos el puente hacia la app de Nacho
      const response = await fetch(`${feedbackUrl}/api/reviews/from-client`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({
          job_id: jobId,
          client_id: user.id, // O el id de tu base de datos de Prisma
          professional_id: professionalId,
          rating: rating,
          comment: comment,
        }),
      });

      if (!response.ok) {
        throw new Error("La app de Feedback rechazó la reseña");
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
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
