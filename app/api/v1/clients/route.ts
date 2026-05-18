import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fullName, address } = await req.json();
  const email = user.emailAddresses[0]?.emailAddress;

  if (!email || !fullName || !address) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const client = await prisma.client.upsert({
    where: { email },
    update: { full_name: fullName, direction: address },
    create: { full_name: fullName, email, direction: address },
  });

  return NextResponse.json({ data: client }, { status: 200 });
}

//upsert significa "si existe, actualiza; si no existe, crea"
// Funciona bien porque el email del usuario ya viene de Clerk,
// el email es unico en la tabla de Client,
// si el usuario completa el perfil por primera vez, se crea un nuevo registro
// si vuelve a pasar por este flujo, se actualiza el mismo registro
