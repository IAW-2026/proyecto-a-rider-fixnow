import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Cambiamos el estado a "paid"
  const updatedJob = await prisma.job.update({
    where: { id },
    data: { status: "PAID" },
  });

  return NextResponse.json({ status: updatedJob.status });
}
