"use client";

import { useEffect, useState } from "react";
import { AppModal } from "@/components/ui/app-modal";
import {
  Star,
  Phone,
  Wrench,
  Trophy,
  Loader2,
  MessageSquareText,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Review {
  id: number;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

interface ProfessionalData {
  id: string;
  full_name: string;
  email: string;
  service_type: string;
  phone: string;
  rating: number;
  jobs_completed: number;
  is_verified: boolean;
  reviews: Review[];
}

interface ProfessionalProfileModalProps {
  professionalId?: string | null;
  professionalName?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfessionalProfileModal({
  professionalId,
  professionalName,
  open,
  onOpenChange,
}: ProfessionalProfileModalProps) {
  const [data, setData] = useState<ProfessionalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    // Cuando se abre el modal, preferimos buscar por `professionalId`.
    // Si no hay id pero sí un nombre, mostramos solo el nombre (no intentamos fetch).
    if (!open) return;

    if (professionalId) {
      setIsLoading(true);
      setShowReviews(false);
      fetch(`/api/v1/reviews/professional/${professionalId}`)
        .then((res) => res.json())
        .then((mockData) => {
          setData(mockData);
        })
        .catch((err) => console.error("Error fetching professional:", err))
        .finally(() => setIsLoading(false));
    } else {
      setData(null);
      setIsLoading(false);
    }
  }, [open, professionalName]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`size-4 ${i < rating ? "fill-amber-400 text-amber-400" : "fill-slate-700 text-slate-700"}`}
      />
    ));
  };

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Perfil del Profesional"
      description={
        data
          ? `ID de registro: ${data.id}`
          : (professionalName ?? "Buscando información...")
      }
      className="custom-scrollbar w-[min(92vw,28rem)] max-h-[90dvh] overflow-y-auto py-4 border-slate-700 bg-slate-900 text-white z-9999"
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Loader2 className="size-8 animate-spin mb-4 text-amber-400" />
          <p>Conectando con el sistema de Feedback...</p>
        </div>
      ) : data ? (
        <div className="space-y-6 pt-4">
          {/* Header del Profesional */}
          <div className="flex flex-col items-center text-center">
            <div className="size-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-3">
              <UserIcon name={data.full_name} />
            </div>

            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">{data.full_name}</h3>
              {data.is_verified && (
                <div
                  className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"
                  title="Profesional Verificado"
                >
                  <Check className="size-3" strokeWidth={3} />
                </div>
              )}
            </div>

            <p className="text-amber-400 font-medium text-sm flex items-center gap-1.5 justify-center mt-1 capitalize">
              <Wrench className="size-3.5" /> {data.service_type}
            </p>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 mb-1">
                <Star className="size-5 fill-amber-400 text-amber-400" />
                <span className="text-2xl font-bold text-white">
                  {data.rating}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Calificación Global
              </span>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 mb-1">
                <Trophy className="size-5 text-emerald-400" />
                <span className="text-2xl font-bold text-white">
                  {data.jobs_completed}
                </span>
              </div>
              <span className="text-xs text-slate-400">Trabajos Exitosos</span>
            </div>
          </div>

          {/* Contacto */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-200">
              <div className="flex size-8 items-center justify-center rounded-md bg-slate-900 text-slate-400">
                <Phone className="size-4" />
              </div>
              {data.phone}
            </div>
          </div>

          {/* Sección de Reseñas */}
          <div className="border-t border-slate-700 pt-4">
            {data?.reviews && data.reviews.length > 0 ? (
              !showReviews ? (
                <Button
                  onClick={() => setShowReviews(true)}
                  variant="outline"
                  className="w-full border-slate-700 bg-slate-800 text-white hover:bg-slate-700 hover:text-white"
                >
                  <MessageSquareText className="size-4 mr-2" />
                  Ver opiniones de clientes ({data.reviews.length})
                </Button>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">
                    Últimas Reseñas
                  </h4>
                  {data.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 text-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-amber-300">
                          {review.author}
                        </span>
                        <div className="flex gap-0.5">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <p className="text-slate-300 mb-2">{review.comment}</p>
                      <span className="text-xs text-slate-500">
                        {review.date}
                      </span>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2 rounded-xl border border-dashed border-slate-700 bg-slate-800/50 p-6 text-center">
                <MessageSquareText className="size-8 text-slate-500" />
                <p className="text-sm font-medium text-slate-300">
                  Aún no hay reseñas
                </p>
                <p className="text-xs text-slate-500">
                  Este profesional es nuevo o todavía no recibió calificaciones
                  de otros usuarios.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : professionalName ? (
        <div className="space-y-4 pt-4 text-center">
          <div className="size-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-3 mx-auto">
            <UserIcon name={professionalName} />
          </div>
          <h3 className="text-xl font-bold text-white">{professionalName}</h3>
          <p className="text-sm text-slate-400">
            Información limitada (solo nombre disponible)
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Loader2 className="size-8 animate-spin mb-4 text-amber-400" />
          <p>Conectando con el sistema de Feedback...</p>
        </div>
      )}
    </AppModal>
  );
}
// Componente helper para las iniciales (Pegar al final del archivo)
function UserIcon({ name }: { name: string }) {
  if (!name)
    return <span className="text-xl font-bold text-slate-400">PR</span>;

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return <span className="text-xl font-bold text-slate-400">{initials}</span>;
}
