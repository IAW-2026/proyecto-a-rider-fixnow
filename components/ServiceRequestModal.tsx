"use client";

import { useState } from "react";
import { Droplets, Zap, Flame, MapPin, Clock, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ServiceType } from "./ServiceCard";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Cargamos el componente de manera Lazy Loagding el SSR
const MapDisplay = dynamic(() => import("@/components/MapDisplay"), {
  ssr: false,
  loading: () => (
    <div className="h-50 w-full animate-pulse rounded-lg bg-slate-200 flex items-center justify-center">
      <span className="text-sm text-slate-500">Cargando mapa...</span>
    </div>
  ),
});

interface ServiceRequestModalProps {
  service: ServiceType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  clientAddress: string;
}

type JobUrgency = "immediate" | "scheduled";

interface JobRequestPayload {
  service_type: ServiceType;
  description: string;
  address: string;
  lat: number;
  lng: number;
  urgency: JobUrgency;
  requested_date: string | null;
}

const serviceLabels: Record<
  ServiceType,
  {
    label: string;
    icon: typeof Droplets;
    colorClass: string;
    headerBg: string;
    color: string;
  }
> = {
  plomeria: {
    label: "Plomería",
    icon: Droplets,
    colorClass: "bg-plumbing",
    headerBg: "bg-plumbing/20",
    color: "text-white",
  },
  electricidad: {
    label: "Electricidad",
    icon: Zap,
    colorClass: "bg-electrical",
    headerBg: "bg-electrical/20",
    color: "text-white",
  },
  gas: {
    label: "Gas",
    icon: Flame,
    colorClass: "bg-gas",
    headerBg: "bg-gas/20",
    color: "text-white",
  },
};

export function ServiceRequestModal({
  service,
  open,
  onOpenChange,
  onSubmit,
  clientAddress,
}: ServiceRequestModalProps) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<JobUrgency>("immediate");
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  if (!service) return null;

  const config = serviceLabels[service];
  const Icon = config.icon;

  const handleSubmit = async () => {
    setFormError(null);

    if (!description.trim()) {
      setFormError("Describe el problema.");
      return;
    }

    if (urgency === "scheduled") {
      if (!scheduledDateTime) {
        setFormError(
          "Por favor, selecciona una fecha y hora para el servicio programado.",
        );
        return;
      }

      const selected = new Date(scheduledDateTime);
      const now = new Date();
      if (selected <= now) {
        setFormError(
          "La fecha y hora deben ser futuras para servicios programados.",
        );
        return;
      }
    }

    if (lat === null || lng === null) {
      setFormError("Esperando a ubicar tu dirección en el mapa...");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        service_type: service,
        description: description.trim(),
        address: clientAddress,
        lat: lat,
        lng: lng,
        urgency,
        requested_date:
          urgency === "scheduled"
            ? new Date(scheduledDateTime).toISOString()
            : null,
      } satisfies JobRequestPayload;

      const response = await fetch("/api/v1/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setFormError(data?.message ?? "Error al enviar la solicitud");
        return;
      }

      const selectedUrgency = urgency;

      setDescription("");
      setUrgency("immediate");
      setScheduledDateTime("");
      onSubmit();

      router.refresh();

      if (selectedUrgency === "scheduled") {
        router.push("/dashboard/scheduled"); // Al nuevo panel de turnos
      } else {
        router.push("/dashboard/active"); // Al seguimiento en vivo
      }

      onOpenChange(false);
    } catch (err) {
      setFormError("Error de red, intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader
          className={cn(
            "border-b border-slate-200 p-6",
            config.colorClass,
            "bg-opacity-10",
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-lg",
                config.colorClass,
              )}
            >
              <Icon className="size-8 text-white" />
            </div>
            <DialogTitle className={cn("text-xl font-semibold")}>
              Solicitar servicios de {config.label}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="grid gap-6 p-6 md:grid-cols-2 bg-white">
          {/* Form Section */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-slate-900"
              >
                Descripción del problema
              </Label>
              <Textarea
                id="description"
                placeholder="Describe el problema que necesitas resolver..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none mt-2 bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-500 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 min-h-30"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-900">
                Urgencia
              </Label>
              {urgency === "scheduled" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="scheduledDate"
                    className="text-sm font-medium text-slate-900"
                  >
                    Fecha y hora del servicio a programar
                  </Label>
                  <input
                    id="scheduledDateTime"
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-slate-900 outline-none focus:border-amber-400"
                  />
                  <p className="text-xs text-slate-600">
                    Podés elegir solo horarios entre las 08:00hs y las 18:00hs.
                  </p>
                </div>
              )}
              <RadioGroup
                value={urgency}
                onValueChange={(v) =>
                  setUrgency(v as "immediate" | "scheduled")
                }
                className="grid grid-cols-2 gap-2 mt-3"
              >
                <Label
                  htmlFor="immediate"
                  className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-slate-300 px-4 py-3 transition-colors hover:border-slate-400 hover:bg-slate-100 has-checked:border-amber-400 has-checked:bg-amber-50"
                >
                  <RadioGroupItem value="immediate" id="immediate" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      Inmediato
                    </span>
                  </div>
                </Label>
                <Label
                  htmlFor="scheduled"
                  className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-slate-300 px-4 py-3 transition-colors hover:border-slate-400 hover:bg-slate-100 has-checked:border-amber-400 has-checked:bg-amber-50"
                >
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">
                      Programado
                    </span>
                  </div>
                </Label>
              </RadioGroup>
            </div>
          </div>

          {/* Map Section */}
          <div className="space-y-2 flex flex-col">
            <Label className="text-sm font-medium text-slate-900">
              Confirmar ubicación
            </Label>

            <div className="relative mt-2 h-50 w-full overflow-hidden rounded-lg">
              <MapDisplay
                address={clientAddress}
                onCoordinatesFound={(encontradoLat, encontradoLng) => {
                  setLat(encontradoLat);
                  setLng(encontradoLng);
                }}
              />
            </div>

            <p className="text-xs text-slate-600 mt-2">
              Se enviará al profesional a la dirección de tu cuenta:{" "}
              <span className="font-semibold text-slate-800">
                {clientAddress}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 border-t border-slate-200 bg-slate-50 p-6">
          {formError && (
            <p className="w-full text-right text-sm text-red-600">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              // Bloqueamos el botón si no tenemos descripción O si el mapa aún no trajo las coordenadas
              disabled={submitting || !description.trim() || lat === null}
              className="cursor-pointer bg-amber-400 text-slate-950 font-semibold hover:bg-amber-300 disabled:bg-slate-300 disabled:text-slate-500 px-6"
            >
              {submitting ? "Enviando..." : "Enviar Solicitud"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
