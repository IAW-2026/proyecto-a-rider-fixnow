import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const secretKey = process.env.ANALYTICS_SECRET_KEY;

    if (!secretKey) {
      console.error('Analytics auth secret is not configured.');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (token !== secretKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const totalUsuarios = await prisma.client.count();

    const jobs = await prisma.job.findMany({
      orderBy: {
        id: 'desc',
      },
      select: {
        id: true,
        professional_id: true,
        status: true,
        service_type: true,
        requested_date: true,
        cancelled_at: true,
        cancellation_reason: true,
      },
    });

    return NextResponse.json({
      totalUsuarios,
      jobs: jobs.map((job) => ({
        id: job.id,
        professionalId: job.professional_id,
        status: job.status,
        serviceType: job.service_type,
        requestDate: job.requested_date ? job.requested_date.toISOString() : null,
        cancelledAt: job.cancelled_at ? job.cancelled_at.toISOString() : null,
        cancelationReason: job.cancellation_reason,
      })),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
