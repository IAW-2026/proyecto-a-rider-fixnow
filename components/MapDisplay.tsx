"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Loader2 } from "lucide-react";

//1. FIZ OBLIGATORIO PARA NEXT.JS: Arreglar el icono del pin de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

//2. COMPONENTE AYUDANTE: Hace que la camara se mueva suavemente a la nueva coordenada
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 15); // 15 es el nivel de zoom (nivel calle)
  return null;
}

interface MapDisplayProps {
  address: string;
  //Esta funcion le avisa al formulario "encontre los numeros"
  onCoordinatesFound: (lat: number, lng: number) => void;
}

export default function MapDisplay({
  address,
  onCoordinatesFound,
}: MapDisplayProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    //3. GEOCODIFICACION: Transformamos el texto en coordenadas usando OpenStreetMap
    const fetchCoordinates = async () => {
      try {
        const query = encodeURIComponent(`${address}, Bahia Blanca, Argentina`);
        //Agregamos el parametro &email= para que Nominatim sepa quienes somos y no nos bloquee
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&email=simonovich.121661@alu.uns.edu.ar`,
        );
        const data = await response.json();

        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setPosition([lat, lng]);
          onCoordinatesFound(lat, lng); //Le mandamos los datos al Modal
        } else {
          setError("No pudimos ubicar la direccion exacta en el mapa.");
          // Fallback: Centro de Bahia Blanca si al direccion es muy rara
          setPosition([-38.7167, -62.2833]);
          onCoordinatesFound(-38.7167, -62.2833);
        }
      } catch (err) {
        console.error("Error al obtener coordenadas:", err);
        setError("Error de conexion al cargar el mapa");
      }
    };

    if (address) {
      fetchCoordinates();
    }
  }, [address, onCoordinatesFound]);

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
        scrollWheelZoom={false} // Desactivamos el scroll para que no moleste al bajar por el modal
        style={{ height: "100%", width: "100%", zIndex: 10 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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

      {/* Mostramos un aviso si hubo un error al geocodificar pero igual mostramos el mapa */}
      {error && (
        <div className="absolute bottom-2 left-2 right-2 z-20 rounded bg-slate-900/90 p-2 text-xs text-red-400 backdrop-blur-sm">
          {error}
        </div>
      )}
    </div>
  );
}
