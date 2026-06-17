import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  await new Promise((resolve) => setTimeout(resolve, 800));

  // Simulamos una base de datos de Feedback alineada con Driver App
  const professionalsDB: Record<string, any> = {
    "prof-plomeria-001": {
      id: "prof-plomeria-001",
      full_name: "Mario Beder",
      email: "mario@fixnow.com",
      service_type: "plomeria",
      rating: 4.8,
      is_available: true,
      is_verified: true,
      phone: "+54 9 291 111 2222", // Info extra útil para el perfil
      jobs_completed: 142,
    },
    "prof-electricidad-002": {
      id: "prof-electricidad-002",
      full_name: "Nicolas Lopez",
      email: "nicolas@fixnow.com",
      service_type: "electricidad",
      rating: 4.9,
      is_available: true,
      is_verified: true,
      phone: "+54 9 291 333 4444",
      jobs_completed: 89,
    },
    "prof-gas-003": {
      id: "prof-gas-003",
      full_name: "Walter Rubio",
      email: "walter@fixnow.com",
      service_type: "gas",
      rating: 4.5,
      is_available: true,
      is_verified: false,
      phone: "+54 9 291 555 6666",
      jobs_completed: 56,
    },
  };

  const professional = professionalsDB[id] || {
    id: id,
    full_name: "Profesional Asignado",
    email: "contacto@fixnow.com",
    service_type: "plomeria",
    rating: 4.0,
    is_available: true,
    is_verified: false,
    phone: "No disponible",
    jobs_completed: 10,
  };

  // Añadimos reseñas falsas para la demo
  const responseData = {
    ...professional,
    reviews: [
      {
        id: 1,
        author: "María G.",
        rating: 5,
        comment: "Excelente, muy prolijo.",
        date: "2026-05-15",
      },
      {
        id: 2,
        author: "Carlos M.",
        rating: 4,
        comment: "Arregló el problema a la perfección.",
        date: "2026-05-02",
      },
    ],
  };

  return NextResponse.json(responseData);
}
