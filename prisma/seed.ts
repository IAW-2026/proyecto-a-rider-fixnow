import { ServiceType, JobUrgency, JobStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

function getJobStatus(index: number): JobStatus {
  if (index < 15) {
    return index % 2 === 0 ? JobStatus.PAID : JobStatus.CANCELLED;
  }
  const activeStatuses = [
    JobStatus.PENDING,
    JobStatus.ACCEPTED,
    JobStatus.IN_PROGRESS,
    JobStatus.COMPLETED,
    JobStatus.PAID,
    JobStatus.CANCELLED,
  ];
  return activeStatuses[(index - 15) % activeStatuses.length];
}

async function main() {
  console.log("🌱 Iniciando seed de Clientes, Jobs y Usuario de Prueba...");

  // --- 1. CARGA DEL USUARIO DE PRUEBA (PROFESORES) ---
  const testerClient = {
    id: "66f9c44b-3095-4012-b1e9-bcd9d51370ee",
    full_name: "Rider Tester 2",
    email: "rider2+clerk_test@iaw.com",
    direction: "Alem 123",
    phone: "2914675879",
  };

  await prisma.client.upsert({
    where: { email: testerClient.email },
    update: testerClient,
    create: testerClient,
  });
  console.log(`✅ Usuario de prueba (Profesor) cargado exitosamente.`);

  // --- 2. CARGA DE CLIENTES MOCK ---
  const newClientNames = [
    "Mateo Silva",
    "Valentina Costa",
    "Santiago Ruiz",
    "Camila Paz",
    "Lucas Herrera",
    "Martina Gomez",
    "Tomas Alonso",
    "Julieta Vega",
    "Nicolas Rojas",
    "Lucia Blanco",
    "Franco Medina",
    "Paula Castro",
    "Joaquin Ortiz",
    "Delfina Luna",
    "Agustin Gil",
  ];
  const clients = newClientNames.map((name, index) => ({
    id: `client-${(index + 4).toString().padStart(3, "0")}`,
    full_name: name,
    email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
    direction: `Calle Falsa ${100 + index}`,
    phone: `+54 9 11 2233-${(4000 + index).toString()}`,
  }));

  for (const client of clients) {
    await prisma.client.upsert({
      where: { email: client.email },
      update: {},
      create: client,
    });
  }
  console.log(`✅ ${clients.length} clientes mock creados.`);

  // --- 3. LISTA DE PROFESIONALES ---
  const professionals = [
    { id: "prof-julio", type: ServiceType.PLOMERIA },
    { id: "prof-camila", type: ServiceType.ELECTRICIDAD },
    { id: "prof-diego", type: ServiceType.GAS },
    { id: "prof-sofia", type: ServiceType.PLOMERIA },
    { id: "prof-nicolas", type: ServiceType.ELECTRICIDAD },
    { id: "prof-valeria", type: ServiceType.GAS },
    { id: "prof-martin", type: ServiceType.PLOMERIA },
    { id: "user_3EYemLF8a3fUCHbCIE70ayra8nT", type: ServiceType.GAS },
    { id: "user_3DxYRYVCndXOSf04E0kum8vfk5O", type: ServiceType.GAS },
    { id: "user_3EYqDmV4wSgR0Tjk0glP0k3C5a8", type: ServiceType.ELECTRICIDAD },
    { id: "prof-ana", type: ServiceType.PLOMERIA },
    { id: "prof-luis", type: ServiceType.ELECTRICIDAD },
    { id: "prof-maria", type: ServiceType.GAS },
  ];

  // --- 4. TRABAJOS DEL USUARIO DE PRUEBA ---
  const testerJobs = [
    {
      id: "job-test-001",
      client_id: testerClient.id,
      professional_id: professionals[0].id, // Plomero
      service_type: professionals[0].type,
      description: "Reparación de pérdida de agua en la cocina",
      direction: testerClient.direction,
      lat: -38.71,
      lng: -62.26,
      requested_date: new Date(Date.now() - 10 * 86400000), // Hace 10 días
      urgency: JobUrgency.SCHEDULED,
      status: JobStatus.PAID, // Trabajo histórico completado y pagado
      estimated_price: 25000,
    },
    {
      id: "job-test-002",
      client_id: testerClient.id,
      professional_id: professionals[1].id, // Electricista
      service_type: professionals[1].type,
      description: "Cortocircuito en el tablero principal",
      direction: testerClient.direction,
      lat: -38.715,
      lng: -62.265,
      requested_date: new Date(Date.now() - 2 * 86400000), // Hace 2 días
      urgency: JobUrgency.IMMEDIATE,
      status: JobStatus.CANCELLED,
      estimated_price: 15000,
      cancelled_at: new Date(Date.now() - 1 * 86400000), // Cancelado ayer
      cancellation_reason:
        "El profesional no pudo llegar a tiempo por el tráfico.",
    },
    {
      id: "job-test-003",
      client_id: testerClient.id,
      professional_id: null, // PENDING no tiene profesional
      service_type: ServiceType.GAS,
      description:
        "Revisión y encendido de calefactores por llegada del invierno",
      direction: testerClient.direction,
      lat: -38.72,
      lng: -62.27,
      requested_date: new Date(), // Pedido hoy
      urgency: JobUrgency.SCHEDULED,
      status: JobStatus.PENDING, // Activo, esperando que alguien lo acepte
      estimated_price: 18500,
    },
  ];

  for (const job of testerJobs) {
    await prisma.job.upsert({
      where: { id: job.id },
      update: job,
      create: job,
    });
  }
  console.log(`✅ 3 Trabajos de prueba creados para el Profesor.`);

  // --- 5. CARGA DE TRABAJOS MOCK ---
  const jobs = Array.from({ length: 30 }).map((_, i) => {
    const client = clients[i % clients.length];
    const prof = professionals[i % professionals.length];
    const status = getJobStatus(i);
    const isPending = status === JobStatus.PENDING;

    return {
      id: `job-new-${(i + 1).toString().padStart(3, "0")}`,
      client_id: client.id,
      professional_id: !isPending ? prof.id : null,
      service_type: prof.type,
      description: `Trabajo de mantenimiento general #${i + 1}`,
      direction: client.direction,
      lat: -38.7 + Math.random() * 0.1,
      lng: -62.2 + Math.random() * 0.1,
      requested_date: new Date(Date.now() - (30 - i) * 86400000),
      urgency: i % 3 === 0 ? JobUrgency.IMMEDIATE : JobUrgency.SCHEDULED,
      status: status,
      estimated_price: Math.floor(Math.random() * 50000) + 10000,
    };
  });

  for (const job of jobs) {
    await prisma.job.upsert({
      where: { id: job.id },
      update: {},
      create: job,
    });
  }
  console.log(`✅ ${jobs.length} trabajos mock creados.`);
  console.log("🌱 Seed finalizado exitosamente.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
