"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const MapDisplay = dynamic(() => import("@/components/MapDisplay"), {
  ssr: false,
  loading: () => (
    <div className="h-50 w-full animate-pulse rounded-lg bg-slate-200 flex items-center justify-center">
      <span className="text-sm text-slate-500">Cargando mapa...</span>
    </div>
  ),
});

type ServiceType = "plomeria" | "electricidad" | "gas";

interface EditJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedData: any) => void;
  jobId: string;
  initialService: string;
  initialDescription: string;
  initialDirection?: string | null;
  isScheduled?: boolean; // <-- NUEVO: Para saber si mostramos el selector de fecha
  initialRequestedDate?: string | null; // <-- NUEVO: Fecha original
}

// NUEVO: Diccionario de colores corporativos
const serviceStyles: Record<ServiceType, string> = {
  plomeria: "bg-plumbing border-plumbing text-white",
  electricidad: "bg-electrical border-electrical text-slate-950",
  gas: "bg-gas border-gas text-white",
};

export function EditJobModal({
  open,
  onOpenChange,
  onSuccess,
  jobId,
  initialService,
  initialDescription,
  initialDirection,
  isScheduled,
  initialRequestedDate,
}: EditJobModalProps) {
  const [service, setService] = useState<ServiceType>(
    initialService.toLowerCase() as ServiceType,
  );
  const [description, setDescription] = useState(initialDescription);
  const [address, setAddress] = useState(initialDirection ?? "");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [scheduledDateTime, setScheduledDateTime] = useState(""); // <-- NUEVO: Estado para la fecha
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setService(initialService.toLowerCase() as ServiceType);
      setDescription(
        initialDescription.split("[INFORME DEL PROFESIONAL]:")[0].trim(),
      );
      setAddress(initialDirection ?? "");
      setLat(null);
      setLng(null);
      setFormError(null);

      // NUEVO: Formateamos la fecha original para que el input datetime-local la pueda leer
      if (isScheduled && initialRequestedDate) {
        const dateObj = new Date(initialRequestedDate);
        const tzOffset = dateObj.getTimezoneOffset() * 60000;
        const localISOTime = new Date(dateObj.getTime() - tzOffset)
          .toISOString()
          .slice(0, 16);
        setScheduledDateTime(localISOTime);
      } else {
        setScheduledDateTime("");
      }
    }
  }, [
    open,
    initialService,
    initialDescription,
    isScheduled,
    initialRequestedDate,
  ]);

  const handleSubmit = async () => {
    setFormError(null);
    if (!description.trim()) return setFormError("Describe el problema.");
    if (address.trim() && (lat === null || lng === null))
      return setFormError("Esperando a ubicar tu dirección en el mapa...");

    // NUEVO: Validación de la nueva fecha programada
    let finalRequestedDate = null;
    if (isScheduled) {
      if (!scheduledDateTime)
        return setFormError("Selecciona una fecha y hora para el turno.");
      const selected = new Date(scheduledDateTime);
      if (selected <= new Date())
        return setFormError("La fecha programada debe ser a futuro.");
      finalRequestedDate = selected.toISOString();
    }

    setSubmitting(true);
    try {
      const payload: any = {
        service_type: service.toUpperCase(),
        description: description.trim(),
      };

      if (address.trim()) {
        payload.direction = address.trim();
      }

      if (lat !== null && lng !== null) {
        payload.lat = lat;
        payload.lng = lng;
      }

      if (finalRequestedDate) {
        payload.requested_date = finalRequestedDate;
      }

      const response = await fetch(`/api/v1/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Error al modificar");

      const data = await response.json();
      onSuccess(data);
      onOpenChange(false);
    } catch (err) {
      setFormError("Error de red, intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="border-b border-slate-200 p-6 bg-slate-100">
          <DialogTitle className="text-xl font-semibold text-slate-900">
            Modificar Solicitud
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 p-6 md:grid-cols-2 bg-white">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">
                Tipo de Servicio
              </Label>
              <div className="flex gap-2">
                {(["plomeria", "electricidad", "gas"] as ServiceType[]).map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => setService(s)}
                      className={cn(
                        "flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-all",
                        // APLICAMOS LOS COLORES ACÁ
                        service === s
                          ? serviceStyles[s]
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      {s}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">
                Descripción del problema
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none mt-2 bg-slate-100 border-slate-300 text-slate-900 min-h-30"
              />
            </div>

            {/* NUEVO: Selector de fecha condicional (Solo aparece si es un trabajo programado) */}
            {isScheduled && (
              <div className="space-y-2 pt-4 border-t border-slate-200">
                <Label className="text-sm font-medium text-slate-900">
                  Fecha y hora del turno
                </Label>
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-slate-900 outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          <div className="space-y-4 flex flex-col">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-900">
                ¿Deseas cambiar la dirección?
              </Label>
              <Input
                placeholder="Escribe una nueva dirección y ciudad..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-slate-100 border-slate-300 text-slate-900"
              />
            </div>

            {address.trim() && (
              <div className="relative h-40 w-full overflow-hidden rounded-lg">
                <MapDisplay
                  address={address}
                  onCoordinatesFound={(encontradoLat, encontradoLng) => {
                    setLat(encontradoLat);
                    setLng(encontradoLng);
                  }}
                />
              </div>
            )}
            <p className="text-xs text-slate-500">
              Si dejas el campo vacío, mantendremos tu ubicación original.
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
              className="border-slate-300 text-slate-900"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !description.trim()}
              className="bg-amber-400 text-slate-950 hover:bg-amber-300 font-semibold"
            >
              {submitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
