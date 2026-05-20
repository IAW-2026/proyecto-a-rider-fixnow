"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AppModal } from "@/components/ui/app-modal";
import {
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  Star,
  Zap,
  Droplets,
  Flame,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Step = {
  id: number;
  label: string;
  completed: boolean;
  active?: boolean;
};

type ActiveJob = {
  id: string;
  service_type: string;
  description: string;
  status: string;
  cancellation_reason: string | null;
  cancellation_payment_required: boolean;
  cancelled_at: string | null;
  urgency: string;
  lat: number;
  lng: number;
  estimated_price: number;
  professional_id: string | null;
};

interface ActiveJobViewProps {
  job: ActiveJob;
}

type DriverMockResponse = {
  status: string;
  professional_id: string | null;
  cancellation_reason?: string | null;
  cancellation_payment_required?: boolean;
  cancelled_at?: string | null;
  requires_payment?: boolean;
  penalty_amount?: number;
};

type CancellationReason =
  | "MUCHO_TIEMPO_ESPERA"
  | "VALOR_TRABAJO_ALTO"
  | "CAMBIE_DE_OPINION"
  | "YA_NO_LO_NECESITO";

type CancellationReasonOption = {
  value: CancellationReason;
  title: string;
  description: string;
};

const CANCELLATION_REASONS: CancellationReasonOption[] = [
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
    description:
      "El problema se resolvió por otro medio antes de que llegara el profesional.",
  },
];

const DEFAULT_CANCELLATION_REASON =
  CANCELLATION_REASONS[0]?.value ?? "MUCHO_TIEMPO_ESPERA";

type PaymentFlow = {
  kind: "job" | "penalty";
  amount: number;
  title: string;
  description: string;
};

function buildSteps(status: string): Step[] {
  const normalizedStatus = status.toUpperCase();

  const progressMap: Record<string, number> = {
    PENDING: 1,
    ACCEPTED: 2,
    IN_PROGRESS: 3,
    COMPLETED: 4,
    CANCELLED: 0,
  };

  const activeStep = progressMap[normalizedStatus] ?? 1;

  return [
    { id: 1, label: "Solicitud enviada", completed: activeStep >= 1 },
    { id: 2, label: "Profesional asignado", completed: activeStep >= 2 },
    {
      id: 3,
      label: "En progreso",
      completed: activeStep > 3,
      active: activeStep === 3,
    },
    { id: 4, label: "Finalizado", completed: activeStep >= 4 },
  ];
}

function getServiceLabel(serviceType: string) {
  const normalized = serviceType.toLowerCase();

  if (normalized.includes("electric")) return "Electricidad";
  if (normalized.includes("gas")) return "Gas";
  if (normalized.includes("plom")) return "Plomería";

  return serviceType;
}

function getStatusLabel(status: string) {
  switch (status.toUpperCase()) {
    case "PENDING":
      return "Pendiente";
    case "ACCEPTED":
      return "Aceptado";
    case "IN_PROGRESS":
      return "En progreso";
    case "COMPLETED":
      return "Finalizado";
    case "CANCELLED":
      return "Cancelado";
    default:
      return status;
  }
}

export function ActiveJobView({ job }: ActiveJobViewProps) {
  const router = useRouter();
  const [currentJob, setCurrentJob] = useState<ActiveJob>(job);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRedirectingToPayments, setIsRedirectingToPayments] = useState(false);
  const [selectedCancellationReason, setSelectedCancellationReason] =
    useState<CancellationReason>(DEFAULT_CANCELLATION_REASON);
  const [paymentFlow, setPaymentFlow] = useState<PaymentFlow | null>(null);

  useEffect(() => {
    setCurrentJob(job);
  }, [job]);

  const normalizedStatus = currentJob.status.toUpperCase();

  const applyServerState = (updatedData: DriverMockResponse) => {
    const nextStatus = updatedData.status.toUpperCase();
    const nextProfessionalId = updatedData.professional_id;
    const nextCancellationReason = updatedData.cancellation_reason ?? null;

    setCurrentJob((prev) => ({
      ...prev,
      status: nextStatus,
      professional_id: nextProfessionalId,
      cancellation_reason: nextCancellationReason,
      cancellation_payment_required:
        updatedData.cancellation_payment_required ??
        prev.cancellation_payment_required,
      cancelled_at: updatedData.cancelled_at ?? prev.cancelled_at,
    }));
  };

  const getPenaltyAmount = () =>
    Math.max(1000, Math.round(currentJob.estimated_price * 0.2));

  const refreshStatus = async () => {
    setSyncError(null);
    setIsSyncing(true);

    try {
      const response = await fetch(`/api/v1/driver-mock/${currentJob.id}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        setSyncError("No se pudo actualizar el estado.");
        return;
      }

      const updatedData = (await response.json()) as DriverMockResponse;
      applyServerState(updatedData);
    } catch (error) {
      console.error("Error al consultar estado del trabajo:", error);
      setSyncError("Error de red al actualizar estado.");
    } finally {
      setIsSyncing(false);
    }
  };

  //---------------------------------------------
  // BOTON PARA SIMULAR AVANCE DEL TRABAJO (solo para testing, no forma parte de la funcionalidad real)
  const simulateAdvance = async () => {
    setSyncError(null);
    setIsSyncing(true);

    try {
      const response = await fetch(`/api/v1/driver-mock/${currentJob.id}`, {
        method: "POST",
      });

      if (!response.ok) {
        setSyncError("No se pudo simular el avance.");
        return;
      }

      const updatedData = (await response.json()) as DriverMockResponse;
      applyServerState(updatedData);
    } catch (error) {
      console.error("Error al simular avance del trabajo:", error);
      setSyncError("Error de red al simular avance.");
    } finally {
      setIsSyncing(false);
    }
  };
  //--------------------------------------------------------------

  const openPaymentModal = () => {
    const isPenaltyPayment =
      normalizedStatus === "CANCELLED" &&
      currentJob.cancellation_payment_required;

    setPaymentFlow(
      isPenaltyPayment
        ? {
            kind: "penalty",
            amount: getPenaltyAmount(),
            title: "Pago de multa",
            description:
              "La cancelación genera una multa porque el trabajo ya estaba asignado o en progreso.",
          }
        : {
            kind: "job",
            amount: currentJob.estimated_price,
            title: "Redirigiendo a Payments",
            description:
              "Estamos simulando la transición a la app de cobros. Cuando la integración esté lista, aquí se abrirá el flujo real de pago.",
          },
    );
    setIsPaymentModalOpen(true);
  };

  const confirmPayment = async () => {
    setIsRedirectingToPayments(true);

    try {
      // 1- Le avisamos a la BD que simulamos el pago exitoso
      await fetch(`/api/v1/driver-mock/${currentJob.id}/simulate-payment`, {
        method: "POST",
      });

      // 2- Esperamos un seg por la animacion y redireccionamos al Dashboard
      window.setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1400);
    } catch (error) {
      console.error("Error al simular el pago:", error);
      setIsRedirectingToPayments(false);
    }
  };

  const openCancelModal = () => {
    setSelectedCancellationReason(DEFAULT_CANCELLATION_REASON);
    setIsCancelModalOpen(true);
    setSyncError(null);
  };

  const confirmCancellation = async () => {
    setSyncError(null);
    setIsSyncing(true);

    try {
      const response = await fetch(
        `/api/v1/driver-mock/${currentJob.id}/cancel-job`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: selectedCancellationReason,
          }),
        },
      );

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setSyncError(errorPayload?.error ?? "No se pudo cancelar el servicio.");
        return;
      }

      const updatedData = (await response.json()) as DriverMockResponse;
      applyServerState(updatedData);
      setIsCancelModalOpen(false);

      if (updatedData.requires_payment) {
        setPaymentFlow({
          kind: "penalty",
          amount: updatedData.penalty_amount ?? getPenaltyAmount(),
          title: "Pago de multa",
          description:
            "La cancelación genera una multa porque el trabajo ya estaba asignado o en progreso.",
        });
        setIsPaymentModalOpen(true);
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Error al cancelar el servicio:", error);
      setSyncError("Error de red al cancelar el servicio.");
    } finally {
      setIsSyncing(false);
    }
  };

  const steps = useMemo(() => buildSteps(normalizedStatus), [normalizedStatus]);

  const completedSteps = steps.filter((step) => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;
  const serviceLabel = getServiceLabel(currentJob.service_type);
  const statusLabel = getStatusLabel(normalizedStatus);
  const shouldShowPaymentButton =
    normalizedStatus === "COMPLETED" ||
    (normalizedStatus === "CANCELLED" &&
      currentJob.cancellation_payment_required);
  const paymentButtonLabel =
    normalizedStatus === "CANCELLED" ? "ABONAR MULTA" : "ABONAR TRABAJO";
  const paymentButtonClass =
    serviceLabel === "Electricidad"
      ? "bg-electrical text-slate-950 hover:bg-yellow-300"
      : serviceLabel === "Gas"
        ? "bg-gas text-slate-950 hover:bg-orange-300"
        : serviceLabel === "Plomería"
          ? "bg-plumbing text-slate-950 hover:bg-cyan-300"
          : "bg-amber-400 text-slate-950 hover:bg-amber-300";
  const cancellationSummary = currentJob.cancellation_reason
    ? CANCELLATION_REASONS.find(
        (reason) => reason.value === currentJob.cancellation_reason,
      )
    : undefined;

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Trabajo Activo
            </h1>
            <p className="mt-1 text-lg text-slate-400">
              Seguimiento en tiempo real de tu servicio
            </p>
            {normalizedStatus === "CANCELLED" && cancellationSummary && (
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Motivo de cancelación: {cancellationSummary.title}
              </p>
            )}
            {currentJob.cancelled_at && (
              <p className="mt-1 text-sm text-slate-400">
                Cancelado el{" "}
                {new Date(currentJob.cancelled_at).toLocaleString("es-AR")}
              </p>
            )}
          </div>

          {shouldShowPaymentButton && (
            <Button
              type="button"
              onClick={openPaymentModal}
              className={`w-full rounded-2xl px-8 py-6 text-base font-semibold tracking-wide shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl lg:w-auto ${paymentButtonClass}`}
            >
              {paymentButtonLabel}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={refreshStatus}
            disabled
            className="border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-700"
            title="Deshabilitado mientras el flujo real de actualización no esté conectado"
          >
            Actualizar estado
          </Button>
          <Button
            type="button"
            onClick={simulateAdvance}
            disabled={
              isSyncing ||
              normalizedStatus === "COMPLETED" ||
              normalizedStatus === "CANCELLED"
            }
            className="bg-amber-400 text-slate-950 hover:bg-amber-300"
          >
            Simular avance
          </Button>
          <Button
            type="button"
            onClick={openCancelModal}
            disabled={
              isSyncing ||
              normalizedStatus === "COMPLETED" ||
              normalizedStatus === "CANCELLED"
            }
            className="bg-red-500 text-slate-950 hover:bg-red-400"
          >
            Cancelar servicio
          </Button>
          {syncError && (
            <span className="text-sm text-red-300">{syncError}</span>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-700 bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-700 p-5">
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-11 items-center justify-center rounded-lg ${serviceLabel === "Electricidad" ? "bg-electrical" : serviceLabel === "Gas" ? "bg-gas" : serviceLabel === "Plomería" ? "bg-plumbing" : "bg-slate-700"}`}
                >
                  {serviceLabel === "Electricidad" && (
                    <Zap className="size-5 text-slate-950" />
                  )}
                  {serviceLabel === "Gas" && (
                    <Flame className="size-5 text-slate-950" />
                  )}
                  {serviceLabel === "Plomería" && (
                    <Droplets className="size-5 text-slate-950" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">
                    {serviceLabel}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {currentJob.description}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-md bg-amber-400/20 px-2.5 py-1 text-xs font-semibold text-amber-300">
                {statusLabel}
              </span>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Progreso</span>
                <span className="font-semibold text-white">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="space-y-3 pt-1">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div
                      className={`flex size-6 items-center justify-center rounded-full ${
                        step.completed
                          ? "bg-green-500 text-white"
                          : step.active
                            ? "border-2 border-amber-400 bg-amber-400/20"
                            : "border border-slate-600 bg-slate-700"
                      }`}
                    >
                      {step.completed && <CheckCircle2 className="size-4" />}
                      {step.active && (
                        <div className="size-2 rounded-full bg-amber-300" />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        step.completed || step.active
                          ? "font-medium text-white"
                          : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {normalizedStatus === "PENDING" ? (
            <section className="rounded-lg border border-dashed border-slate-600 bg-slate-800/50 p-8 text-center text-slate-400">
              <Clock className="mx-auto mb-2 size-8 animate-spin text-amber-400" />
              <p className="font-medium">
                Esperando que un profesional acepte tu solicitud...
              </p>
            </section>
          ) : (
            <section className="rounded-lg border border-slate-700 bg-slate-800 p-5">
              <h3 className="mb-4 text-sm font-medium text-slate-300">
                Tu Profesional
              </h3>
              <div className="flex items-center gap-4">
                <Avatar className="size-14 grayscale">
                  <AvatarImage
                    src="/avatar-professional.jpg"
                    alt="Profesional asignado"
                  />
                  <AvatarFallback className="bg-slate-700 text-xl text-white">
                    PR
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 ml-10">
                  <p className="font-semibold text-white">
                    Profesional asignado
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="size-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium text-white">
                        4.8
                      </span>
                    </div>
                    <span className="text-slate-500">•</span>
                    <span className="text-sm text-slate-400">
                      ID: {currentJob.professional_id ?? "MOCK-PRO"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-700"
                >
                  <Phone className="size-4" />
                  Llamar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-700"
                >
                  <MessageCircle className="size-4" />
                  Mensaje
                </Button>
              </div>
            </section>
          )}

          <section className="rounded-lg border border-slate-700 bg-slate-800 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock className="size-4" />
                Tiempo estimado restante
              </div>
              <span className="font-semibold text-white">~25 min</span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-700 pt-4">
              <span className="text-sm text-slate-400">Precio estimado</span>
              <span className="text-xl font-bold text-amber-300">
                ${currentJob.estimated_price.toLocaleString("es-AR")}
              </span>
            </div>
          </section>
        </div>

        <section className="relative min-h-115 overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
          <div className="absolute inset-0 bg-linear-to-br from-slate-800 to-slate-900">
            <div className="absolute inset-0 opacity-30">
              <div
                className="h-full w-full"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(100,116,139,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(100,116,139,0.35) 1px, transparent 1px)",
                  backgroundSize: "60px 60px",
                }}
              />
            </div>

            {normalizedStatus !== "PENDING" && (
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 400 400"
              >
                <path
                  d="M 95 310 Q 160 210 210 230 T 290 155"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeDasharray="8 4"
                  className="animate-pulse"
                />
              </svg>
            )}

            <div className="absolute left-[71%] top-[37%]">
              <div className="relative">
                <div className="absolute -inset-3 animate-ping rounded-full bg-amber-400/30" />
                <div className="relative flex size-10 items-center justify-center rounded-full border-2 border-slate-900 bg-amber-400 shadow-lg">
                  <Zap className="size-5 text-slate-950" />
                </div>
              </div>
            </div>

            <div className="absolute left-[23%] top-[76%]">
              <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 shadow-lg">
                <MapPin className="size-4 text-slate-900" />
              </div>
            </div>
          </div>

          <div className="absolute right-3 top-3 flex flex-col gap-2">
            <button className="flex size-8 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-white shadow-sm transition-colors hover:bg-slate-700">
              <span className="text-lg font-medium">+</span>
            </button>
            <button className="flex size-8 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-white shadow-sm transition-colors hover:bg-slate-700">
              <span className="text-lg font-medium">−</span>
            </button>
          </div>

          <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-slate-700 bg-slate-800/95 p-3 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="size-2 animate-pulse rounded-full bg-green-500" />
                <span className="text-sm font-medium text-white">
                  {normalizedStatus === "PENDING"
                    ? "Buscando profesionales cerca"
                    : "El profesional está en camino"}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Actualización automática
              </span>
            </div>
          </div>
        </section>
      </div>
      <AppModal
        open={isCancelModalOpen}
        onOpenChange={(open) => {
          setIsCancelModalOpen(open);
          if (!open) {
            setSelectedCancellationReason(DEFAULT_CANCELLATION_REASON);
          }
        }}
        title="Cancelar servicio"
        description="Elegí el motivo de la cancelación. Se guardará en el historial junto con la fecha y hora exactas."
        icon={<Clock className="size-7 text-amber-300" />}
        className="max-h-[90vh] w-[92vw] max-w-2xl overflow-y-auto border-slate-700 bg-slate-900 text-white"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
              onClick={() => setIsCancelModalOpen(false)}
              disabled={isSyncing}
            >
              Volver
            </Button>
            <Button
              type="button"
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
            const isSelected = selectedCancellationReason === reason.value;

            return (
              <button
                key={reason.value}
                type="button"
                onClick={() => setSelectedCancellationReason(reason.value)}
                className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                  isSelected
                    ? "border-amber-400 bg-amber-400/10"
                    : "border-slate-700 bg-slate-900 hover:border-slate-600 hover:bg-slate-800"
                }`}
              >
                <span
                  className={`mt-0.5 flex size-5 items-center justify-center rounded-full border ${
                    isSelected
                      ? "border-amber-300 bg-amber-400 text-slate-950"
                      : "border-slate-500 text-transparent"
                  }`}
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
          {normalizedStatus !== "PENDING" && (
            <p className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
              Como el trabajo ya fue aceptado o está en progreso, esta
              cancelación puede generar una multa.
            </p>
          )}
        </div>
      </AppModal>
      <AppModal
        open={isPaymentModalOpen}
        onOpenChange={(open) => {
          setIsPaymentModalOpen(open);
          if (!open) {
            setIsRedirectingToPayments(false);
          }
        }}
        title={paymentFlow?.title ?? "Redirigiendo a Payments"}
        description={
          paymentFlow?.description ??
          "Estamos simulando la transición a la app de cobros. Cuando la integración esté lista, aquí se abrirá el flujo real de pago."
        }
        icon={<Zap className="size-7 text-amber-300" />}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              className="flex-1 cursor-pointer border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
              onClick={() => setIsPaymentModalOpen(false)}
              disabled={isRedirectingToPayments}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1 cursor-pointer bg-amber-400 text-slate-950 hover:bg-amber-300"
              onClick={confirmPayment}
              disabled={isRedirectingToPayments}
            >
              {isRedirectingToPayments
                ? "Redirigiendo..."
                : `Ir a Payments${paymentFlow ? ` ($${paymentFlow.amount.toLocaleString("es-AR")})` : ""}`}
            </Button>
          </>
        }
      />
    </div>
  );
}
