import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const feedbackUrl = process.env.FEEDBACK_APP_URL;
    const driverUrl = process.env.DRIVER_APP_URL; // Agregamos la URL de Lautaro
    const secret = process.env.INTERNAL_API_SECRET;

    if (!feedbackUrl || !driverUrl || !secret) {
      return NextResponse.json(
        { error: "Faltan variables de entorno" },
        { status: 500 },
      );
    }

    // Hacemos las DOS consultas en paralelo para que sea súper rápido (API Composition)
    const [feedbackResponse, driverResponse] = await Promise.all([
      fetch(`${feedbackUrl}/api/reviews/professionals/${id}`, {
        headers: { Authorization: `Bearer ${secret}` },
      }),
      fetch(`${driverUrl}/api/professionals/${id}`, {
        // El endpoint nuevo que le pediste a Lauti
        headers: { Authorization: `Bearer ${secret}` },
      }),
    ]);

    if (!feedbackResponse.ok)
      console.error("Fallo Nacho:", await feedbackResponse.text());
    if (!driverResponse.ok)
      console.error("Fallo Lauti:", await driverResponse.text());

    if (!feedbackResponse.ok || !driverResponse.ok) {
      throw new Error("Error al obtener datos de los microservicios");
    }

    const feedbackData = await feedbackResponse.json();
    const professionalProfile = await driverResponse.json();

    // Armamos el "Frankenstein" con datos 100% reales de ambos servidores
    return NextResponse.json({
      id: id,
      full_name: professionalProfile.full_name,
      email: professionalProfile.email,
      service_type: professionalProfile.service_type,
      phone: professionalProfile.phone,
      is_verified: professionalProfile.is_verified,

      rating: feedbackData.average_rating,
      jobs_completed: feedbackData.total_reviews,
      reviews: feedbackData.reviews.map((r: any) => ({
        id: r.review_id,
        author: "Cliente FixNow", // Opcional: Podrías cruzar esto con Prisma si guardaste los nombres de tus clientes
        rating: r.rating,
        comment: r.comment,
        date: new Date(r.created_at).toLocaleDateString("es-AR"),
      })),
    });
  } catch (error) {
    console.error("Error orquestando datos del profesional:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
