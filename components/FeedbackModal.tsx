"use client";

import { useState } from "react";
import { AppModal } from "@/components/ui/app-modal";
import { Star, MessageSquareText, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedbackModalProps {
  jobId: string | null;
  professionalId?: string | null;
  professionalName?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackModal({
  jobId,
  professionalId,
  professionalName,
  open,
  onOpenChange,
}: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/reviews/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          professionalId,
          rating,
          comment,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          onOpenChange(false);

          setTimeout(() => {
            setIsSuccess(false);
            setRating(0);
            setComment("");
          }, 500);
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  return (
    <AppModal
      open={open}
      onOpenChange={isSubmitting || isSuccess ? () => {} : onOpenChange}
      title="Calificá el servicio"
      description={isSuccess ? "" : "¿Qué te pareció el trabajo realizado?"}
      className="max-w-md border-slate-700 bg-slate-900 text-white z-9999 py-4"
    >
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in zoom-in duration-300">
          <div className="size-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="size-8" />
          </div>
          <h3 className="text-xl font-bold text-white">
            ¡Gracias por tu opinión!
          </h3>
          <p className="text-slate-400 text-center text-sm">
            Tu feedback ayuda a mejorar la comunidad de FixNow.
          </p>
        </div>
      ) : (
        <div className="space-y-6 pt-4">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`size-10 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                        : "fill-slate-800 text-slate-700"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-sm font-medium text-amber-400 h-5">
              {rating === 1 && "Muy malo"}
              {rating === 2 && "Malo"}
              {rating === 3 && "Regular"}
              {rating === 4 && "Muy bueno"}
              {rating === 5 && "¡Excelente!"}
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <MessageSquareText className="size-4" /> Comentario (Opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ej: Llegó a tiempo, fue muy amable y resolvió el problema rápido..."
              className="w-full h-24 rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-none transition-all"
            />
          </div>

          <div className="flex w-full gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1 border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Hacerlo más tarde
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="flex-1 bg-amber-400 text-slate-950 hover:bg-amber-300 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Enviar reseña"
              )}
            </Button>
          </div>
        </div>
      )}
    </AppModal>
  );
}
