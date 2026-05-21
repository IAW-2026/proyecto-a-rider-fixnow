"use client";

import { useEffect } from "react";
// 1. IMPORTAMOS 'Circle' DE REACT-LEAFLET
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// Arreglo de íconos estándar de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Componente inteligente para mover la cámara
function MapController({
  clientPos,
  proPos,
  status,
}: {
  clientPos: [number, number];
  proPos: [number, number] | null;
  status: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (status === "ACCEPTED" && proPos) {
      // Si está en camino, alejamos para ver a los dos
      const bounds = L.latLngBounds([clientPos, proPos]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (status === "IN_PROGRESS") {
      // 2. Si llegó a trabajar, hacemos un zoom suave (flyTo) muy cerca de la casa
      map.flyTo(clientPos, 17, { duration: 1.5 });
    } else {
      // PENDING
      map.setView(clientPos, 15);
    }
  }, [map, clientPos, proPos, status]);

  return null;
}

interface JobTrackerMapProps {
  clientLocation: { lat: number; lng: number };
  professionalLocation?: { lat: number; lng: number } | null;
  status: string; // PENDING, ACCEPTED, IN_PROGRESS, etc.
}

export default function JobTrackerMap({
  clientLocation,
  professionalLocation,
  status,
}: JobTrackerMapProps) {
  const clientPos: [number, number] = [clientLocation.lat, clientLocation.lng];
  const proPos: [number, number] | null = professionalLocation
    ? [professionalLocation.lat, professionalLocation.lng]
    : null;

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={clientPos}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Pasamos el estado al controlador para que sepa cuándo hacer zoom */}
        <MapController clientPos={clientPos} proPos={proPos} status={status} />

        {/* Pin del Cliente (Siempre visible) */}
        <Marker position={clientPos}>
          <Popup>Tu ubicación</Popup>
        </Marker>

        {/* 3. LÓGICA GRÁFICA SEGÚN EL ESTADO */}

        {/* A. Si está en camino: Mostramos su pin y la línea punteada */}
        {status === "ACCEPTED" && proPos && (
          <>
            <Marker position={proPos}>
              <Popup>Profesional en camino</Popup>
            </Marker>
            <Polyline
              positions={[proPos, clientPos]}
              color="#f59e0b" // amber-500
              weight={4}
              dashArray="10, 10"
              className="animate-pulse"
            />
          </>
        )}

        {/* B. Si llegó y está trabajando: Mostramos un área de trabajo latiendo */}
        {status === "IN_PROGRESS" && (
          <Circle
            center={clientPos}
            radius={60} // Un radio de 60 metros alrededor de tu casa
            pathOptions={{
              color: "#10b981", // Verde esmeralda
              fillColor: "#10b981",
              fillOpacity: 0.3,
              weight: 2,
            }}
            className="animate-pulse" // Hace que el borde titile
          />
        )}
      </MapContainer>
    </div>
  );
}
