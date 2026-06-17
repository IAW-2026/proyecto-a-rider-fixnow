"use client";

import { useState } from "react";
import { useEffect } from "react";
import { ServiceCard, type ServiceType } from "./ServiceCard";
import { ServiceRequestModal } from "./ServiceRequestModal";
import {
  Droplets,
  Zap,
  Flame,
  ArrowRight,
  AlertCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { FeedbackModal } from "@/components/FeedbackModal";
import { ProfessionalProfileModal } from "./ProfessionalProfileModal";

type JobSummary = {
  id: string;
  service_type: string;
  description: string;
  status: string;
  estimated_price: number;
  requested_date: string | null;
  cancellation_payment_required?: boolean;
  professional_id: string | null;
  professional_name?: string | null;
  cancellation_reason?: string | null;
};

interface HomeViewProps {
  userName?: string;
  address: string;
  recentJobs?: JobSummary[];
  activeJobs?: JobSummary[];
}

const getStatusBadge = (status: string) => {
  switch (status.toUpperCase()) {
    case "PENDING":
      return (
        <span className="rounded bg-amber-400/20 px-2 py-1 text-xs font-medium text-amber-300">
          Pendiente
        </span>
      );
    case "ACCEPTED":
      return (
        <span className="rounded bg-blue-400/20 px-2 py-1 text-xs font-medium text-blue-300">
          Aceptado
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="rounded bg-green-400/20 px-2 py-1 text-xs font-medium text-green-300">
          En Progreso
        </span>
      );
    case "COMPLETED":
      return (
        <span className="rounded bg-slate-600 px-2 py-1 text-xs font-medium text-slate-300">
          Finalizado
        </span>
      );
    case "PAID":
      return (
        <span className="rounded bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-400">
          Pagado
        </span>
      );
    case "CANCELLED":
      return (
        <span className="rounded bg-red-400/20 px-2 py-1 text-xs font-medium text-red-300">
          Cancelado
        </span>
      );
    default:
      return null;
  }
};

const getServiceIcon = (type: string) => {
  if (type === "ELECTRICIDAD")
    return <Zap className="size-5 text-electrical" />;
  if (type === "GAS") return <Flame className="size-5 text-gas" />;
  return <Droplets className="size-5 text-plumbing" />;
};

export function HomeView({
  userName,
  address,
  recentJobs = [],
  activeJobs = [],
}: HomeViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<ServiceType | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null); // Estado para el aviso de bloqueo
  const [selectedHistoryJob, setSelectedHistoryJob] =
    useState<JobSummary | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [profModalOpen, setProfModalOpen] = useState(false);
  const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackJobId, setFeedbackJobId] = useState<string | null>(null);
  const [modalProfName, setModalProfName] = useState<string>("");
  const [isLoadingProfName, setIsLoadingProfName] = useState<boolean>(false);

  useEffect(() => {
    if (selectedHistoryJob?.professional_id) {
      setIsLoadingProfName(true);
      setModalProfName("");

      fetch(
        `/api/v1/reviews/professional/${selectedHistoryJob.professional_id}`,
      )
        .then((res) => res.json())
        .then((data) => {
          // Tomamos el nombre real que viene de la base de datos/mock del profesional
          setModalProfName(data.full_name || "Profesional Asignado");
        })
        .catch(() => {
          setModalProfName("Profesional Asignado");
        })
        .finally(() => setIsLoadingProfName(false));
    }
  }, [selectedHistoryJob]);

  useEffect(() => {
    const feedbackId = searchParams.get("feedback");
    if (feedbackId) {
      setFeedbackJobId(feedbackId);
      setFeedbackModalOpen(true);
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  const handleServiceClick = (service: ServiceType) => {
    // EL BLOQUEO: Si hay un trabajo activo, no abrimos el modal
    if (activeJobs.length > 0) {
      setRequestError(
        "Ya tienes un trabajo en curso. Por favor finalízalo antes de solicitar otro.",
      );

      // Hacemos que el mensaje desaparezca solo después de 4 segundos
      setTimeout(() => setRequestError(null), 4000);
      return;
    }

    setRequestError(null);
    setSelectedService(service);
    setModalOpen(true);
  };

  const handleSubmit = () => {
    setSelectedService(null);
    setModalOpen(false);
  };

  const handleOpenJobDetails = (job: JobSummary) => {
    setSelectedHistoryJob(job);
    setDetailsModalOpen(true);
  };

  const handleOpenProfProfile = (
    profId: string | null,
    profName?: string | null,
  ) => {
    setSelectedProfId(profId ?? null);
    setProfModalOpen(true);
  };

  const activeJobCards = activeJobs;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Hola, <span className="text-amber-400">{userName}</span>.
        </h1>
        <p className="mt-1 text-lg text-slate-400">
          ¿Qué necesitas resolver hoy?
        </p>
      </div>

      {/* Cartel flotante de error si intentan pedir 2 trabajos a la vez */}
      {requestError && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200 transition-all">
          <AlertCircle className="size-5 text-red-400" />
          <p className="text-sm font-medium">{requestError}</p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ServiceCard
          service="plomeria"
          onClick={() => handleServiceClick("plomeria")}
        />
        <ServiceCard
          service="electricidad"
          onClick={() => handleServiceClick("electricidad")}
        />
        <ServiceCard service="gas" onClick={() => handleServiceClick("gas")} />
      </div>

      {/* TRABAJO ACTIVO (Entre las cards y el historial) */}
      {activeJobCards.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Trabajo en curso</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {activeJobCards.map((job) => {
              let activeJobButtonText = "Seguimiento en vivo";
              let activeJobButtonClass =
                "bg-amber-400 text-slate-950 hover:bg-amber-300";

              if (job.status === "COMPLETED") {
                activeJobButtonText = "Pago pendiente";
                activeJobButtonClass =
                  "bg-emerald-400 text-slate-950 hover:bg-emerald-300";
              } else if (
                job.status === "CANCELLED" &&
                job.cancellation_payment_required
              ) {
                activeJobButtonText = "Multa pendiente";
                activeJobButtonClass =
                  "bg-red-500 text-slate-950 hover:bg-red-400";
              }

              return (
                <div
                  key={job.id}
                  className="relative overflow-hidden rounded-lg border border-amber-500/30 bg-slate-800 p-6 transition-all hover:border-amber-500/50"
                >
                  <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-slate-900 border border-slate-700 shadow-sm">
                        {getServiceIcon(job.service_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-white capitalize">
                            {job.service_type}
                          </h3>
                          {getStatusBadge(job.status)}
                        </div>
                        <p className="mt-1 text-sm text-slate-300">
                          {job.description
                            .split("[INFORME DEL PROFESIONAL]:")[0]
                            .trim()}
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/dashboard/active"
                      className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors ${activeJobButtonClass}`}
                    >
                      {activeJobButtonText} <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Actividad Reciente</h2>
        {recentJobs.length === 0 ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="flex items-center justify-center py-8 text-center">
              <p className="text-sm text-slate-400">
                Aún no tienes servicios completados en tu historial.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recentJobs.map((job) => (
              <button
                key={job.id}
                onClick={() => handleOpenJobDetails(job)}
                className="group flex flex-col justify-between text-left rounded-lg border border-slate-700 bg-slate-800 p-5 transition-all hover:border-amber-500/50 hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="w-full">
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-slate-900 border border-slate-700 group-hover:border-amber-500/30 transition-colors">
                        {getServiceIcon(job.service_type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white capitalize">
                          {job.service_type}
                        </h3>
                        <p
                          className="line-clamp-1 text-sm text-slate-400"
                          title={job.description}
                        >
                          {job.description
                            .split("[INFORME DEL PROFESIONAL]:")[0]
                            .trim()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>

                  {/* Agregamos el ID del profesional visible en la tarjeta */}
                  {job.professional_id && (
                    <div className="mt-4 text-xs text-slate-400">
                      Profesional:{" "}
                      <span className="font-medium text-slate-300">
                        {job.professional_name ?? job.professional_id}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex w-full items-center justify-between border-t border-slate-700 pt-4">
                  <span className="font-semibold text-amber-300">
                    ${job.estimated_price.toLocaleString("es-AR")}
                  </span>
                  <span className="text-xs text-slate-500">
                    {job.requested_date
                      ? new Date(job.requested_date).toLocaleDateString(
                          "es-AR",
                          {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : "Historial cerrado"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <ServiceRequestModal
        service={selectedService}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleSubmit}
        clientAddress={address}
      />

      {/* Modal de detalles del trabajo del historial */}
      <AppModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        title="Detalles del Servicio"
        description={
          selectedHistoryJob ? `ID de solicitud: ${selectedHistoryJob.id}` : ""
        }
        className="max-w-lg border-slate-700 bg-slate-900 text-white py-2 z-9999"
        footer={
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              className="flex-1 border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
              onClick={() => setDetailsModalOpen(false)}
            >
              Cerrar
            </Button>
            {/* BOTÓN CONECTADO AL FEEDBACK MANUAL */}
            <Button
              className="flex-1 bg-amber-400 text-slate-950 hover:bg-amber-300 disabled:opacity-50"
              disabled={
                selectedHistoryJob?.status === "PENDING" ||
                !selectedHistoryJob?.professional_id
              }
              onClick={() => {
                setDetailsModalOpen(false);
                setFeedbackJobId(selectedHistoryJob?.id ?? null);
                setTimeout(() => setFeedbackModalOpen(true), 300); // Pequeño delay para que cierre el primero
              }}
            >
              Dejar Feedback
            </Button>
          </div>
        }
      >
        {selectedHistoryJob && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800 p-4">
              <div className="flex size-14 mt-1 items-center justify-center rounded-lg bg-slate-900">
                {getServiceIcon(selectedHistoryJob.service_type)}
              </div>
              <div className="grid gap-1 grid-cols-1 min-w-0">
                <h4 className="font-semibold text-white capitalize">
                  {selectedHistoryJob.service_type}
                </h4>
                <p className="text-sm text-slate-400">
                  {getStatusBadge(selectedHistoryJob.status)}
                </p>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-sm">
              <div>
                <span className="block text-slate-400">Descripción:</span>
                <span className="font-medium text-slate-200">
                  {selectedHistoryJob.description
                    .split("[INFORME DEL PROFESIONAL]:")[0]
                    .trim()}
                </span>
              </div>

              <div className="flex justify-between border-t border-slate-700 pt-3 items-center">
                <span className="text-slate-400">Profesional asignado:</span>
                {selectedHistoryJob.professional_id ? (
                  <button
                    onClick={() =>
                      handleOpenProfProfile(selectedHistoryJob.professional_id!)
                    }
                    className="font-semibold text-amber-400 hover:text-amber-300 hover:underline transition-all cursor-pointer text-sm bg-amber-400/5 px-2.5 py-1 rounded-md border border-amber-500/20 flex items-center gap-2"
                  >
                    {isLoadingProfName ? (
                      <span className="text-slate-500 animate-pulse">
                        Cargando nombre...
                      </span>
                    ) : (
                      modalProfName || selectedHistoryJob.professional_id
                    )}
                  </button>
                ) : (
                  <span className="font-medium text-slate-500">
                    No asignado
                  </span>
                )}
              </div>

              {/* MOSTRAR MOTIVO SI ESTÁ CANCELADO */}
              {selectedHistoryJob.status === "CANCELLED" &&
                selectedHistoryJob.cancellation_reason && (
                  <div className="flex flex-col border-t border-slate-700 pt-3">
                    <span className="text-slate-400 mb-1">
                      Motivo de cancelación:
                    </span>
                    <span className="font-medium text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20">
                      {selectedHistoryJob.cancellation_reason.replace(
                        /_/g,
                        " ",
                      )}
                    </span>
                  </div>
                )}

              <div className="flex justify-between border-t border-slate-700 pt-3">
                <span className="text-slate-400">Fecha de solicitud:</span>
                <span className="font-medium text-slate-200">
                  {selectedHistoryJob.requested_date
                    ? new Date(
                        selectedHistoryJob.requested_date,
                      ).toLocaleString("es-AR")
                    : "Desconocida"}
                </span>
              </div>

              <div className="flex justify-between border-t border-slate-700 pt-3">
                <span className="text-slate-400">Monto final:</span>
                <span className="font-bold text-amber-400">
                  ${selectedHistoryJob.estimated_price.toLocaleString("es-AR")}
                </span>
              </div>
            </div>
          </div>
        )}
      </AppModal>

      <ProfessionalProfileModal
        professionalId={selectedProfId}
        open={profModalOpen}
        onOpenChange={setProfModalOpen}
      />

      {/* RENDERIZAR EL MODAL DE FEEDBACK */}
      <FeedbackModal
        jobId={feedbackJobId}
        professionalName={
          recentJobs.find((j) => j.id === feedbackJobId)?.professional_name ??
          null
        }
        open={feedbackModalOpen}
        onOpenChange={setFeedbackModalOpen}
      />
    </div>
  );
}
