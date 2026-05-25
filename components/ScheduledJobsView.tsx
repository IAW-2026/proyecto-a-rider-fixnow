"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Droplets,
  Zap,
  Flame,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";

// --- TIPOS DE DATOS ---
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

type CancellationReason =
  | "MUCHO_TIEMPO_ESPERA"
  | "VALOR_TRABAJO_ALTO"
  | "CAMBIE_DE_OPINION"
  | "YA_NO_LO_NECESITO";

const CANCELLATION_REASONS = [
  {
    value: "MUCHO_TIEMPO_ESPERA",
    title: "Mucho tiempo de espera",
    description:
      "El profesional tardó más de lo esperado en llegar o responder.",
  },
  {
    value: "VALOR_TRABAJO_ALTO",
    title: "Valor del trabajo alto",
    description: "El presupuesto final no me resultó conveniente.",
  },
  {
    value: "CAMBIE_DE_OPINION",
    title: "Cambié de opinión",
    description: "Ya no necesito continuar con el servicio solicitado.",
  },
  {
    value: "YA_NO_LO_NECESITO",
    title: "Ya no lo necesito",
    description: "El problema se resolvió por otro medio.",
  },
] as const;

type PaymentFlow = {
  kind: "job" | "penalty";
  amount: number;
  title: string;
  description: string;
};

// --- FUNCIONES AUXILIARES VISUALES ---
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
    default:
      return null;
  }
};

export function ScheduledJobsView({ jobs }: ScheduledJobsViewProps) {
  const router = useRouter();

  // Estados para la Simulación y API
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoCancelled, setAutoCancelled] = useState<string[]>([]);

  // Estados para el Modal de Cancelación Manual
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] =
    useState<CancellationReason>("CAMBIE_DE_OPINION");

  // Estados para el Modal de Pago (Multas)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentFlow, setPaymentFlow] = useState<PaymentFlow | null>(null);

  // --------------------------------------------------------
  // LÓGICA DE SIMULACIÓN (Demos)
  // --------------------------------------------------------

  // 1. Un profesional toma el turno
  const simulateAccept = async (id: string) => {
    setIsSyncing(true);
    try {
      await fetch(`/api/v1/driver-mock/${id}`, { method: "POST" });
      router.refresh();
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. Llega el día y la hora del turno
  const simulateTimeArrived = async (id: string, status: string) => {
    setIsSyncing(true);
    try {
      if (status === "PENDING") {
        // AUTO-CANCELACIÓN: Nadie lo tomó.
        await fetch(`/api/v1/driver-mock/${id}/cancel-job`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "MUCHO_TIEMPO_ESPERA" }),
        });
        setAutoCancelled((prev) => [...prev, id]); // Activamos la UI de auto-cancelado
      } else if (status === "ACCEPTED") {
        // EN PROGRESO: El profesional llegó a tu casa.
        await fetch(`/api/v1/driver-mock/${id}`, { method: "POST" });
        router.push("/dashboard/active"); // Salta a seguimiento en vivo
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // --------------------------------------------------------
  // LÓGICA DE CANCELACIÓN MANUAL Y MULTAS
  // --------------------------------------------------------

  const handleCancelClick = (id: string) => {
    setSelectedJobId(id);
    setIsCancelModalOpen(true);
  };

  const confirmCancellation = async () => {
    if (!selectedJobId) return;
    setIsSyncing(true);

    try {
      const response = await fetch(
        `/api/v1/driver-mock/${selectedJobId}/cancel-job`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: selectedReason }),
        },
      );

      const data = await response.json();
      setIsCancelModalOpen(false);

      // Si el trabajo ya estaba "ACCEPTED", requiere pago de multa
      if (data.requires_payment) {
        setPaymentFlow({
          kind: "penalty",
          amount: data.penalty_amount,
          title: "Pago de multa",
          description:
            "La cancelación genera una multa porque el trabajo ya estaba asignado a un profesional.",
        });
        setIsPaymentModalOpen(true);
      } else {
        // Si estaba PENDING, se cancela gratis y desaparece.
        router.refresh();
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const confirmPayment = async () => {
    if (!selectedJobId) return;
    setIsSyncing(true);
    try {
      await fetch(`/api/v1/driver-mock/${selectedJobId}/simulate-payment`, {
        method: "POST",
      });
      setIsPaymentModalOpen(false);
      router.refresh();
      // Lo mandamos a la Home para que salte el modal de Feedback
      setTimeout(
        () => router.push(`/dashboard?feedback=${selectedJobId}`),
        500,
      );
    } finally {
      setIsSyncing(false);
    }
  };

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

      <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
        <AlertCircle className="size-5 text-amber-400 shrink-0" />
        <p className="text-sm font-medium">
          <span className="font-bold">Modo Simulación:</span> Utilizá los
          botones inferiores de cada tarjeta para simular el avance del tiempo o
          asignar un profesional automáticamente.
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-700 text-slate-400 mb-4">
            <Calendar className="size-6" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">
            No tenés servicios programados
          </h3>
          <p className="text-slate-400">
            Al solicitar un servicio desde el Inicio, verás tus reservas futuras
            acá.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {jobs.map((job) => {
            const jobDate = job.requested_date
              ? new Date(job.requested_date)
              : null;

            // ESTADO ESPECIAL: El trabajo se auto-canceló por falta de profesionales
            if (autoCancelled.includes(job.id)) {
              return (
                <div
                  key={job.id}
                  className="flex flex-col items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center shadow-sm animate-in fade-in duration-300 h-full"
                >
                  <AlertCircle className="size-10 text-red-400 mb-3" />
                  <h3 className="font-semibold text-white mb-1">
                    Turno Cancelado
                  </h3>
                  <p className="text-sm text-red-200 mb-6 max-w-sm">
                    Tu solicitud no fue tomada por ningún profesional. Probá
                    generando una nueva.
                  </p>
                  <Button
                    onClick={() => router.refresh()}
                    className="bg-red-500 text-white hover:bg-red-600 px-8 transition-all"
                  >
                    Eliminar
                  </Button>
                </div>
              );
            }

            // TARJETA NORMAL
            return (
              <div
                key={job.id}
                className="flex flex-col justify-between rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-sm transition-all hover:border-slate-600"
              >
                <div className="space-y-4">
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

                  <p className="text-sm text-slate-300 line-clamp-2 bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                    {job.description}
                  </p>

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

                <div className="mt-6 flex flex-col gap-4 border-t border-slate-700 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Presupuesto estimado
                    </span>
                    <span className="text-lg font-bold text-amber-300">
                      ${job.estimated_price.toLocaleString("es-AR")}
                    </span>
                  </div>

                  {/* BOTONERA DE CONTROL Y SIMULACIÓN */}
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 flex-1 sm:flex-none"
                      onClick={() => handleCancelClick(job.id)}
                      disabled={isSyncing}
                    >
                      Cancelar Turno
                    </Button>

                    {job.status === "PENDING" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 flex-1 sm:flex-none"
                        onClick={() => simulateAccept(job.id)}
                        disabled={isSyncing}
                      >
                        Simular: Asignar Prof.
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 flex-1 sm:flex-none bg-emerald-500/5"
                      onClick={() => simulateTimeArrived(job.id, job.status)}
                      disabled={isSyncing}
                    >
                      Simular: Llegó el día
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODALES REUTILIZADOS DE ACTIVE JOB                   */}
      {/* ---------------------------------------------------- */}

      {/* 1. Modal de Cancelación Manual */}
      <AppModal
        open={isCancelModalOpen}
        onOpenChange={setIsCancelModalOpen}
        title="Cancelar servicio programado"
        description="Elegí el motivo de la cancelación. Recordá que cancelar un turno ya asignado puede generar cargos."
        icon={<Clock className="size-7 text-amber-300" />}
        className="max-h-[90vh] w-[92vw] max-w-2xl overflow-y-auto border-slate-700 bg-slate-900 text-white"
        footer={
          <>
            <Button
              variant="outline"
              className="flex-1 border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
              onClick={() => setIsCancelModalOpen(false)}
              disabled={isSyncing}
            >
              Volver
            </Button>
            <Button
              className="flex-1 bg-red-500 text-slate-950 hover:bg-red-400"
              onClick={confirmCancellation}
              disabled={isSyncing}
            >
              {isSyncing ? "Cancelando..." : "Confirmar cancelación"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {CANCELLATION_REASONS.map((reason) => {
            const isSelected = selectedReason === reason.value;
            return (
              <button
                key={reason.value}
                onClick={() => setSelectedReason(reason.value)}
                className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                  isSelected
                    ? "border-amber-400 bg-amber-400/10"
                    : "border-slate-700 bg-slate-900 hover:border-slate-600 hover:bg-slate-800"
                }`}
              >
                <span
                  className={`mt-0.5 flex size-5 items-center justify-center rounded-full border ${isSelected ? "border-amber-300 bg-amber-400 text-slate-950" : "border-slate-500 text-transparent"}`}
                >
                  <CheckCircle2 className="size-3" />
                </span>
                <span className="flex-1">
                  <span className="block font-semibold text-white">
                    {reason.title}
                  </span>
                  <span className="mt-1 block text-sm text-slate-400">
                    {reason.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </AppModal>

      {/* 2. Modal de Pago de Multa */}
      <AppModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        title={paymentFlow?.title ?? "Redirigiendo a Payments"}
        description={paymentFlow?.description ?? ""}
        icon={<Zap className="size-7 text-amber-300" />}
        className="border-slate-700 bg-slate-900 text-white"
        footer={
          <>
            <Button
              variant="outline"
              className="flex-1 border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
              onClick={() => setIsPaymentModalOpen(false)}
              disabled={isSyncing}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-amber-400 text-slate-950 hover:bg-amber-300"
              onClick={confirmPayment}
              disabled={isSyncing}
            >
              {isSyncing
                ? "Procesando..."
                : `Ir a Payments ($${paymentFlow?.amount.toLocaleString("es-AR")})`}
            </Button>
          </>
        }
      />
    </div>
  );
}
