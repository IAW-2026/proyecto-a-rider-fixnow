import { Phone } from "lucide-react";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const feedbackUrl = process.env.FEEDBACK_APP_URL;
  const driverUrl = process.env.DRIVER_APP_URL;
  const secret = process.env.INTERNAL_API_SECRET;

  try {
    if (!feedbackUrl || !driverUrl || !secret) {
      return NextResponse.json(
        { error: "Faltan variables de entorno" },
        { status: 500 },
      );
    }

    const [feedbackResponse, driverResponse] = await Promise.all([
      fetch(`${feedbackUrl}/api/reviews/professionals/${id}`, {
        headers: { Authorization: `Bearer ${secret}` },
      }),
      fetch(`${driverUrl}/api/professionals/${id}`, {
        headers: { Authorization: `Bearer ${secret}` },
      }),
    ]);

    // 1. Si Lautaro no encuentra al profesional, cortamos acá.
    if (!driverResponse.ok) {
      const errorBody = await driverResponse.text();
      console.error(`Fallo Lauti: ${errorBody}`);

      // Si Lautaro devuelve 404 o un error de "no encontrado"
      if (
        driverResponse.status === 404 ||
        errorBody.includes("No professional")
      ) {
        return NextResponse.json(
          { error: "El profesional no existe o fue eliminado." },
          { status: 404 },
        );
      }

      throw new Error("Error interno al consultar la aplicación de Drivers");
    }

    const driverData = await driverResponse.json();

    // 1. Manejo tolerante de las reseñas (Feedback)
    let feedbackData: any = { rating: 5, total_reviews: 0, reviews: [] };

    if (feedbackResponse.ok) {
      const json = await feedbackResponse.json();

      // Nacho manda 'average_rating', tu app esperaba 'rating'
      feedbackData.rating = json.average_rating || 5;
      feedbackData.total_reviews = json.total_reviews || 0;

      // Traducimos el array de reseñas
      if (json.reviews && Array.isArray(json.reviews)) {
        feedbackData.reviews = json.reviews.map((r: any) => ({
          id: r.review_id, // Nacho usa review_id
          author: r.reviewer_id.substring(0, 8) + "...", // Como no tenemos su nombre, mostramos parte del ID o "Cliente"
          rating: r.rating,
          comment: r.comment,
          // Convertimos el string de la fecha en algo legible (ej: 20/06/2026)
          date: r.created_at
            ? new Date(r.created_at).toLocaleDateString("es-AR")
            : "Fecha desconocida",
        }));
      }
    } else {
      console.warn(
        `Feedback App no devolvió OK. Status: ${feedbackResponse.status}`,
      );
    }

    // 2. Extraemos los datos de Lautaro de forma segura
    const profInfo = driverData.professional || {};

    // Concatenamos el nombre y apellido si existen
    const fullName =
      profInfo.firstName && profInfo.lastName
        ? `${profInfo.firstName} ${profInfo.lastName}`
        : profInfo.firstName || profInfo.lastName || "Profesional FixNow";

    // 3. Unificamos la respuesta para tu frontend
    return NextResponse.json({
      id: id, // Usamos el ID que viene por parámetro en la ruta
      full_name: fullName,
      service_type: profInfo.serviceType || "No especificado",
      is_verified: true, // Podemos dejarlo en true por defecto si Lautaro no te manda este dato
      phone: profInfo.phoneNumber || "Sin teléfono registrado",
      jobs_completed: 0, // Idem, por defecto si no lo manda
      rating: profInfo.rating || feedbackData.rating, // Si Lautaro manda un rating general, lo usamos
      total_reviews: feedbackData.total_reviews,
      reviews: feedbackData.reviews,
    });
  } catch (error) {
    console.error("Error orquestando datos del profesional:", error);
    return NextResponse.json(
      { error: "Error al obtener datos del profesional" },
      { status: 500 },
    );
  }
}
