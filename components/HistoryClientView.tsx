"use client";

import { useState, useEffect } from "react";
import {
  Droplets,
  Zap,
  Flame,
  Receipt,
  XCircle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { AppModal } from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import { ProfessionalProfileModal } from "@/components/ProfessionalProfileModal";
import { useSearchParams, useRouter } from "next/navigation";
import { FeedbackModal } from "@/components/FeedbackModal";

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

interface HistoryClientViewProps {
  jobs: JobSummary[];
}

const getServiceIcon = (type: string) => {
  if (type === "ELECTRICIDAD")
    return <Zap className="size-5 text-electrical" />;
  if (type === "GAS") return <Flame className="size-5 text-gas" />;
  return <Droplets className="size-5 text-plumbing" />;
};

const getStatusBadge = (status: string) => {
  if (status === "PAID")
    return (
      <span className="rounded bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-400">
        Pagado
      </span>
    );
  if (status === "CANCELLED")
    return (
      <span className="rounded bg-red-400/20 px-2 py-1 text-xs font-medium text-red-300">
        Cancelado
      </span>
    );
  return null;
};

export function HistoryClientView({ jobs }: HistoryClientViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filter, setFilter] = useState<"ALL" | "PAID" | "CANCELLED">("ALL");
  const [selectedHistoryJob, setSelectedHistoryJob] =
    useState<JobSummary | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackJobId, setFeedbackJobId] = useState<string | null>(null);
  const [isRedirectModalOpen, setIsRedirectModalOpen] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleOpenPaymentsDashboard = () => {
    setIsRedirectModalOpen(true);
  };

  const confirmRedirectToPayments = () => {
    setIsRedirecting(true);
    setTimeout(() => {
      setIsRedirecting(false);
      setIsRedirectModalOpen(false);
      // En la Etapa 3, acá harás un window.open o router.push a la URL de Chiara
      // window.open("http://localhost:3002/dashboard", "_blank");
    }, 1500);
  };

  // Estados Modal Profesional
  const [profModalOpen, setProfModalOpen] = useState(false);
  const [selectedProfName, setSelectedProfName] = useState<string | null>(null);
  const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
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
      // Limpiamos la URL para que no vuelva a saltar si recarga la página
      router.replace("/dashboard/history");
    }
  }, [searchParams, router]);

  const handleOpenProfProfile = (
    profId: string | null,
    profName?: string | null,
  ) => {
    setSelectedProfId(profId ?? null);
    setSelectedProfName(profName ?? profId ?? null);
    setProfModalOpen(true);
  };

  const paidJobs = jobs.filter((j) => j.status === "PAID");
  const cancelledJobs = jobs.filter((j) => j.status === "CANCELLED");
  const totalSpent = jobs.reduce(
    (acc, current) => acc + current.estimated_price,
    0,
  );

  const displayedJobs = jobs.filter(
    (j) => filter === "ALL" || j.status === filter,
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Mi Historial
          </h1>
          <p className="mt-1 text-lg text-slate-400">
            Resumen de tu actividad y pagos en FixNow
          </p>
        </div>

        {/* NUEVO BOTÓN DE ACCESO A LA BILLETERA */}
        <Button
          onClick={handleOpenPaymentsDashboard}
          className="flex items-center gap-2 bg-slate-800 text-amber-400 hover:bg-slate-700 hover:text-amber-300 border border-slate-700 shadow-sm transition-all h-11 px-5"
        >
          <CreditCard className="size-5" />
          <span className="cursor-pointer font-semibold text-base">
            Mi Billetera FixNow
          </span>
          <ExternalLink className="size-4 ml-1 opacity-70" />
        </Button>
      </div>

      {/* MÉTRICAS FINANCIERAS */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Receipt className="size-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Total invertido</p>
            <p className="text-2xl font-bold text-white">
              ${totalSpent.toLocaleString("es-AR")}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Servicios completados</p>
            <p className="text-2xl font-bold text-white">{paidJobs.length}</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-slate-700 text-slate-400">
            <XCircle className="size-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Cancelaciones</p>
            <p className="text-2xl font-bold text-white">
              {cancelledJobs.length}
            </p>
          </div>
        </div>
      </div>

      {/* PESTAÑAS DE FILTRADO */}
      <div className="flex gap-2 border-b border-slate-700 pb-4">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${filter === "ALL" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter("PAID")}
          className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${filter === "PAID" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-white"}`}
        >
          Pagados
        </button>
        <button
          onClick={() => setFilter("CANCELLED")}
          className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${filter === "CANCELLED" ? "bg-red-500/20 text-red-400" : "text-slate-400 hover:text-white"}`}
        >
          Cancelados
        </button>
      </div>

      {/* LISTA DE TRABAJOS */}
      {displayedJobs.length === 0 ? (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-12 text-center">
          <p className="text-slate-400">No hay servicios en esta categoría.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {displayedJobs.map((job) => (
            <button
              key={job.id}
              onClick={() => {
                setSelectedHistoryJob(job);
                setDetailsModalOpen(true);
              }}
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
                      <p className="line-clamp-1 text-sm text-slate-400">
                        {job.description
                          .split("[INFORME DEL PROFESIONAL]:")[0]
                          .trim()}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(job.status)}
                </div>
              </div>
              <div className="mt-4 flex w-full items-center justify-between border-t border-slate-700 pt-4">
                <span className="font-semibold text-amber-300">
                  ${job.estimated_price.toLocaleString("es-AR")}
                </span>
                <span className="text-xs text-slate-500">
                  {job.requested_date
                    ? new Date(job.requested_date).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Fecha desconocida"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* MODAL DE DETALLES */}
      <AppModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        title="Comprobante de Servicio"
        description={
          selectedHistoryJob ? `ID de operación: ${selectedHistoryJob.id}` : ""
        }
        className="max-w-lg border-slate-700 bg-slate-900 text-white"
        footer={
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              className="flex-1 border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
              onClick={() => setDetailsModalOpen(false)}
            >
              Cerrar
            </Button>
            {/* NUEVO: Botón de Feedback Habilitado */}
            <Button
              className="flex-1 bg-amber-400 text-slate-950 hover:bg-amber-300 disabled:opacity-50"
              disabled={
                selectedHistoryJob?.status === "PENDING" ||
                !selectedHistoryJob?.professional_id
              }
              onClick={() => {
                setDetailsModalOpen(false);
                setFeedbackJobId(selectedHistoryJob?.id ?? null);
                setTimeout(() => setFeedbackModalOpen(true), 300);
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
              <div className="flex size-12 items-center justify-center rounded-lg bg-slate-900">
                {getServiceIcon(selectedHistoryJob.service_type)}
              </div>
              <div>
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
                    className="font-semibold text-amber-400 hover:text-amber-300 hover:underline transition-all cursor-pointer text-sm bg-amber-400/5 px-2.5 py-1 rounded-md border border-amber-500/20"
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

              {/* NUEVO: Mostrar motivo si está cancelado */}
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
                    : "Fecha desconocida"}
                </span>
              </div>

              <div className="flex justify-between border-t border-slate-700 pt-3">
                <span className="text-slate-400">Monto total abonado:</span>
                <span className="font-bold text-amber-400">
                  ${selectedHistoryJob.estimated_price.toLocaleString("es-AR")}
                </span>
              </div>
            </div>

            {selectedHistoryJob.status === "PAID" && (
              <Button
                variant="link"
                className="w-full text-sm text-amber-400 hover:text-amber-300"
                disabled
              >
                Descargar factura / comprobante PDF
              </Button>
            )}
          </div>
        )}
      </AppModal>

      {/* MODAL DE SIMULACIÓN DE REDIRECCIÓN A PAYMENTS */}
      <AppModal
        open={isRedirectModalOpen}
        onOpenChange={(open) => {
          setIsRedirectModalOpen(open);
          if (!open) setIsRedirecting(false);
        }}
        title="Billetera y Facturación"
        description="Serás redirigido de forma segura a FixNow Payments. Allí podrás ver tu dashboard financiero completo, descargar tus facturas y gestionar tus métodos de pago."
        icon={<CreditCard className="size-7 text-amber-300" />}
        className="border-slate-700 bg-slate-900 text-white z-9999"
        footer={
          <>
            <Button
              variant="outline"
              className="flex-1 border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
              onClick={() => setIsRedirectModalOpen(false)}
              disabled={isRedirecting}
            >
              Cancelar
            </Button>
            <Button
              className="cursor-pointer flex-1 bg-amber-400 text-slate-950 hover:bg-amber-300 font-semibold"
              onClick={confirmRedirectToPayments}
              disabled={isRedirecting}
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Ir a Payments"
              )}
            </Button>
          </>
        }
      ></AppModal>

      {/* MODAL PERFIL DEL PROFESIONAL */}
      <ProfessionalProfileModal
        professionalId={selectedProfId}
        professionalName={selectedProfName}
        open={profModalOpen}
        onOpenChange={setProfModalOpen}
      />

      {/* MODAL DE FEEDBACK (LAS 5 ESTRELLAS) */}
      <FeedbackModal
        jobId={feedbackJobId}
        professionalId={
          jobs.find((j) => j.id === feedbackJobId)?.professional_id ?? null
        }
        open={feedbackModalOpen}
        onOpenChange={setFeedbackModalOpen}
      />
    </div>
  );
}
