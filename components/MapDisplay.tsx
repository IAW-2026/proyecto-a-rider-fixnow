"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Loader2, MapPin } from "lucide-react"; // Importamos el MapPin para el fallback

// FIX OBLIGATORIO PARA NEXT.JS
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 15);
  return null;
}

interface MapDisplayProps {
  address: string;
  onCoordinatesFound: (lat: number, lng: number) => void;
}

const DEFAULT_LAT = -38.7183;
const DEFAULT_LNG = -62.2661;

export default function MapDisplay({
  address,
  onCoordinatesFound,
}: MapDisplayProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const fetchCoordinates = async () => {
      try {
        const query = encodeURIComponent(`${address}, Bahía Blanca, Argentina`);

        // Petición a la API
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&email=simonovich.121661@uns.edu.ar`,
          { headers: { "Accept-Language": "es" } },
        );

        if (!response.ok) throw new Error("Error de red");

        const data = await response.json();

        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setPosition([lat, lng]);
          onCoordinatesFound(lat, lng);
        } else {
          // Fallback SUAVE: La API anduvo, pero no encontró la calle. Mostramos el mapa real en el centro de la ciudad.
          setPosition([DEFAULT_LAT, DEFAULT_LNG]);
          onCoordinatesFound(DEFAULT_LAT, DEFAULT_LNG);
        }
      } catch (err) {
        console.error("Error buscando coordenadas (Bloqueo de IP o Red):", err);
        // Fallback DURO: La API falló. Activamos el mapa visual de contingencia.
        setUseFallback(true);
        onCoordinatesFound(DEFAULT_LAT, DEFAULT_LNG); // Destrabamos el botón del formulario
      }
    };

    if (address) {
      fetchCoordinates();
    }
  }, [address, onCoordinatesFound]);

  if (useFallback) {
    return (
      <div className="relative h-48 w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
        <div className="absolute inset-0 opacity-20">
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
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="absolute -inset-4 animate-ping rounded-full bg-amber-400/20" />
            <div className="relative flex size-8 items-center justify-center rounded-full bg-amber-400 shadow-lg">
              <MapPin className="size-4 text-slate-950" />
            </div>
          </div>
        </div>
        <div className="absolute bottom-2 left-2 right-2 rounded bg-slate-900/90 p-2 text-xs text-amber-400 border border-amber-900/50 backdrop-blur-sm text-center">
          Problemas de conexión con el mapa. Usando ubicación aproximada.
        </div>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-800">
        <Loader2 className="size-6 animate-spin text-amber-400" />
        <span className="ml-2 text-sm text-slate-400">
          Buscando ubicación...
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-lg border border-slate-700">
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", zIndex: 10 }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={position} />
        <Marker position={position}>
          <Popup>
            <span className="font-semibold text-slate-900">
              Ubicación del servicio
            </span>
            <br />
            <span className="text-sm">{address}</span>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
