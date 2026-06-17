import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  // Acá en el futuro harías el fetch real a la API de tu compañero
  console.log("Feedback simulado enviado exitosamente:", body);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return NextResponse.json({
    success: true,
    message: "¡Gracias! Tu feedback ayuda a mejorar FixNow.",
  });
}
