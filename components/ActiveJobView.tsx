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
  const [isRedirectingToPayments, setIsRedirectingToPayments] = useState(false);

  useEffect(() => {
    setCurrentJob(job);
  }, [job]);

  const normalizedStatus = currentJob.status.toUpperCase();

  const applyServerState = (updatedData: DriverMockResponse) => {
    const nextStatus = updatedData.status.toUpperCase();
    const nextProfessionalId = updatedData.professional_id;

    setCurrentJob((prev) => ({
      ...prev,
      status: nextStatus,
      professional_id: nextProfessionalId,
    }));
  };

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

  const steps = useMemo(() => buildSteps(normalizedStatus), [normalizedStatus]);

  const completedSteps = steps.filter((step) => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;
  const serviceLabel = getServiceLabel(currentJob.service_type);
  const statusLabel = getStatusLabel(normalizedStatus);

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
          </div>

          {normalizedStatus === "COMPLETED" && (
            <Button
              type="button"
              onClick={openPaymentModal}
              className="h-14 min-w-56 rounded-xl bg-green-500 px-8 mt-5 text-base font-semibold tracking-wide text-black shadow-sm transition-colors hover:bg-amber-300 hover:shadow-xl"
            >
              Abonar servicio
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
                  <AvatarFallback className="bg-slate-700 text-lg text-white">
                    PR
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
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
        open={isPaymentModalOpen}
        onOpenChange={(open) => {
          setIsPaymentModalOpen(open);
          if (!open) {
            setIsRedirectingToPayments(false);
          }
        }}
        title="Redirigiendo a Payments"
        description="Estamos simulando la transición a la app de cobros. Cuando la integración esté lista, aquí se abrirá el flujo real de pago."
        icon={<Zap className="size-7 text-amber-300" />}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
              onClick={() => setIsPaymentModalOpen(false)}
              disabled={isRedirectingToPayments}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1 bg-amber-400 text-slate-950 hover:bg-amber-300"
              onClick={confirmPayment}
              disabled={isRedirectingToPayments}
            >
              {isRedirectingToPayments ? "Redirigiendo..." : "Ir a Payments"}
            </Button>
          </>
        }
      />
    </div>
  );
}
