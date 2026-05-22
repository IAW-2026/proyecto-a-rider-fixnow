"use client";

import {
  Calendar,
  Clock,
  Droplets,
  Zap,
  Flame,
  MapPin,
  AlertCircle,
} from "lucide-react";

type ScheduledJob = {
  id: string;
  service_type: string;
  description: string;
  status: string;
  estimated_price: number;
  requested_date: string | null;
  professional_id: string | null;
};

interface ScheduledJobsViewProps {
  jobs: ScheduledJob[];
}

const getServiceIcon = (type: string) => {
  if (type === "ELECTRICIDAD")
    return <Zap className="size-5 text-electrical" />;
  if (type === "GAS") return <Flame className="size-5 text-gas" />;
  return <Droplets className="size-5 text-plumbing" />;
};

const getStatusBadge = (status: string) => {
  switch (status.toUpperCase()) {
    case "PENDING":
      return (
        <span className="rounded bg-amber-400/20 px-2 py-1 text-xs font-medium text-amber-300">
          Esperando Confirmación
        </span>
      );
    case "ACCEPTED":
      return (
        <span className="rounded bg-blue-400/20 px-2 py-1 text-xs font-medium text-blue-300">
          Profesional Confirmado
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="rounded bg-green-400/20 px-2 py-1 text-xs font-medium text-green-300">
          En Proceso
        </span>
      );
    case "COMPLETED":
      return (
        <span className="rounded bg-slate-600 px-2 py-1 text-xs font-medium text-slate-300">
          Trabajo Realizado
        </span>
      );
    default:
      return null;
  }
};

export function ScheduledJobsView({ jobs }: ScheduledJobsViewProps) {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Servicios Programados
        </h1>
        <p className="mt-1 text-lg text-slate-400">
          Gestioná tus turnos reservados para los próximos días
        </p>
      </div>

      {/* Mensaje de estado en desarrollo para el profesor */}
      <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
        <AlertCircle className="size-5 text-amber-400 shrink-0" />
        <p className="text-sm font-medium">
          <span className="font-bold">Vista de Presentación:</span> Los datos se
          renderizan dinámicamente desde la base de datos. Las acciones de
          reprogramación y cancelación de turnos están en desarrollo.
        </p>
      </div>

      {jobs.length === 0 ? (
        /* ESTADO VACÍO */
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-700 text-slate-400 mb-4">
            <Calendar className="size-6" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">
            No tenés servicios programados
          </h3>
          <p className="text-slate-400">
            Al solicitar un servicio inmediato o programado desde el Inicio,
            verás tus reservas futuras acá.
          </p>
        </div>
      ) : (
        /* GRILLA DE TARJETAS */
        <div className="grid gap-6 sm:grid-cols-2">
          {jobs.map((job) => {
            const jobDate = job.requested_date
              ? new Date(job.requested_date)
              : null;

            return (
              <div
                key={job.id}
                className="flex flex-col justify-between rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm transition-all hover:border-slate-600"
              >
                <div className="space-y-4">
                  {/* Fila superior: Ícono, Título y Estado */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-slate-900 border border-slate-700">
                        {getServiceIcon(job.service_type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white capitalize">
                          {job.service_type}
                        </h3>
                        <p className="text-xs text-slate-500">
                          ID: {job.id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>

                  {/* Descripción */}
                  <p className="text-sm text-slate-300 line-clamp-2 bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                    {job.description}
                  </p>

                  {/* Cuadro destacado de Fecha y Hora */}
                  <div className="flex flex-col gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <div className="flex items-center gap-2 text-sm text-amber-400 font-medium">
                      <Calendar className="size-4" />
                      <span>
                        {jobDate
                          ? jobDate.toLocaleDateString("es-AR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })
                          : "Fecha no definida"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Clock className="size-4 text-slate-400" />
                      <span>
                        A las{" "}
                        {jobDate
                          ? jobDate.toLocaleTimeString("es-AR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Horario no definido"}{" "}
                        hs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer de la tarjeta con precio y botones mockeados de control */}
                <div className="mt-6 flex items-center justify-between border-t border-slate-700 pt-4">
                  <div>
                    <span className="block text-xs text-slate-500">
                      Presupuesto estimado
                    </span>
                    <span className="text-lg font-bold text-amber-300">
                      ${job.estimated_price.toLocaleString("es-AR")}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      disabled
                      className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed"
                    >
                      Reprogramar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
