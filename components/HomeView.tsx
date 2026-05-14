"use client";

import { useState } from "react";
import { ServiceCard, type ServiceType } from "./ServiceCard";
import { ServiceRequestModal } from "./ServiceRequestModal";

interface HomeViewProps {
  userName?: string;
}

export function HomeView({ userName = "Catalina" }: HomeViewProps) {
  const [selectedService, setSelectedService] = useState<ServiceType | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);

  const handleServiceClick = (service: ServiceType) => {
    setSelectedService(service);
    setModalOpen(true);
  };

  const handleSubmit = () => {
    // TODO: Agregar funcionalidad de envío de solicitud
    setSelectedService(null);
    setModalOpen(false);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Hola, <span className="text-amber-400">{userName}</span>.
        </h1>
        <p className="mt-1 text-lg text-slate-400">
          ¿Qué necesitas resolver hoy?
        </p>
      </div>

      {/* Services Grid */}
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

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Actividad Reciente</h2>
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="flex items-center justify-center py-8 text-center">
            <p className="text-sm text-slate-400">
              No tienes servicios recientes. ¡Solicita tu primer servicio!
            </p>
          </div>
        </div>
      </div>

      <ServiceRequestModal
        service={selectedService}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
