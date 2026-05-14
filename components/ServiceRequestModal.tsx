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
import { text } from "stream/consumers";

interface ServiceRequestModalProps {
  service: ServiceType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
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
}: ServiceRequestModalProps) {
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"immediate" | "scheduled">(
    "immediate",
  );

  if (!service) return null;

  const config = serviceLabels[service];
  const Icon = config.icon;

  const handleSubmit = () => {
    onSubmit();
    setDescription("");
    setUrgency("immediate");
    onOpenChange(false);
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
            <DialogTitle className={cn("text-xl font-semibold", config.color)}>
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
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-900">
              Confirmar ubicación
            </Label>
            <div className="relative mt-2 h-50 overflow-hidden rounded-lg border border-slate-300 bg-slate-200">
              {/* Simulated Map */}
              <div className="absolute inset-0 bg-linear-to-br ">
                <div className="absolute inset-0 opacity-20">
                  {/* Grid pattern */}
                  <div
                    className="h-full w-full"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, rgba(100, 116, 139, 0.5) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(100, 116, 139, 0.5) 1px, transparent 1px)
                      `,
                      backgroundSize: "40px 40px",
                    }}
                  />
                </div>
                {/* Location marker */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="absolute -inset-4 animate-ping rounded-full bg-plumbing/20" />
                    <div className="relative flex size-8 items-center justify-center rounded-full bg-amber-400 shadow-lg">
                      <MapPin className="size-4 text-slate-950" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-3 left-3 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium shadow-sm border border-slate-700">
                <span className="text-slate-200">Calle 123 #45-67, Bogotá</span>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Confirma que la ubicación es correcta o ajústala en el mapa
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 p-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!description.trim()}
            className="cursor-pointer bg-amber-400 text-slate-950 font-semibold hover:bg-amber-300 disabled:bg-slate-300 disabled:text-slate-500 px-6"
          >
            Enviar Solicitud
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
