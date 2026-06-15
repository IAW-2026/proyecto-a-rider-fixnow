"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AppModal } from "@/components/ui/app-modal";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Droplets,
  Flame,
  Loader2,
  MessageCircle,
  Phone,
  Star,
  Wrench,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ProfessionalProfileModal } from "@/components/ProfessionalProfileModal";
import { EditJobModal } from "@/components/EditJobModal";

const JobTrackerMap = dynamic(() => import("@/components/JobTrackerMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-slate-800" />,
});

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
  direction: string | null;
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
  estimated_price?: number;
  description?: string;
  service_type?: string;
  direction?: string | null;
  lat?: number;
  lng?: number;
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

type AssignedProfessional = {
  id: string;
  full_name: string;
  service_type: string;
  rating: number;
  jobs_completed: number;
  is_verified: boolean;
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
  const [assignedProfessional, setAssignedProfessional] =
    useState<AssignedProfessional | null>(null);
  const [isProfessionalLoading, setIsProfessionalLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRedirectingToPayments, setIsRedirectingToPayments] = useState(false);
  const [selectedCancellationReason, setSelectedCancellationReason] =
    useState<CancellationReason>(DEFAULT_CANCELLATION_REASON);
  const [paymentFlow, setPaymentFlow] = useState<PaymentFlow | null>(null);
  const [profModalOpen, setProfModalOpen] = useState(false);
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProfCancelledModalOpen, setIsProfCancelledModalOpen] =
    useState(false);

  useEffect(() => {
    setCurrentJob(job);
  }, [job]);

  useEffect(() => {
    if (!currentJob.professional_id) {
      setAssignedProfessional(null);
      return;
    }

    let cancelled = false;
    setIsProfessionalLoading(true);

    fetch(`/api/v1/feedback-mock/professional/${currentJob.professional_id}`)
      .then((res) => res.json())
      .then((mockData: AssignedProfessional) => {
        if (!cancelled) {
          setAssignedProfessional(mockData);
        }
      })
      .catch((error) => {
        console.error("Error loading assigned professional:", error);
        if (!cancelled) {
          setAssignedProfessional(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsProfessionalLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentJob.professional_id]);

  const normalizedStatus = currentJob.status.toUpperCase();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    // Si es inmediato y sigue pendiente, disparamos el contador
    if (
      normalizedStatus === "PENDING" &&
      currentJob.urgency === "IMMEDIATE" &&
      !isEditModalOpen
    ) {
      timeoutId = setTimeout(() => {
        setIsTimeoutModalOpen(true);
      }, 15000); // 15 segundos para la demo
    }
    return () => clearTimeout(timeoutId);
  }, [normalizedStatus, currentJob.urgency, retryCount, isEditModalOpen]);

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
      estimated_price: updatedData.estimated_price ?? prev.estimated_price,
      description: updatedData.description ?? prev.description,
      service_type: updatedData.service_type ?? prev.service_type,
      direction: updatedData.direction ?? prev.direction,
      lat: updatedData.lat ?? prev.lat,
      lng: updatedData.lng ?? prev.lng,
    }));
  };

  const getPenaltyAmount = () =>
    Math.max(1000, Math.round(currentJob.estimated_price * 0.2));

  const refreshStatus = async () => {
    setSyncError(null);
    setIsSyncing(true);

    try {
      const response = await fetch(`/api/v1/jobs/${currentJob.id}`, {
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

  const simulateAdvance = async () => {
    setSyncError(null);
    setIsSyncing(true);

    try {
      const response = await fetch(`/api/v1/jobs/${currentJob.id}`, {
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
            title: "Resumen de Facturación",
            description: `Revisá el detalle del servicio antes de proceder al pago.`,
          },
    );
    setIsPaymentModalOpen(true);
  };

  const confirmPayment = async () => {
    setIsRedirectingToPayments(true);

    try {
      const response = await fetch(
        `/api/v1/driver-mock/${currentJob.id}/simulate-payment`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        setSyncError(
          errorPayload?.error ?? "No se pudo registrar el pago del trabajo.",
        );
        setIsRedirectingToPayments(false);
        return;
      }

      router.refresh();
      window.setTimeout(() => {
        router.push(`/dashboard?feedback=${currentJob.id}`);
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
      const response = await fetch(`/api/v1/jobs/${currentJob.id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: selectedCancellationReason,
        }),
      });

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

      router.refresh();
      router.push(`/dashboard?feedback=${currentJob.id}`);
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
    normalizedStatus === "CANCELLED" && currentJob.cancellation_payment_required
      ? "bg-red-500 text-slate-950 hover:bg-red-400"
      : serviceLabel === "Electricidad"
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

  const descriptionParts = currentJob.description.split(
    "[INFORME DEL PROFESIONAL]:",
  );
  const displayDescription = descriptionParts[0].trim();
  const professionalReport =
    descriptionParts.length > 1 ? descriptionParts[1].trim() : null;

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
            {normalizedStatus === "PENDING" && (
              <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 mt-4 max-w-2xl animate-in fade-in duration-300">
                <AlertCircle className="size-5 text-amber-400 shrink-0" />
                <p className="text-sm font-medium">
                  <span className="font-bold">Modo Simulación:</span> Para
                  evaluar la disponibilidad, si en 15 segundos no utilizas el
                  botón "Simular avance" para asignar un especialista, se
                  disparará automáticamente un aviso de tiempo de espera
                  excedido.
                </p>
              </div>
            )}
            {normalizedStatus === "CANCELLED" && cancellationSummary && (
              <p className="mt-2 max-w-2xl text-sm text-red-500">
                Motivo de cancelación: {cancellationSummary.title}
              </p>
            )}
            {currentJob.cancelled_at && (
              <p className="mt-1 text-sm text-red-500">
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
          {/* BOTÓN EDITAR */}
          {normalizedStatus === "PENDING" && (
            <Button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              disabled={isSyncing}
              className="bg-blue-600 text-white hover:bg-blue-500"
            >
              Editar solicitud
            </Button>
          )}

          {/* BOTÓN SIMULAR AVANCE (Lo que ya tenías) */}
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

          {/* BOTÓN CANCELAR CLIENTE */}
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

          {/* NUEVO BOTÓN SIMULAR CANCELACIÓN PROFESIONAL */}
          {(normalizedStatus === "ACCEPTED" ||
            normalizedStatus === "IN_PROGRESS") && (
            <Button
              type="button"
              onClick={async () => {
                setIsSyncing(true);
                try {
                  const res = await fetch(
                    `/api/v1/jobs/${currentJob.id}/cancel`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        reason: "CANCELADO_POR_PROFESIONAL",
                      }),
                    },
                  );
                  const data = await res.json();
                  applyServerState(data);

                  // --- ABRIMOS EL MODAL ---
                  setIsProfCancelledModalOpen(true);
                } finally {
                  setIsSyncing(false);
                }
              }}
              disabled={isSyncing}
              className="bg-purple-600 text-white hover:bg-purple-500"
            >
              Simular: Prof. Cancela
            </Button>
          )}

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
                  <p className="text-sm text-slate-400">{displayDescription}</p>
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
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <Avatar className="size-20 shrink-0 overflow-hidden grayscale sm:size-24">
                  <AvatarImage
                    src="/avatar-professional.jpg"
                    alt="Profesional asignado"
                    className="object-contain p-1"
                  />
                  <AvatarFallback className="h-full w-full bg-slate-700 text-2xl font-semibold text-white">
                    {assignedProfessional
                      ? assignedProfessional.full_name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()
                      : "PR"}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 space-y-3">
                  {currentJob.professional_id ? (
                    <div className="space-y-1">
                      {isProfessionalLoading && !assignedProfessional ? (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Loader2 className="size-4 animate-spin" />
                          <span className="text-sm">
                            Cargando profesional...
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <p className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                            {assignedProfessional?.full_name ??
                              "Profesional asignado"}
                          </p>
                          {assignedProfessional?.is_verified && (
                            <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                              <Check className="size-3.5" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-amber-300">
                          <Wrench className="size-3.5" />
                          {assignedProfessional?.service_type ?? serviceLabel}
                        </span>
                        <span className="hidden text-slate-500 sm:inline">
                          •
                        </span>
                        <span className="text-slate-400">
                          ID: {currentJob.professional_id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 text-sm text-slate-300">
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-white">
                          {assignedProfessional?.rating ?? 4.8}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span>
                          {assignedProfessional?.jobs_completed ?? 0} trabajos
                          exitosos
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-white">Asignando...</p>
                    </div>
                  )}

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      className="h-12 border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-700"
                    >
                      <Phone className="size-4" />
                      Llamar
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-700"
                    >
                      <MessageCircle className="size-4" />
                      Mensaje
                    </Button>
                  </div>

                  {currentJob.professional_id && (
                    <button
                      onClick={() => setProfModalOpen(true)}
                      className="group inline-flex w-full items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-300 transition-colors hover:border-amber-400/40 hover:bg-amber-400/15 hover:text-amber-200"
                    >
                      Ver perfil del profesional
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="rounded-lg border border-slate-700 bg-slate-800 p-5">
            <div className=" flex items-center justify-between border-slate-700 ">
              <span className="text-sm text-slate-400">Precio estimado</span>
              <span className="text-xl font-bold text-amber-300">
                ${currentJob.estimated_price.toLocaleString("es-AR")}
              </span>
            </div>
          </section>
        </div>

        <section className="relative min-h-115 overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
          <div className="absolute inset-0">
            <JobTrackerMap
              clientLocation={{ lat: currentJob.lat, lng: currentJob.lng }}
              status={normalizedStatus}
              professionalLocation={
                normalizedStatus === "ACCEPTED"
                  ? { lat: currentJob.lat + 0.01, lng: currentJob.lng + 0.01 }
                  : normalizedStatus === "IN_PROGRESS"
                    ? { lat: currentJob.lat, lng: currentJob.lng }
                    : null
              }
            />
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-400 rounded-lg border border-slate-700 bg-slate-800/95 p-3 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`size-2 animate-pulse rounded-full ${normalizedStatus === "PENDING" ? "bg-amber-400" : "bg-green-500"}`}
                />
                <span className="text-sm font-medium text-white">
                  {normalizedStatus === "PENDING"
                    ? "Buscando profesionales cerca"
                    : normalizedStatus === "ACCEPTED"
                      ? "El profesional está en camino"
                      : normalizedStatus === "IN_PROGRESS"
                        ? "El profesional llegó a tu ubicación"
                        : ""}
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
        className="custom-scrollbar max-h-[90vh] w-[92vw] max-w-2xl overflow-y-auto border-slate-700 bg-slate-900 text-white"
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
        description={paymentFlow?.description ?? ""}
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
              className="flex-1 cursor-pointer bg-amber-400 text-slate-950 hover:bg-amber-300 font-semibold"
              onClick={confirmPayment}
              disabled={isRedirectingToPayments}
            >
              {isRedirectingToPayments ? "Redirigiendo..." : `Ir a Payments`}
            </Button>
          </>
        }
      >
        {/* --- NUEVO DISEÑO INTERNO DEL MODAL --- */}
        {paymentFlow?.kind === "job" && (
          <div className="mt-2 space-y-5 animate-in fade-in duration-300">
            {/* Tarjeta de Precio Gigante */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-400/10 p-6 shadow-inner">
              <span className="text-sm font-medium text-amber-200/80 uppercase tracking-wider mb-1">
                Monto Final a Pagar
              </span>
              <span className="text-5xl font-extrabold text-amber-400 tracking-tight">
                ${paymentFlow.amount.toLocaleString("es-AR")}
              </span>
            </div>
            {/* Separación inteligente de los textos */}
            <div className="space-y-4 rounded-2xl border border-slate-700 bg-slate-800/50 p-5 text-sm shadow-sm">
              {/* Caja de la solicitud original */}
              <div className="space-y-2">
                <span className="flex items-center gap-2 font-medium text-slate-400">
                  <MessageCircle className="size-4" /> Tu solicitud original:
                </span>
                <p className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-3.5 text-slate-300 leading-relaxed">
                  {displayDescription}
                </p>
              </div>

              {/* Caja destacada del informe del profesional */}
              {professionalReport && (
                <div className="space-y-2 pt-2 border-t border-slate-700">
                  <span className="flex items-center gap-2 font-medium text-amber-400">
                    <Wrench className="size-4" /> Informe del profesional:
                  </span>
                  <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-amber-100/90 leading-relaxed">
                    {professionalReport}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diseño para cuando es una multa por cancelación */}
        {paymentFlow?.kind === "penalty" && (
          <div className="mt-2 flex flex-col items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center animate-in zoom-in-95 duration-300">
            <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-red-300/80">
              Cargo por cancelación
            </span>
            <span className="text-5xl font-extrabold tracking-tight text-red-400">
              ${paymentFlow.amount.toLocaleString("es-AR")}
            </span>
          </div>
        )}
      </AppModal>

      {/* MODAL DE TIEMPO DE ESPERA EXCEDIDO */}
      <AppModal
        open={isTimeoutModalOpen}
        onOpenChange={setIsTimeoutModalOpen}
        title="Sin profesionales disponibles"
        description="Tiempo de espera excedido. En este momento no hay profesionales activos cerca de tu zona."
        icon={<Clock className="size-7 text-amber-300" />}
        className="border-slate-700 bg-slate-900 text-white z-9999"
        footer={
          <>
            <Button
              variant="outline"
              className="flex-1 border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
              onClick={() => {
                setIsTimeoutModalOpen(false);
                // Acá reutilizamos tu lógica de cancelar, seteando la razón:
                setSelectedCancellationReason("MUCHO_TIEMPO_ESPERA");
                confirmCancellation();
              }}
              disabled={isSyncing}
            >
              {isSyncing ? "Cancelando..." : "Cancelar solicitud"}
            </Button>
            <Button
              className="flex-1 bg-amber-400 text-slate-950 hover:bg-amber-300"
              onClick={() => {
                setIsTimeoutModalOpen(false);
                // Si el usuario elige esperar un poco más, le damos otros 15s
                setRetryCount((prev) => prev + 1);
              }}
            >
              Seguir esperando
            </Button>
          </>
        }
      />

      <ProfessionalProfileModal
        professionalId={currentJob.professional_id}
        professionalName={assignedProfessional?.full_name ?? null}
        open={profModalOpen}
        onOpenChange={setProfModalOpen}
      />

      {/* MODAL: EL PROFESIONAL CANCELÓ EL TRABAJO */}
      <AppModal
        open={isProfCancelledModalOpen}
        onOpenChange={setIsProfCancelledModalOpen}
        title="Servicio Cancelado"
        description="El profesional ha cancelado el trabajo debido a un imprevisto. No te cobraremos ningún cargo por esta cancelación. Te recomendamos generar una nueva solicitud."
        icon={<AlertCircle className="size-7 text-red-500" />}
        className="border-slate-700 bg-slate-900 text-white z-9999"
        footer={
          <Button
            className="w-full bg-amber-400 text-slate-950 hover:bg-amber-300 font-semibold"
            onClick={() => {
              setIsProfCancelledModalOpen(false);
              // Redirigimos al Home (limpiando ActiveJob) y abrimos el Feedback
              router.push(`/dashboard?feedback=${currentJob.id}`);
            }}
          >
            Aceptar
          </Button>
        }
      />

      <EditJobModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        jobId={currentJob.id}
        initialService={currentJob.service_type}
        initialDescription={currentJob.description}
        initialDirection={currentJob.direction}
        onSuccess={(updatedData) => {
          applyServerState(updatedData);
        }}
      />
    </div>
  );
}
