"use client";

import { Droplets, Zap, Flame, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ServiceType = "plomeria" | "electricidad" | "gas";

interface ServiceCardProps {
  service: ServiceType;
  onClick: () => void;
}

const serviceConfig: Record<
  ServiceType,
  {
    label: string;
    icon: LucideIcon;
    color: string;
    hoverBorder: string;
    hoverBg: string;
    bgColor: string;
    hoverBgColor: string;
    iconWrapper: string;
    iconWrapperHover: string;
  }
> = {
  plomeria: {
    label: "Plomería",
    icon: Droplets,
    color: "text-plumbing",
    hoverBorder: "border-plumbing",
    hoverBg: "group-hover:bg-plumbing",
    bgColor: "bg-plumbing/40",
    hoverBgColor: "group-hover:bg-plumbing/15",
    iconWrapper: "border-plumbing/40 bg-plumbing/10",
    iconWrapperHover:
      "group-hover:border-plumbing/80 group-hover:bg-plumbing/30",
  },
  electricidad: {
    label: "Electricidad",
    icon: Zap,
    color: "text-electrical",
    hoverBorder: "border-electrical",
    hoverBg: "group-hover:bg-electrical",
    bgColor: "bg-electrical/40",
    hoverBgColor: "group-hover:bg-electrical/15",
    iconWrapper: "border-electrical/40 bg-electrical/10",
    iconWrapperHover:
      "group-hover:border-electrical/80 group-hover:bg-electrical/30",
  },
  gas: {
    label: "Gas",
    icon: Flame,
    color: "text-gas",
    hoverBorder: "border-gas",
    hoverBg: "group-hover:bg-gas",
    bgColor: "bg-gas/40",
    hoverBgColor: "group-hover:bg-gas/15",
    iconWrapper: "border-gas/40 bg-gas/10",
    iconWrapperHover: "group-hover:border-gas/80 group-hover:bg-gas/30",
  },
};

export function ServiceCard({ service, onClick }: ServiceCardProps) {
  const config = serviceConfig[service];
  const Icon = config.icon;

  const borderColor = {
    plomeria: "border-plumbing hover:border-plumbing/80",
    electricidad: "border-electrical hover:border-electrical/80",
    gas: "border-gas hover:border-gas/80",
  }[service];

  return (
    <button
      onClick={onClick}
      className={cn(
        "cursor-pointer group relative flex flex-col items-start gap-4 rounded-lg border-2 p-6 text-left transition-all duration-200",
        config.bgColor,
        config.hoverBgColor,
        borderColor,
      )}
    >
      <div
        className={cn(
          "service-icon-wrapper flex size-14 items-center justify-center rounded-lg border transition-colors",
          config.iconWrapper,
          config.iconWrapperHover,
        )}
      >
        <Icon
          className={cn(
            "size-7 transition-colors",
            config.color,
            "group-hover:text-slate-950",
          )}
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">{config.label}</h3>
        <p className="mt-1 text-sm text-slate-400">
          {service === "plomeria" && "Fugas, cañerías, instalaciones y más"}
          {service === "electricidad" && "Instalaciones, cortos, mantenimiento"}
          {service === "gas" && "Revisiones, fugas, instalaciones seguras"}
        </p>
      </div>
    </button>
  );
}
