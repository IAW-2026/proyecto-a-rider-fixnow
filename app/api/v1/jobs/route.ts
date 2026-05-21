import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // 1- Seguridad, quién está pidiento esto?
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    const fullName =
      user.fullName ??
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    const address = user.unsafeMetadata?.address;

    if (!email || !fullName || !address || typeof address !== "string") {
      return NextResponse.json(
        { error: "Complete profile required before creating a job" },
        { status: 400 },
      );
    }

    const client = await prisma.client.upsert({
      where: { email },
      update: {
        full_name: fullName,
        direction: address,
      },
      create: {
        full_name: fullName,
        email,
        direction: address,
      },
    });

    // 2- Leer el paquete que mando el Frontend
    const body = await req.json();

    // Extraemos los datos que el frontend recolecto del modal
    const { service_type, description, lat, lng, urgency } = body;
    let requested_date = body.requested_date;

    const serviceTypeMap: Record<string, "PLOMERIA" | "ELECTRICIDAD" | "GAS"> =
      {
        plomeria: "PLOMERIA",
        electricidad: "ELECTRICIDAD",
        gas: "GAS",
      };

    const urgencyMap: Record<string, "IMMEDIATE" | "SCHEDULED"> = {
      immediate: "IMMEDIATE",
      scheduled: "SCHEDULED",
    };

    const prismaServiceType = serviceTypeMap[service_type];
    const prismaUrgency = urgencyMap[urgency];

    // 3- Validaciones de Negocio
    // 3-A Validar que no faltan datos obligatorios
    // requested_date solo es obligatorio cuando la urgencia es 'scheduled'
    if (
      !service_type ||
      !description ||
      lat === undefined ||
      lng === undefined ||
      !urgency
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!prismaServiceType) {
      return NextResponse.json(
        { error: "Invalid service type" },
        { status: 400 },
      );
    }

    if (!prismaUrgency) {
      return NextResponse.json({ error: "Invalid urgency" }, { status: 400 });
    }

    // 3-B Validar la logica de la fecha
    // Si la urgencia es programada, DEBE venir una fecha futura
    if (prismaUrgency === "SCHEDULED" && !requested_date) {
      return NextResponse.json(
        { error: "Scheduled jobs require a future date" },
        { status: 400 },
      );
    }

    if (prismaUrgency === "SCHEDULED") {
      const scheduledDate = new Date(requested_date);

      if (Number.isNaN(scheduledDate.getTime())) {
        return NextResponse.json(
          { error: "Requested date must be a valid date" },
          { status: 400 },
        );
      }

      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: "Scheduled date must be in the future" },
          { status: 400 },
        );
      }

      const hour = scheduledDate.getHours();
      if (hour < 8 || hour >= 18) {
        return NextResponse.json(
          { error: "Scheduled date must be between 8am and 6pm" },
          { status: 400 },
        );
      }
    }

    if (prismaUrgency === "IMMEDIATE") {
      const now = new Date();
      const hour = now.getHours();
      requested_date = now; // For immediate jobs, we set the requested_date to now

      if (hour < 8 || hour >= 18) {
        return NextResponse.json(
          { error: "Immediate jobs can only be created between 8am and 6pm" },
          { status: 400 },
        );
      }
    }

    // Convertimos el string de fecha que manda el frontend a un objeto Date real para Prisma
    const parsedDate = requested_date ? new Date(requested_date) : null;

    // Validar lat/lng numéricos
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      return NextResponse.json(
        { error: "Invalid latitude or longitude" },
        { status: 400 },
      );
    }

    // 4- Generar datos calculados por el sistema
    // Todo trabajo nuevo nace con el estado "pendiente"
    const initialStatus = "PENDING";

    // Como es mockup, por ahora inventamos un precio estimado.
    // En el futuro, esto deberia venir del profesional una vez que acepta el job (endpoint de driver app como mockup)
    const estimated_price = 15000.0;

    // 5- Guardar en la BD
    const newJob = await prisma.job.create({
      data: {
        client_id: client.id,
        service_type: prismaServiceType,
        description: description,
        lat: latNum,
        lng: lngNum,
        urgency: prismaUrgency,
        requested_date: parsedDate, // Puede ser null si la urgencia es inmediata
        status: initialStatus,
        estimated_price: estimated_price,
        // professional_id, cancelled_at y cancellation_reason quedan null al crear
      },
    });

    // 6- El paso futuro, avisarle a la driver app
    /* TODO: Según tu diseño de APIs, acá tendrías que hacer un 'fetch' a la 
        Driver App (ej: POST https://driver-app.com/api/jobs) para mandarle 
        este nuevo Job y que empiece a buscar profesionales.
        Por ahora lo dejamos comentado hasta que Lautaro termine su parte.
        */

    // Devolvemos exito al frontend con los datos del trabajo creado
    return NextResponse.json(
      { message: "Job created successfully", data: newJob },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
